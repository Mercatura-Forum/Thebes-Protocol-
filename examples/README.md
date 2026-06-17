# Examples

Working smart contracts for the Thebes Layer 1. Every contract here is replicated
across a Byzantine validator set and its state is sealed into the chain's signed,
append-only history — there is no database and no server. A *query* reads
replicated state; an *update* mutates it and is finalized by a BFT quorum.

This directory holds the **core teaching contracts**, compiled in CI so nothing
rots. The **full-stack applications** each live in their own repository — browse
the catalog below.

## Core contracts

The primitives — each written in **both Motoko and Rust** and compiled in CI
(`moc --check` for Motoko, `cargo build --target wasm32-unknown-unknown` for Rust).

| Example | What it shows | Languages |
|---|---|---|
| [`counter`](./counter) | the smallest complete contract — one update, one query | Motoko · Rust |
| [`guestbook`](./guestbook) | append-only list keyed by the caller; query the whole list | Motoko · Rust |
| [`todo`](./todo) | keyed map — add, toggle done, list | Motoko · Rust |
| [`kv-store`](./kv-store) | set / get / delete / list keys | Motoko · Rust |
| [`icrc-me`](./icrc-me) | **the Thebes token standard** — full ICRC-1/2/3/10 ledger | Motoko |
| [`e-commerce`](./e-commerce) | a minimal single-file storefront — products, cart, orders | Motoko + vanilla JS |

## Full-stack applications

Each full-stack app is its own repository: a Motoko backend on
[`thebes-lib`](https://github.com/Mercatura-Forum/thebes-lib) and a React frontend
on [`@thebes/sdk`](https://github.com/Mercatura-Forum/thebes-sdk), with passkey
sign-in and a real correctness guard — the kind a production app actually needs.

| Application | What it shows | The guard it demonstrates | Repository |
|---|---|---|---|
| **Store** | storefront with on-chain product photos | atomic stock decrement | [thebes-example-store](https://github.com/Mercatura-Forum/thebes-example-store) |
| **Chat** | social rooms — profiles, avatars, authenticated posts | append-only bounded log | [thebes-example-chat](https://github.com/Mercatura-Forum/thebes-example-chat) |
| **Finance** | personal ledger — accounts, transactions, budgets | no-overdraft + balance oracle | [thebes-example-finance](https://github.com/Mercatura-Forum/thebes-example-finance) |
| **Booking** | reservations — listings, time slots | no double-booking (atomic) | [thebes-example-booking](https://github.com/Mercatura-Forum/thebes-example-booking) |
| **Restaurant** | menu + customer orders + kitchen queue | forward-only order lifecycle | [thebes-example-restaurant](https://github.com/Mercatura-Forum/thebes-example-restaurant) |
| **CRM** | sales pipeline — contacts, deals, activity log | forward-only pipeline + per-rep ownership | [thebes-example-crm](https://github.com/Mercatura-Forum/thebes-example-crm) |
| **Loyalty** | points & rewards | no-negative-balance + conservation oracle | [thebes-example-loyalty](https://github.com/Mercatura-Forum/thebes-example-loyalty) |
| **University** | course registration | seat capacity (atomic) + no double-enroll | [thebes-example-university](https://github.com/Mercatura-Forum/thebes-example-university) |
| **Cards** | "Majlis" — Estimation & Tarneeb, four players | fair on-chain shuffle via `raw_rand` | [thebes-example-cards](https://github.com/Mercatura-Forum/thebes-example-cards) |

The full-stack apps share one toolkit, depended on rather than copied:
[`@thebes/sdk`](https://github.com/Mercatura-Forum/thebes-sdk) for the frontend
(boundary client, typed calls, React hooks, the Memphis passkey gate) and
[`thebes-lib`](https://github.com/Mercatura-Forum/thebes-lib) for the backend
(`Admin`, `Users`, `Pagination`, `MemphisAuth`). Image bytes live in a separate
Thebes **media contract**; apps store only the path.

> **Motoko tip:** a private helper that `await`s another contract should be
> declared `async*`, not `async` — `async*` inlines into the caller so its
> post-`await` state mutations commit correctly.

## Build a core contract

**Motoko** (uses [mops](https://mops.one) for the `core` library):

```sh
mops install
moc $(mops sources) --check examples/counter/motoko/main.mo
```

**Rust** (uses the IC CDK — see [`/NOTICE`](../NOTICE)):

```sh
cd examples/counter/rust
cargo build --target wasm32-unknown-unknown --release
```

## Deploy

> Full walkthrough — manifest, build, deploy, calling a live contract: **[../docs/deploying.md](../docs/deploying.md)**.

Deploy to the testnet with [`thebes-deploy`](../README.md): write a `thebes.toml`,
generate an identity, run `thebes-deploy deploy`. The tool compiles the contract,
signs the install, routes the chunks across the validators, and prints the live
URL.

> Built on the canister model of the Internet Computer (DFINITY Foundation): the
> Rust contracts use `ic-cdk` and the Motoko contracts the Motoko core library.
> With gratitude to DFINITY for their excellent work. See [`/NOTICE`](../NOTICE).
