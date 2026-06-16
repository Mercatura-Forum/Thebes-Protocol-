# restaurant (menu + kitchen)

A restaurant served from the chain: a public menu, customer orders, and a
kitchen queue that moves each order through a **forward-only** lifecycle. Orders
are keyed to the customer; the kitchen view is staff-only.

- **Backend:** `motoko/main.mo` — `moc --check` clean (uses `lib/Admin`).
- **Frontend:** `frontend/` — React + Vite + TypeScript; typed reads/writes in
  `src/lib/restaurant-api.ts`. Dish photos live in a Thebes **media contract**.

## Correctness guards (the real ones)

1. **Forward-only order lifecycle.** `#pending → #preparing → #ready →
   #delivered`. Each transition is kitchen-gated and rejects an out-of-order
   request — pipeline analytics can trust the stage.
2. **Availability on order.** An order line for an unavailable or unknown item is
   rejected with the specific reason (not an ambiguous failure).
3. **Kitchen/admin gating.** Menu edits and lifecycle moves require the
   owner/staff tier; customers never advance the kitchen side.

## Interface (headline methods)

Mutations have a `Result` form and an `*OrTrap` twin; the frontend calls
`*OrTrap`.

| Method | Kind | Args | Returns | Notes |
|---|---|---|---|---|
| `menuView` | query | — | `vec record {id;name;priceE8s;available;photoPath}` | the menu |
| `myOrdersView` | shared query | — | `vec record {id;status;totalAmount;itemCount;timestamp}` | caller's orders |
| `kitchenView` | shared query | — | `…` | open orders (staff-only) |
| `addMenuItemOrTrap` | update | `name, priceE8s, photoPath:?text` | `nat` (id) | owner/staff |
| `setItemAvailableOrTrap` | update | `id, available` | — | owner/staff |
| `placeOrderFlatOrTrap` | update | `vec nat` ids, `vec nat` qtys | `nat` (order id) | availability-checked |
| `startPreparingOrderOrTrap` / `markOrderReadyOrTrap` / `markDeliveredOrTrap` | update | `orderId` | — | forward-only steps |
| `getOwnerStats` | shared query | `dayStartNs, dayEndNs` | `record {totalRevenue;totalOrders}` | owner-only revenue |
| `seedDemo` | update | — | `bool` | seed a demo menu on an empty restaurant |

## Connect to the API

```sh
thebes-deploy query restaurant menuView
thebes-deploy call  restaurant placeOrderFlatOrTrap --arg '(vec {0:nat;1:nat}, vec {2:nat;1:nat})'
thebes-deploy call  restaurant startPreparingOrderOrTrap --arg '(0:nat)'
```

```js
const cid = window.RESTAURANT_CID, api = window.EgyptBoundary
const menu = await api.query(cid, 'menuView', '()')
```

## Run the frontend

```sh
cd frontend && npm install && npm run dev
npm run build
```

> **Demo data.** The Kitchen tab's **Load demo menu** button calls `seedDemo`.
