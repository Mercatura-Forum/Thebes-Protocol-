# cards — "Majlis" (Estimation + Tarneeb)

A four-player trick-taking card game served entirely from the chain: **Estimation**
and **Tarneeb**, two classics of the Arab card table. The deck is shuffled by the
chain's own consensus randomness (`raw_rand` → Fisher–Yates), so no player and no
server controls the deal. Table state, seats, and each hand are replicated across
the validator set.

- **Backend:** `motoko/main.mo` — `moc --check` clean (uses `lib/Admin`).
- **Frontend:** `frontend/` — React + Vite + TypeScript; cards are **CSS-rendered**
  (crisp at any size, no image assets). Sign-in is a passkey (Memphis) as the
  app's web auth.

## Correctness guards (the real ones)

1. **Fair on-chain deal.** The shuffle is a Fisher–Yates over the chain's
   `raw_rand` consensus randomness — unpredictable and unbiased, with no trusted
   dealer.
2. **Turn + phase order.** Bids, estimates, and card plays are accepted only from
   the player whose turn it is, in the correct phase; out-of-turn actions are
   rejected.
3. **Hidden hands.** `myHandView` returns only the caller's own cards; the public
   `gameStateView` never leaks another seat's hand.

## Interface (headline methods)

| Method | Kind | Args | Returns | Notes |
|---|---|---|---|---|
| `openTables` | query | — | `vec record {id;game;seatsTaken}` | joinable tables |
| `createTable` | update | `gameText, displayName` | `nat` (table id) | `gameText` ∈ estimation·tarneeb |
| `joinTable` | update | `tableId, displayName` | `nat` (seat) | seats fill to four |
| `startHand` | update | `tableId` | — | deals via `raw_rand` |
| `bid` / `passBid` | update | `tableId[, number, suitRank]` | — | Tarneeb bidding |
| `estimate` | update | `tableId, value` | — | Estimation bidding |
| `playCard` | update | `tableId, card` | — | turn-gated |
| `gameStateView` | shared query | `tableId` | `…` | public table state |
| `seatsView` | query | `tableId` | `…` | seated players |
| `myHandView` | shared query | `tableId` | `…` | caller's hand only |

## Connect to the API

```sh
thebes-deploy query cards openTables
thebes-deploy call  cards createTable --arg '("estimation", "Layla")'   # → (0 : nat)
thebes-deploy call  cards joinTable    --arg '(0:nat, "Omar")'
thebes-deploy query cards gameStateView --arg '(0:nat)'
```

```js
const cid = window.CARDS_CID, api = window.EgyptBoundary
const tables = await api.query(cid, 'openTables', '()')
```

## Run the frontend

```sh
cd frontend && npm install && npm run dev
npm run build
```

> **Memphis sign-in.** A passkey is your seat at the table — the frontend wraps
> all routes (lobby + table) in a Memphis gate; the human identity + display name
> come from Memphis while the on-chain caller stays the boundary's browser key.
