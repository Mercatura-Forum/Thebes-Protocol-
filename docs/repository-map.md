# How the repositories fit together

Thebes is split across a few repositories on purpose: a shared frontend SDK, a
shared Motoko backend library, and one repository per example application that
**depends on** both rather than copying them. This page is the map — what each
repository is, and how an example is wired to the others.

## The pieces

| Repository | What it is | How you consume it |
| --- | --- | --- |
| **[Thebes-Protocol-](https://github.com/Mercatura-Forum/Thebes-Protocol-)** (this repo) | The project index: homepage, the [technical spec](spec.md), the [docs](.), and a set of small starter examples in `examples/` (counter, guestbook, todo, kv-store, e-commerce, icrc-me), each in Motoko **and** Rust. | Read it; clone a starter to learn the shape. |
| **[thebes-sdk](https://github.com/Mercatura-Forum/thebes-sdk)** | The shared **frontend** toolkit, published as `@thebes/sdk`: the `boundary.js`/`passkey.js` browser runtimes, a typed query/update + media-upload layer, the React hooks (`useQuery` / `useUpdate` / `useMediaUpload`), and the `MemphisGate` passkey sign-in. | A frontend `npm` git dependency: `@thebes/sdk`. |
| **[thebes-lib](https://github.com/Mercatura-Forum/thebes-lib)** | The shared **backend** Motoko library: `Admin` (ownership/roles), `Users` (profiles), `Pagination`, `MemphisAuth`, `Invoices`. | A Motoko `mops` GitHub dependency: `thebes-lib`. |
| **thebes-example-\*** | One repository per full-stack example dapp — store, chat, crm, restaurant, finance, booking, loyalty, university, cards, invoicing, xray, … Each is a complete app you can clone and deploy. | Clone the one nearest your use case; read its `README`. |

The full example catalog, with a one-line description and a link for each, is in
[`examples/README.md`](../examples/README.md).

## How an example is wired

Every `thebes-example-*` repository has the same two-part shape, and **neither
half copies the toolkit** — both resolve it as a pinned dependency:

```
thebes-example-<name>/
├── frontend/        React + Vite + Tailwind
│   └── depends on  @thebes/sdk        (npm git dep, pinned to a tag)
└── motoko/          a `persistent actor`
    └── depends on  thebes-lib         (mops GitHub dep, pinned to a tag)
```

```
        ┌─────────────────────────┐        ┌─────────────────────────┐
        │  thebes-sdk             │        │  thebes-lib             │
        │  (@thebes/sdk, frontend)│        │  (Motoko backend lib)   │
        └───────────▲─────────────┘        └───────────▲─────────────┘
                    │ npm git dep                      │ mops github dep
                    │ (pinned tag)                     │ (pinned tag)
        ┌───────────┴──────────────────────────────────┴─────────────┐
        │  thebes-example-<name>                                       │
        │    frontend/  ── query/update/media ──►  motoko/  (the app's │
        │                                          smart contract)     │
        └──────────────────────────────────────────────────────────────┘
                    │ deploys to
                    ▼
        the Thebes cluster (validators) + boundary  ── serves the frontend
                                                       and routes calls
```

**Why split it this way.** The toolkit lives in exactly one place. A fix or
feature in `thebes-sdk` or `thebes-lib` lands once and every example picks it up
by bumping a pinned tag — no copy drifts out of sync. An example repository stays
small: it is *only* the application, plus two dependency lines.

## Tracing a feature across the repositories

When you want to know "where does X live?", follow the dependency edges:

- **A UI calls a backend method** — the call goes through `@thebes/sdk`
  (`useQuery` / `useUpdate`, which encode Candid over `window.EgyptBoundary`).
  The method itself is in the example's `motoko/main.mo`.
- **Sign-in, roles, or pagination** — these are `thebes-lib` modules (`MemphisAuth`,
  `Admin`/`Users`, `Pagination`) the example imports; the example holds the state
  and calls the module functions.
- **Images or files** — bytes go to the Thebes **media contract** via the SDK's
  `useMediaUpload`; the example's backend stores only the returned path.
- **Deploying any of it** — see [cli-deploy.md](cli-deploy.md) and
  [deploying.md](deploying.md).

## Working on the toolkit vs. an example

- Improving an **example app** → change that example's `frontend/` or `motoko/`.
- Improving something **shared** (a hook, a Motoko module) → change `thebes-sdk`
  or `thebes-lib`, cut a new tag, then bump the pinned dependency in the examples
  that should adopt it. Do **not** edit the copied dependency inside an example's
  `node_modules/` or `.mops/`.
