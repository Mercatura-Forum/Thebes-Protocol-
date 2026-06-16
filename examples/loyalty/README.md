# loyalty (rewards program)

A loyalty / rewards program served from the chain: the business issues points to
members; members redeem them for rewards. A member's balance is the running sum
of an **immutable** earn/redeem ledger, and tier is derived from lifetime points.

- **Backend:** `motoko/main.mo` — `moc --check` clean (uses `lib/Admin`).
- **Frontend:** `frontend/` — React + Vite + TypeScript; typed reads/writes in
  `src/lib/loyalty-api.ts`. Reward images live in a Thebes **media contract**.

## Correctness guards (the real ones)

1. **No negative balance.** `redeem` rejects a redemption that exceeds the
   balance; the deduction and the ledger entry happen in one synchronous call.
2. **Points conservation.** `verifyBalanceView` recomputes `balance == Σ earns −
   Σ redeems` from the immutable ledger — the UI can prove stored == recomputed.
3. **Immutable ledger + derived tier.** Every earn/redeem appends an entry that is
   never edited; tier (`bronze`/`silver`/`gold`) is derived from lifetime earned.

## Interface (headline methods)

| Method | Kind | Args | Returns | Notes |
|---|---|---|---|---|
| `myAccountView` | shared query | — | `vec record {balance;lifetimeEarned;tier}` | the caller's card |
| `rewardsView` | query | — | `vec record {id;name;costPoints;available;photoPath}` | the reward catalog |
| `myHistoryView` | shared query | — | `vec record {id;kind;points;memo;at}` | caller's ledger |
| `verifyBalanceView` | shared query | — | `vec record {stored;recomputed;consistent}` | conservation oracle |
| `issuePoints` | update | `member, points, memo` | — | admin only; traps on zero |
| `addReward` | update | `name, costPoints, photoPath:?text` | `nat` (id) | admin only |
| `redeem` | update | `rewardId` | `nat` (ledger id) | traps `"insufficient points"` etc. |
| `seedDemo` | update | — | `bool` | seed demo rewards + the caller's starter balance |

## Connect to the API

```sh
thebes-deploy query loyalty rewardsView
thebes-deploy call  loyalty redeem            --arg '(0:nat)'      # → (n : nat)
thebes-deploy query loyalty verifyBalanceView
```

```js
const cid = window.LOYALTY_CID, api = window.EgyptBoundary
const card = await api.query(cid, 'myAccountView', '()')
```

## Run the frontend

```sh
cd frontend && npm install && npm run dev
npm run build
```

> **Demo data.** The Card empty state's **Load demo data** button calls
> `seedDemo` — demo rewards (global, once) plus a starter balance for the caller.
