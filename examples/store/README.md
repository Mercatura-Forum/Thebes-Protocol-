# store (storefront)

A full-stack shop served entirely from the chain: a Motoko backend smart contract
(catalog, cart, checkout, orders) and a React frontend that talks to it through
`window.EgyptBoundary`. Stock, carts, and orders are replicated across the
validator set and sealed into the chain's append-only history — no database, no
server.

- **Backend:** `motoko/main.mo` — `moc --check` clean (uses `lib/Admin`).
- **Frontend:** `frontend/` — React + Vite + TypeScript; typed reads/writes in
  `src/lib/store-api.ts`, image bytes served from a Thebes **media contract**.

## Correctness guards (the real ones)

1. **Stock capacity, atomically.** Checkout re-checks every line's stock and
   decrements it in the *same* synchronous call (no `await` in between), so two
   concurrent buyers can't both take the last unit.
2. **Owner-gated catalog.** The first caller claims the shop; only the
   owner/admins may add, restock, or photograph products. A zero-price product is
   rejected (it would mint free orders).

## Interface (headline methods)

| Method | Kind | Args | Returns | Notes |
|---|---|---|---|---|
| `getProductsView` | query | — | `vec record {id;name;description;priceE8s;stockCount;photoPath}` | the catalog |
| `addProduct` | update | `name, description, priceE8s, stockCount, photoPath:?text` | `nat` (id) | owner/admin; traps on zero price |
| `addToCart` | update | `productId, quantity` | — | per-caller cart |
| `getCartView` | query | — | `vec record {productId;quantity;name;priceE8s}` | caller's cart |
| `checkoutOrTrap` | update | — | `nat` (order id) | atomic stock check + decrement; traps the reason |
| `getOrderHistoryView` | query | — | `vec record {id;totalAmount;status;createdAt;itemCount}` | caller's orders |
| `seedDemo` | update | — | `bool` | loads a demo catalog on an empty shop (no-op otherwise) |

## Connect to the API

**CLI** (`thebes-deploy`):

```sh
thebes-deploy query store getProductsView
thebes-deploy call  store addToCart --arg '(0:nat, 2:nat)'
thebes-deploy call  store checkoutOrTrap            # → (0 : nat)
thebes-deploy query store getOrderHistoryView
```

**Frontend** (`window.EgyptBoundary` + the deploy-injected `window.STORE_CID`):

```js
const cid = window.STORE_CID, api = window.EgyptBoundary
const catalog = await api.query(cid, 'getProductsView', '()')
await api.call(cid, 'addToCart', '(0:nat, 2:nat)')
const orderId = await api.call(cid, 'checkoutOrTrap', '()')   // caller-keyed
```

## Run the frontend

```sh
cd frontend && npm install && npm run dev      # local dev against the testnet
npm run build                                  # production bundle in dist/
```

Contract ids are read from `window.STORE_CID` / `window.MEDIA_CID` (injected at
deploy) and fall back to the current testnet ids in `src/lib/config.ts` — point
them at your own deployment after deploying.

> **Demo data.** A fresh shop is empty; the Admin tab's **Load demo catalog**
> button calls `seedDemo` to populate it so the storefront is immediately alive.
> Product images use a Thebes media contract — seeded rows show a placeholder
> until you upload a photo.
