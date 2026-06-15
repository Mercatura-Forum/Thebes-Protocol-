# guestbook

An append-only message list, each entry keyed to the caller's identity. Shows
how a contract reads `msg.caller` to attribute writes, and how the whole list is
served back from replicated state. Written in **Motoko** and **Rust**.

## Interface

| Method | Kind | Args | Returns | Notes |
|---|---|---|---|---|
| `postMessage` | update | `text` | `()` | appends `{caller, text}`, finalized by quorum |
| `getMessages` | query | — | `vec record { caller : principal; text : text }` | the whole guestbook |

## Deploy

```toml
[canisters.guestbook]
type   = "backend-motoko"
cid    = "auto"
source = "motoko/main.mo"
wasm   = "build/guestbook.wasm"
build  = "moc -o build/guestbook.wasm motoko/main.mo"
```

```sh
thebes-deploy deploy
```

(Rust: `type = "backend-rust"`, point `wasm`/`build` at `rust/`.)

## Connect to the API

**From the CLI:**

```sh
thebes-deploy call  guestbook postMessage --arg '("gm from Thebes")'
thebes-deploy query guestbook getMessages
# → (vec { record { caller = principal "…"; text = "gm from Thebes" } })
```

**From a frontend** — the caller identity is the signed-in passkey principal, so
posts are attributed automatically:

```js
const cid = window.BACKEND_CID, api = window.EgyptBoundary;

await api.call(cid, "postMessage", '("gm from Thebes")');
const msgs = await api.query(cid, "getMessages", "()");   // array of {caller, text}
msgs.forEach(m => console.log(m.caller, m.text));
```

**From raw HTTP** — `text` arguments are Candid-encoded; the SDK/CLI does the
encoding for you. For hand-rolled clients, encode `("hello")` as a Candid record
and POST to `/api/call` (update) or `/api/query` (read).
