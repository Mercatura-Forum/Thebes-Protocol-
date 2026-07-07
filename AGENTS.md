# AGENTS.md — navigating the Thebes ecosystem from this repository

A canonical orientation for an automated agent landing on the Thebes hub.
Human-readable detail is in [README.md](README.md).

## What this repository is

The **project index** for Thebes, a post-quantum Layer 1 where full applications
(backend, frontend, and data) live on-chain. This repo holds the homepage, the
technical specification, the docs, small starter contracts, the example catalog,
and the release channel for the `thebes-deploy` CLI.

## Layout

```
README.md                 the front door — live links, protocol overview
docs/repository-map.md    HOW THE REPOSITORIES FIT TOGETHER — read this first
docs/cli-deploy.md        installing thebes-deploy, API keys, both deploy paths
docs/deploying.md         manifest → build → deploy walkthrough
docs/spec.md              the technical specification
examples/                 core starter contracts (counter, guestbook, todo,
                          kv-store, icrc-me, e-commerce) in Motoko and Rust
examples/README.md        THE CATALOG — all twelve full-stack example repos,
                          each with a live on-chain deployment link
```

## The sibling repositories (do not look for their code here)

- [`thebes-sdk`](https://github.com/Mercatura-Forum/thebes-sdk) — the shared
  frontend toolkit (`@thebes/sdk`): boundary client, React hooks, passkey gate.
- [`thebes-lib`](https://github.com/Mercatura-Forum/thebes-lib) — the shared
  Motoko backend library: `Admin`, `Users`, `Pagination`, `MemphisAuth`, `Invoices`.
- `thebes-example-<name>` — one repo per full-stack example; every one carries
  its own `AGENTS.md` with a copy-pasteable deploy contract.
- [`digital-asset-exchange`](https://github.com/Mercatura-Forum/digital-asset-exchange)
  — the largest worked application (atomic DvP settlement).

Each example vendors a snapshot of the two toolkits (`frontend/vendor/@thebes/sdk`,
`motoko/thebes-lib`), so it builds self-contained; the toolkit repositories are
the upstream source of truth.

## Deploying

The CLI is released from this repository:
[releases](https://github.com/Mercatura-Forum/Thebes-Protocol-/releases) carry a
prebuilt Linux x86-64 `thebes-deploy` binary, an install script, and the source
bundle. Follow [docs/cli-deploy.md](docs/cli-deploy.md); there are two paths —
sign installs yourself (Path A) or use a credit-metered API key (Path B).

## Conventions an agent must respect

- Motoko compiler is **mops-pinned 1.4.1** — never a system `moc` (a default
  `PATH` often exposes Qt's unrelated Meta-Object Compiler).
- A private Motoko helper that `await`s another contract must be `async*`.
- Backends expose `*OrTrap` twins of guarded methods; frontends call the
  `OrTrap` form so a rejected guard surfaces as a thrown reason.
- Single records return as 0-or-1-element `vec record`, never bare options.
