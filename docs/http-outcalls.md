# HTTP outcalls — fetching the open internet from a smart contract

A Thebes smart contract can fetch any URL from the open internet, with the
result agreed by the validator set and carried inside a finalized block. The
outcall surfaces are **live on the Thebes production chain**.

Written for Motoko (`import Http "mo:thebes/Http"`, shipped with the Thebes
Motoko compiler in `thebes-base/`). Three ideas make this different from other
chains' HTTP outcalls:

1. **Quorum is per call.** Each request chooses how many validators must
   independently fetch the URL and agree. A cheap advisory read runs at
   quorum 1; a settlement-grade read at quorum 4 — in the same contract.
2. **Agreement is declared, not programmed.** No transform callback. The
   request declares which parts of the response count for agreement:
   - `#bodyOnly` — status + body. **The one to use against real third-party
     APIs**: an endpoint stamping a `Date` header or a request id still
     agrees at any quorum. No headers are delivered.
   - `#headers ["content-type", "etag"]` — status + body + exactly these
     headers (matched case-insensitively, delivered lowercased, in your
     listed order).
   - `#full` (default) — status + every header + body must be byte-identical
     across validators. Only sound for an endpoint **you control**.
3. **Submit and read are two messages.** The response is never available in
   the update that submits the request. Submit in one update; poll from a
   later one. This is the single thing to get right when porting.

Submits are **update-only** (compile-time error from a query — the compiler's
`M9102` check). Polling and header reads are query-safe — but the delivered
response lives in update-execution context, so if a query must serve it, copy
it into stable state from an update first.

## The v2 API — use this for all new code

```motoko
import Http "mo:thebes/Http";

persistent actor {
  var priceHandle : Http.Handle = 0;
  var lastPrice : Text = "";

  // 1. Submit (update)
  public func fetchPrice() : async Text {
    let req = Http.get("https://api.example.com/v1/price?pair=ICP-USD")
      |> Http.withQuorum(_, 2)
      |> Http.withAgreement(_, #bodyOnly)
      |> Http.withMaxResponseBytes(_, 4096)
      |> Http.withHeader(_, "accept", "application/json");
    switch (Http.submitV2(req)) {
      case (#ok h)  { priceHandle := h; "submitted" };
      case (#err(#notActive))       "outcalls not enabled on this chain";
      case (#err(#tooManyInFlight)) "8 outcalls already in flight — free some";
      case (#err(#rejected))        "runtime rejected the request";
    }
  };

  // 2. Read in a LATER update
  public func readPrice() : async Text {
    switch (Http.pollV2(priceHandle)) {
      case (#pending)       "still pending";
      case (#tooLarge)      "response exceeded maxResponseBytes";
      case (#unknownHandle) "handle freed/evicted/never issued";
      case (#ready r) {
        lastPrice := switch (Http.text(r)) { case (?t) t; case null "" };
        ignore Http.free(priceHandle);   // 3. release the slot
        lastPrice
      };
    }
  };
}
```

Builders: `Http.get(url)` / `Http.post(url, body)` / `Http.request(url, method)`
with `withQuorum`, `withBody`, `withHeader`, `withAgreement`,
`withMaxResponseBytes`. Methods: `#get #post #head #put #delete`.

Reading headers (only agreed headers are delivered — `#bodyOnly` delivers none):

```motoko
let etag : ?Text = Http.headerValueByName(h, "ETag");   // case-insensitive, first match
let all : [(Text, Text)] = Http.responseHeaders(h);     // (name, value), lowercased names
```

## Limits and errors

| Surface | Limit |
|---|---|
| In flight per canister | **8** (`#tooManyInFlight` on the 9th). Per canister, not global — another canister's traffic never consumes your slots. |
| `maxResponseBytes` | 1 ..= **2 MiB** (default 2 MiB); oversize → deterministic `#tooLarge`, quorum-agreed |
| Quorum | 1 up to the validator count (4 on the production chain) |
| Header name | ≤ 256 chars |
| Response slots | Hold until `free(h)` — always free delivered responses you're done with |

`#err(#rejected)` covers: malformed URL/unsupported scheme, body on a body-less
method, quorum 0, size bound out of range, too many headers — **and a same-URL
resubmission colliding with an identical in-flight request** (the dedup key
includes the URL; add a cache-buster query param if you legitimately need the
same URL twice in flight).

`pollV2` on a freed or evicted handle returns `#unknownHandle` — never another
request's bytes. That isolation is the point of handles.

## Surveys — many sources, one in-block delivery, YOU reduce

