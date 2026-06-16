# finance (personal ledger)

A personal-finance app served from the chain: accounts, a double-entry-style
transaction ledger, budgets, and on-chain receipt images. Every account and
transaction is keyed to its owner — a caller only ever sees their own books.

- **Backend:** `motoko/main.mo` — `moc --check` clean (uses `lib/Admin`,
  `lib/Pagination`).
- **Frontend:** `frontend/` — React + Vite + TypeScript; typed reads/writes in
  `src/lib/finance-api.ts`. Receipt images live in a Thebes **media contract**.

## Correctness guards (the real ones)

1. **No overdraft.** `postTransactionOrTrap` rejects a debit that would push a
   non-credit account below zero (a credit account honours its limit). Zero-amount
   transactions are rejected.
2. **Balance integrity oracle.** `verifyBalanceView` recomputes the balance from
   the immutable transaction list so the UI can prove `stored == recomputed`.
3. **Per-caller isolation.** Accounts, transactions, and budgets are scoped to the
   caller; there is no cross-account read.

## Interface (headline methods)

| Method | Kind | Args | Returns | Notes |
|---|---|---|---|---|
| `createAccount` | update | `name, kindText, creditLimitCents` | `nat` (id) | `kindText` ∈ checking·savings·credit |
| `postTransactionOrTrap` | update | `accountId, kindText, amountCents, category, note, receiptPath:?text` | `nat` (tx id) | overdraft/zero guard; traps the reason |
| `setReceiptOrTrap` | update | `txId, receiptPath` | — | attach a media-contract receipt |
| `accountsView` | query | — | `vec AccountView` | caller's accounts + balances |
| `transactionsView` | query | `accountId, offset, limit` | `vec TxView` | paginated ledger |
| `verifyBalanceView` | query | `accountId` | `vec record {stored;recomputed;consistent}` | integrity oracle |
| `setBudget` | update | `category, limitCents` | — | per-category budget |
| `budgetsView` | query | `startNs, endNs` | `vec BudgetView` | spend vs limit in window |
| `seedDemo` | update | — | `bool` | seed the caller's own demo books |

## Connect to the API

```sh
thebes-deploy call  finance createAccount          --arg '("Checking", "checking", 0:nat)'
thebes-deploy call  finance postTransactionOrTrap   --arg '(0:nat, "debit", 4200:nat, "Groceries", "Market", null)'
thebes-deploy query finance verifyBalanceView       --arg '(0:nat)'
```

```js
const cid = window.FINANCE_CID, api = window.EgyptBoundary
const accts = await api.query(cid, 'accountsView', '()')
```

## Run the frontend

```sh
cd frontend && npm install && npm run dev
npm run build
```

> **Demo data.** `seedDemo` is per-caller — the Dashboard's **Load demo data**
> button seeds the signed-in user's own accounts, transactions, and budgets.
