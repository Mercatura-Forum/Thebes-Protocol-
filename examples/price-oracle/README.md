# price-oracle

External readings a contract can trust, both shapes: a **quorum fetch** (one
URL, two validators must agree byte-for-byte) cached with a known age, and a
**survey** (three sources fetched by different validators) reduced in the
contract to a guarded median a single wrong source cannot steer. Written in
**Motoko** on the `Http`, `HttpOracle`, and `HttpSurveyReduce` modules that
ship with the Thebes Motoko compiler.

The full walkthrough of the outcall system is
[`docs/http-outcalls.md`](../../docs/http-outcalls.md).

## Interface

| Method | Kind | Args | Returns | Notes |
|---|---|---|---|---|
| `poke` | update | — | — | lands a delivered fetch, keeps one in flight |
| `price` | query | — | `?text` | cached feed body if fetched in the last 5 minutes |
| `askSources` | update | — | `text` | submits the 3-source survey |
| `thebesSurveyDeliver` | update | — | — | runtime-invoked at finalization; stores the guarded median |
| `median` | query | — | `?int` | the survey's majority-backed median |

## Build

Requires the Thebes Motoko compiler (the `Http*` modules ride on Thebes host
functions; stock Motoko has no such primitives):

```sh
moc $(mops sources) --package thebes <thebes-motoko>/thebes-base -o build/price-oracle.wasm motoko/main.mo
```

## Notes

- Replace the `*.example` URLs with real feeds. Keep `#bodyOnly` for any
  endpoint you do not control.
- The survey reduction accepts a value only when a strict majority of the
  asked sources produced one; otherwise the previous value stands. That —
  not the fetching — is what makes a multi-source oracle robust.
- Every delivered handle is freed; the per-canister budget is 8 fetches and
  4 surveys in flight.
