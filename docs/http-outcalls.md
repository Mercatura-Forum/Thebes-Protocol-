# HTTP outcalls

A Thebes smart contract can fetch a URL from the open internet. The validators
make the request, agree on the response, and hand it to your contract as
ordinary replicated state. This page is the developer guide to the
[`Http`](../src/Http.mo) module; the worked contract is
[`examples/http-outcall`](../examples/http-outcall).

## The shape: two messages

An outcall is **submit, then read** — two separate calls.

```motoko
import Http "mo:thebes-outcalls/Http";

persistent actor {
  var body : Text = "";

  public func start(url : Text) : async Bool {
    switch (Http.submit(Http.get(url))) { case (#ok) true; case (#err _) false };
  };

  public func read() : async ?Text {
    switch (Http.poll()) {
      case (#pending) null;
      case (#ready r) { body := switch (Http.text(r)) { case (?t) t; case null "" }; ?body };
    }
  };
}
```

`submit` returns as soon as the request is queued — **not** when it has
completed. The response is fetched between messages and read from a later
call with `poll`. This is the one thing to get right when porting from a
platform where the fetch blocks: on Thebes it never blocks, and the response
is not in the reply to `submit`.

`submit` is **update-only**. Submitting from a query is a compile-time error,
because a query runs on only some validators and an outcall submitted from one
would not be seen by the rest. Reading the response — `poll`, `headerValue` —
is query-safe.

## Reading the response

The completed response lives in **update-execution context**. Read it from an
update call. A query cannot see it directly — so if you want to serve a fetched
value from a query, copy it into stable state in the update that reads it
(as `read` does above with `body`), and let the query return the stored copy.

## Quorum is per call

You choose, on each request, how many validators must independently fetch the
URL and agree:

```motoko
Http.submit(Http.withQuorum(Http.get(url), 4));   // four must agree
```

Quorum 1 is one validator — cheap, fine for a best-effort read. A value you
will act on financially should use a higher quorum so no single validator can
determine the result.

Agreement is on a **canonical hash of the whole response** — status, headers,
and body. There is **no transform callback**: you do not write a function to
strip volatile fields. The consequence is a rule to remember: at quorum ≥ 2 the
endpoint must return **byte-identical responses, headers included**. An
endpoint that stamps a `Date` header, a request id, or any per-request value
will not reach agreement above quorum 1. Point higher-quorum calls at
endpoints that return stable content, or keep those calls at quorum 1.

## Response headers: values by index, not by name

You can read how many headers the response has and the **value** at a given
index:

```motoko
let n = Http.headerCount();
let firstValue = Http.headerValue(0);   // ?Text
```

There is **no accessor for header names** — a value cannot be looked up by
name, only by position. This is a real limit of the host interface, not the
module: if you need a particular header, either request an endpoint that
returns it in the body, or read by position when the order is known. The module
does not invent names it cannot obtain.

## Methods and bodies

```motoko
Http.get(url)                        // GET
Http.post(url, blob)                 // POST with a body
Http.request(url, #put)              // any of #get #post #head #put #delete
Http.withHeader(req, "accept", "application/json")
Http.withBody(req, blob)
```

`submit` returns `#err(#rejected)` if the runtime refuses the request (a
malformed URL, an unsupported scheme, a body on a method that forbids one, or a
quorum out of range), or `#err(#headerRejected name)` if a header is refused.

## How long it takes

Measured on Memphis: after `submit`, the response is typically ready by your
next message — in sampling, the first `read` after a `start` returned the
response every time. The user-visible time from submit to a response you can
read is therefore bounded by one read round-trip (a few seconds on the current
network), not by a separate wait for the fetch. Because the read is an update
call, that round-trip is also the finest granularity you can observe the
timing at; the fetch itself completes within the submitting block.

## API reference

| Function | Kind | Purpose |
|---|---|---|
| `get(url)` / `post(url, body)` / `request(url, method)` | build | start a request (quorum 1, no headers) |
| `withQuorum(req, n)` / `withBody(req, b)` / `withHeader(req, n, v)` | build | refine a request |
| `submit(req) : { #ok; #err }` | update | queue the outcall |
| `poll() : { #pending; #ready : Response }` | read | fetch the response if it has landed |
| `text(resp) : ?Text` | read | body as UTF-8, or `null` |
| `headerCount() : Nat32` | read | number of response headers |
| `headerValue(idx) : ?Text` | read | header value at `idx` (no name lookup) |

Types: `Method = { #get; #post; #head; #put; #delete }`,
`Response = { status : Nat16; body : Blob }`,
`Error = { #rejected; #headerRejected : Text }`.
