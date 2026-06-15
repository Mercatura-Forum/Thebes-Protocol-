# e-commerce (storefront)

A full-stack store served entirely from the chain: a Motoko backend smart contract
(`products`, `placeOrder`, `myOrders`) and a frontend (`frontend/`) that talks to it
through `window.EgyptBoundary`. Orders are keyed to the buyer (a passkey identity),
replicated across the validator set, and sealed into the chain's history.

- **Backend:** `motoko/main.mo` — `moc --check` clean.
- **Frontend:** `frontend/` — `index.html` + `app.js` + `boundary.js`; deploy injects
  the backend cid into `window.BACKEND_CID`.

Deploy with `thebes-deploy` (backend + frontend from one manifest → live URL).

> The frontend here is the proven vanilla build. A 3D/visually-rich variant matching
> the Thebes homepage aesthetic is in progress.
