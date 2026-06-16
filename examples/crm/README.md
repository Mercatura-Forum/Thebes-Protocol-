# crm (sales pipeline)

A sales CRM for an SME team, served from the chain: contacts, deals on a
**forward-only** pipeline, and an immutable activity log. Every non-anonymous
caller is a rep who owns the records it creates; the Admin tier is the **manager**
role that can see and reassign across the whole book.

- **Backend:** `motoko/main.mo` — `moc --check` clean (uses `lib/Admin`,
  `lib/Pagination`).
- **Frontend:** `frontend/` — React + Vite + TypeScript; typed reads/writes in
  `src/lib/crm-api.ts`. Contact photos live in a Thebes **media contract**.

## Correctness guards (the real ones)

1. **Forward-only pipeline.** A deal moves `#lead → #qualified → #proposal →
   #won`, may drop to `#lost` from any open stage, and `#won`/`#lost` are
   terminal. Backward or skipping transitions are rejected.
2. **Per-rep ownership.** A rep may only read/mutate the contacts and deals it
   owns; the manager (admin) is the sole cross-book exception and the only role
   that can reassign a contact.
3. **Immutable activity log.** Activities are append-only (no edit/delete) — the
   audit trail of the relationship.

## Interface (headline methods)

Mutations have a `Result` form and an `*OrTrap` twin; the frontend calls
`*OrTrap`.

| Method | Kind | Args | Returns | Notes |
|---|---|---|---|---|
| `myContactsView` | shared query | — | `vec record {id;name;company;email;phone;photoPath;createdAt}` | caller's contacts |
| `addContact` | update | `name, company, email, phone, photoPath:?text` | `nat` (id) | traps for anonymous |
| `setContactPhotoOrTrap` | update | `contactId, photoPath` | — | owner-rep/manager |
| `addDealOrTrap` | update | `contactId, title, valueCents` | `nat` (id) | starts at `#lead` |
| `advanceDealOrTrap` | update | `dealId, stageText` | — | forward-only; traps invalid transition |
| `logActivityOrTrap` | update | `contactId, kindText, body` | `nat` (id) | note·call·email·meeting |
| `myDealsView` / `dealsView` / `activitiesView` | shared query | (`contactId` where applicable) | `vec …` | pipeline + per-contact reads |
| `pipelineView` | shared query | `allReps:bool` | `vec record {openCount;openValueCents;wonCount;wonValueCents;lostCount}` | manager sees all reps |
| `seedDemo` | update | — | `bool` | seed the caller's own demo book |

## Connect to the API

```sh
thebes-deploy call  crm addContact         --arg '("Dana", "Lumen", "dana@lumen.io", "+1 555 0142", null)'
thebes-deploy call  crm addDealOrTrap       --arg '(0:nat, "Enterprise rollout", 4800000:nat)'
thebes-deploy call  crm advanceDealOrTrap   --arg '(0:nat, "qualified")'
thebes-deploy query crm pipelineView        --arg '(false)'
```

```js
const cid = window.CRM_CID, api = window.EgyptBoundary
const contacts = await api.query(cid, 'myContactsView', '()')
```

## Run the frontend

```sh
cd frontend && npm install && npm run dev
npm run build
```

> **Demo data.** `seedDemo` is per-rep — the Contacts empty state's **Load demo
> data** button seeds the signed-in rep's own contacts, deals, and activities.
