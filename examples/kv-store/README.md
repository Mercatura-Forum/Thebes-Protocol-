# kv-store

A string-keyed key/value store — set, get, delete, list keys. The classic
building block, on-chain: every write is replicated and sealed; reads are
queries. Written in **Motoko** and **Rust**.

## Interface

| Method | Kind | Args | Returns | Notes |
|---|---|---|---|---|
| `set` | update | `text` key, `text` value | `()` | upsert |
| `get` | query | `text` key | `opt text` | `null` if absent |
| `delete` | update | `text` key | `bool` | `true` if a value was removed |
| `keys` | query | — | `vec text` | all keys |

## Deploy

```toml
[canisters.kv]
type   = "backend-motoko"
cid    = "auto"
source = "motoko/main.mo"
wasm   = "build/kv.wasm"
build  = "moc -o build/kv.wasm motoko/main.mo"
```

```sh
thebes-deploy deploy
```

## Connect to the API

**From the CLI:**

```sh
thebes-deploy call  kv set    --arg '("lang", "motoko")'   # → ()
thebes-deploy query kv get    --arg '("lang")'             # → (opt "motoko")
thebes-deploy query kv keys                                # → (vec { "lang" })
thebes-deploy call  kv delete --arg '("lang")'             # → (true)
```

**From a frontend:**

```js
const cid = window.BACKEND_CID, api = window.EgyptBoundary;

await api.call(cid, "set", '("lang", "motoko")');
const v    = await api.query(cid, "get", '("lang")');   // "motoko" | null
const keys = await api.query(cid, "keys", "()");        // ["lang", ...]
```

`set`/`delete` are updates (finalized by the quorum, sealed into history);
`get`/`keys` are queries (read replicated state, no mutation).
