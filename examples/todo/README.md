# todo

A keyed task map — add tasks, toggle them done, list them. Shows how a contract
keeps a growing keyed collection in replicated state and returns structured
records. Written in **Motoko** and **Rust**.

## Interface

| Method | Kind | Args | Returns | Notes |
|---|---|---|---|---|
| `add` | update | `text` | `nat` | creates a task, returns its id |
| `toggle` | update | `nat` (id) | `bool` | flips done; returns the new state |
| `list` | query | — | `vec record { id : nat; text : text; done : bool }` | all tasks |

## Deploy

```toml
[canisters.todo]
type   = "backend-motoko"
cid    = "auto"
source = "motoko/main.mo"
wasm   = "build/todo.wasm"
build  = "moc -o build/todo.wasm motoko/main.mo"
```

```sh
thebes-deploy deploy
```

## Connect to the API

**From the CLI:**

```sh
thebes-deploy call  todo add    --arg '("buy milk")'   # → (0 : nat)
thebes-deploy call  todo toggle --arg '(0 : nat)'      # → (true)
thebes-deploy query todo list
# → (vec { record { id = 0; text = "buy milk"; done = true } })
```

**From a frontend:**

```js
const cid = window.BACKEND_CID, api = window.EgyptBoundary;

const id = await api.call(cid, "add", '("buy milk")');   // returns the new id
await api.call(cid, "toggle", `(${id} : nat)`);
const tasks = await api.query(cid, "list", "()");        // [{id, text, done}]
```

Note the Candid type annotations on numeric args (`0 : nat`) — the textual
encoder needs them; the SDK passes the same textual form through.
