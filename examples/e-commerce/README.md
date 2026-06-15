# e-commerce (storefront)

A full-stack store served entirely from the chain: a Motoko backend smart contract
(`products`, `placeOrder`, `myOrders`) and a frontend (`frontend/`) that talks to it
through `window.EgyptBoundary`. Orders are keyed to the buyer (a passkey identity),
replicated across the validator set, and sealed into the chain's history.

- **Backend:** `motoko/main.mo` — `moc --check` clean.
- **Frontend:** `frontend/` — `index.html` + `app.js` + `boundary.js`; deploy injects
  the backend cid into `window.BACKEND_CID`.

Deploy with `thebes-deploy` (backend + frontend from one manifest → live URL).

## Interface

| Method | Kind | Args | Returns | Notes |
|---|---|---|---|---|
| `products` | query | — | `vec record { id; name; price; emoji; desc }` | the seeded catalog |
| `placeOrder` | update | `vec nat` ids, `vec nat` qtys | `nat` (order id) | keyed to the buyer, finalized by quorum |
| `myOrders` | shared query | — | `vec record { id; total; itemCount }` | the caller's own orders |

## Connect to the API

**From the CLI:**

```sh
thebes-deploy query storefront products
thebes-deploy call  storefront placeOrder --arg '(vec {0:nat; 1:nat}, vec {2:nat; 1:nat})'  # → (0 : nat)
thebes-deploy query storefront myOrders
# → (vec { record { id = 0; total = 17_440; itemCount = 3 } })
```

**From the frontend** (`frontend/app.js`, via `window.EgyptBoundary` +
`window.BACKEND_CID` injected at deploy):

```js
const cid = window.BACKEND_CID, api = window.EgyptBoundary;

const catalog = await api.query(cid, "products", "()");
await api.call(cid, "placeOrder", "(vec {0:nat; 1:nat}, vec {2:nat; 1:nat})");
const mine = await api.query(cid, "myOrders", "()");   // caller-keyed
```

`myOrders` is caller-keyed: a buyer only ever sees their own orders, identified
by their signed-in passkey principal.

## Frontend variants

- **`frontend/`** — the proven vanilla build (works today: catalog, cart, passkey
  checkout, MyOrders, all wired to the backend).
- **3D flagship (approved, in build): "Order → Block forge"** — a scroll-scrubbed
  Three.js hero in the Thebes dark cyan→purple system: a product glyph flows into a
  lattice, four validator node-lights sign it in lockstep (the BFT quorum), and it
  crystallizes into a sealed block dropping into an append-only column — the checkout
  *is* consensus. Built under the hero3d discipline (build → rig → design-audit →
  look-review) before it ships.
