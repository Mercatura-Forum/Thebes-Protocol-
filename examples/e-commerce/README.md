# e-commerce (storefront)

A full-stack store served entirely from the chain: a Motoko backend smart contract
(`products`, `placeOrder`, `myOrders`) and a frontend (`frontend/`) that talks to it
through `window.EgyptBoundary`. Orders are keyed to the buyer (a passkey identity),
replicated across the validator set, and sealed into the chain's history.

- **Backend:** `motoko/main.mo` — `moc --check` clean.
- **Frontend:** `frontend/` — `index.html` + `app.js` + `boundary.js`; deploy injects
  the backend cid into `window.BACKEND_CID`.

Deploy with `thebes-deploy` (backend + frontend from one manifest → live URL).

## Frontend variants

- **`frontend/`** — the proven vanilla build (works today: catalog, cart, passkey
  checkout, MyOrders, all wired to the backend).
- **3D flagship (approved, in build): "Order → Block forge"** — a scroll-scrubbed
  Three.js hero in the Thebes dark cyan→purple system: a product glyph flows into a
  lattice, four validator node-lights sign it in lockstep (the BFT quorum), and it
  crystallizes into a sealed block dropping into an append-only column — the checkout
  *is* consensus. Built under the hero3d discipline (build → rig → design-audit →
  look-review) before it ships.