A survey is a different trust shape: instead of N validators agreeing on ONE
source, different validators fetch **different sources** (2..=64 URLs, GET),
every response is carried in-block attributed, and **your canister reduces
them in Motoko** (median, outlier rejection, min-ok counts). There is no
`quorum` — redundancy is source count × per-source `replication`. Each source
at replication 1 is one validator's untrusted word, so the reduction MUST be
robust: median + a minimum-ok count.

```motoko
let s = Http.survey(["https://a.example/price", "https://b.example/price", "https://c.example/price"])
  |> Http.withSurveyAgreement(_, #bodyOnly)     // applied PER SOURCE
  |> Http.withReplication(_, 2)                  // validators per source
  |> Http.withDeadlineBlocks(_, 256);            // unreported sources finalize #failed
switch (Http.submitSurvey(s)) { case (#ok h) {...}; case (#err e) {...} };

// pollSurvey(h) : { #pending; #ready : [SourceOutcome] }
//   SourceOutcome = { #ok : Response; #failed }   // per-source, in your order
// surveyHeaderByName(h, srcIdx, name), freeSurvey(h)
```

In-flight cap: **4 surveys** per canister. Defaults: `#full`, replication 1,
2 MiB per source, deadline 256 blocks.

### The `thebesSurveyDeliver` contract — restart-safe results

At each survey's finalization block, the runtime invokes a public function
named **`thebesSurveyDeliver`** on your canister. Implement it to sweep your
handles, poll the within-block slot, and store the reduced outcome **into
your persisted state**. That persistence is what lets a validator restarted
mid-survey re-derive identical state. Requirements:

- **Idempotent**: skip handles already delivered; a still-pending slot is a
  no-op.
- Being public is harmless: it only reads the block-derived slot, so a user
  calling it early is a no-op and calling it late stores the identical
  outcome.
- Read final results from your persisted store, never from a live re-poll.

## The helper modules

Three modules ship next to `Http.mo` and package the patterns above:

- **`HttpOracle`** — the cached external reading. A pure state record with
  `refresh` (submit if none in flight), `settle` (land a delivered response),
  and `read` (the cached value classified `#fresh`/`#stale`/`#empty` by a
  caller-chosen maximum age). Defaults to quorum 2 + `#bodyOnly`.
- **`HttpHandles`** — name-keyed bookkeeping for the 8-slot budget. `submit`
  refuses over a still-pending key (`#keyBusy`) instead of leaking the slot;
  `harvest` frees the host slot the moment you take the response; `sweep`
  frees everything no longer pending.
- **`HttpSurveyReduce`** — the robust survey reduction: `robustInt(outcomes,
  ?"px")` is the median of the per-source parsed values, `null` unless a
  strict majority of the asked sources produced one — so a minority of wrong,
  failed, or corrupted sources cannot steer the answer. `firstInt`/`intAfter`
  cover the flat-JSON bodies price APIs return; the non-robust `mean` is
  retained so the difference stays observable.

```motoko
public func thebesSurveyDeliver() : async () {
  switch (Http.pollSurvey(surveyHandle)) {
    case (#ready outcomes) {
      switch (SurveyReduce.robustInt(outcomes, ?"px")) {
        case (?px) { lastPrice := px };   // majority-backed median
        case null  {};                    // too few sources — keep the old value
      };
    };
    case (#pending) {};
  };
};
```

## The v1 legacy surface — do not use for new code

`submit`/`poll` (one response slot, index-only header access) keeps working
unchanged, with one hard ceiling: **a v1 request at quorum = the validator
count never completes** — no error, no timeout; it pends forever. Keep v1
quorum ≤ validators − 1, or use `submitV2`, which completes at any quorum up
to the validator count.

## Checklist for a production-grade outcall consumer

- [ ] `#bodyOnly` (or `#headers` naming exactly what you need) for any third-party API
- [ ] Quorum chosen per call: 1–2 for advisory reads, 3–4 for anything funds touch
- [ ] `maxResponseBytes` set to a realistic bound, not the 2 MiB default
- [ ] Submit and read in separate updates; result copied to stable state if queries serve it
- [ ] Every delivered handle eventually `free`d (8-slot cap)
- [ ] `#notActive` / `#tooManyInFlight` / `#tooLarge` all handled explicitly
- [ ] Surveys: robust reduction (median + minOk) and an idempotent `thebesSurveyDeliver`

The authoritative API reference is the module documentation in `Http.mo`,
`HttpOracle.mo`, `HttpHandles.mo`, and `HttpSurveyReduce.mo`, shipped with the
Thebes Motoko compiler. A complete runnable starter lives at
[`examples/price-oracle`](../examples/price-oracle).
