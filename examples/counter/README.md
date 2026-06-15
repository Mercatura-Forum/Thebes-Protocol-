# counter

The smallest complete Thebes smart contract: one number, one update, one query.
State is replicated across the validator set and sealed into the chain's history
on every change — no database, no server. Written in **Motoko** and **Rust**.

## Interface

| Method | Kind | Args | Returns | Notes |
|---|---|---|---|---|
| `increment` | update | — | `nat` | adds 1, finalized by a BFT quorum, returns the new value |
| `get` | query | — | `nat` | reads replicated state, no mutation |

## Deploy

`thebes.toml`:

```toml
[project]
name = "counter"
default_network = "wan"
chain_id = 2026

[networks.wan]
validators = ["http://NODE_A:18080", "http://NODE_B:18080", "http://NODE_C:18080", "http://NODE_D:18080"]
boundary = "https://<boundary-host>"
routing = "smart"

[canisters.counter]
type   = "backend-motoko"
cid    = "auto"
source = "motoko/main.mo"
wasm   = "build/counter.wasm"
build  = "moc -o build/counter.wasm motoko/main.mo"
```

```sh
thebes-deploy deploy
```

For the Rust version, swap the canister block:

```toml
[canisters.counter]
type  = "backend-rust"
cid   = "auto"
wasm  = "rust/target/wasm32-unknown-unknown/release/counter.wasm"
build = "cargo build --manifest-path rust/Cargo.toml --target wasm32-unknown-unknown --release"
```

## Connect to the API

**From the CLI** (textual Candid):

```sh
thebes-deploy query counter get          # → (0 : nat)
thebes-deploy call  counter increment    # → (1 : nat)
```

**From a frontend** (the `EgyptBoundary` JS SDK; `boundary.js` ships in the
frontend bundle, and the deploy injects `window.BACKEND_CID`):

```js
const cid = window.BACKEND_CID;
const api = window.EgyptBoundary;

const n   = await api.query(cid, "get", "()");        // read
await api.call(cid, "increment", "()");                // write (finalized by quorum)
```

**From raw HTTP** (any client; the argument is Candid-encoded bytes in hex —
`()` is `4449444c0000`):

```sh
curl -X POST https://<boundary-host>/api/query \
  -H 'content-type: application/json' \
  -d '{"canister_id": <CID>, "method": "get", "arg": "4449444c0000", "sender": ""}'
# → {"reply_candid":"(0 : nat)", ...}
```

Updates go to `/api/call` and are finalized by the validator quorum before the
receipt is returned.
