# http-outcall

Fetch a URL from the open internet, inside a smart contract. The contract
submits an outcall in one update, the validators fetch the URL and agree on
the response, and a later update reads it. State is replicated across the
validator set and sealed into the chain's history like any other contract —
here that state is the last response fetched.

Uses the [`Http`](../../src/Http.mo) module. See the full write-up in
[docs/http-outcalls.md](../../docs/http-outcalls.md).

## Interface

| Method | Kind | Args | Returns | Notes |
|---|---|---|---|---|
| `start` | update | `text` (url) | `bool` | submits the outcall at quorum 1; returns whether it was queued |
| `read` | update | — | `opt (nat16, text)` | returns `(status, body)` once landed, else `null`; stores it |
| `last` | query | — | `(nat16, text)` | the last response read, from replicated state |

An outcall is **two messages**: `start` submits, a later `read` returns the
result. The completed response lives in update-execution context, so `read`
is an update — it copies the response into stable state, which the `last`
query then serves.

## Deploy

`thebes.toml`:

```toml
[project]
name = "http-outcall"
default_network = "wan"
chain_id = 2026

[networks.wan]
gateway = "https://<boundary-host>"
routing = "smart"

[canisters.http-outcall]
type   = "backend-motoko"
cid    = "auto"
source = "motoko/main.mo"
wasm   = "build/http-outcall.wasm"
build  = "mkdir -p build && moc --legacy-persistence -o build/http-outcall.wasm motoko/main.mo"
```

The `moc` on your `PATH` must be the Thebes compiler — it is what provides the
outcall host functions the `Http` module calls. Then:

```sh
thebes-deploy deploy
```

## Call it

```sh
thebes-deploy call  http-outcall start '("https://example.com")'   # → (true)
thebes-deploy call  http-outcall read                              # → (opt (200, "<!doctype html>…"))
thebes-deploy query http-outcall last                              # → (200, "<!doctype html>…")
```

The first `read` after a `start` returns the response — it is typically ready
by your next message. If it returns `null`, the outcall has not landed yet;
call `read` again.

## Quorum, and what it costs

`start` here uses quorum 1 — one validator fetches the URL. For a value you
are going to act on (a price, an settlement confirmation), raise the quorum so
several validators must independently fetch and agree:

```motoko
Http.submit(Http.withQuorum(Http.get(url), 4))
```

At quorum ≥ 2 the endpoint must return byte-identical responses **including
headers** — agreement is on a hash of the whole response, and there is no
transform callback to strip volatile fields. An endpoint that stamps a `Date`
header or a per-request id will not reach agreement above quorum 1.
