# Examples

Working smart contracts for the Thebes Layer 1 — each written in **both Motoko
and Rust**, each compiled in CI (`moc --check` for Motoko, `cargo build
--target wasm32-unknown-unknown` for Rust) so nothing rots.

Every contract here is replicated across a Byzantine validator set and its state
is sealed into the chain's signed, append-only history — there is no database and
no server. A *query* reads replicated state; an *update* mutates it and is
finalized by a BFT quorum.

### Core contracts

The primitives — each written in **both Motoko and Rust** and compiled in CI.

| Example | What it shows | Languages |
|---|---|---|
| [`counter`](./counter) | the smallest complete contract — one update, one query | Motoko · Rust |
| [`guestbook`](./guestbook) | append-only list keyed by the caller; query the whole list | Motoko · Rust |
| [`todo`](./todo) | keyed map — add, toggle done, list | Motoko · Rust |
| [`kv-store`](./kv-store) | set / get / delete / list keys | Motoko · Rust |
| [`icrc-me`](./icrc-me) | **the Thebes token standard** — full ICRC-1/2/3/10 ledger | Motoko |

### Full-stack apps

A suite of complete apps — a Motoko backend contract plus a frontend served from
the chain. Each one carries a **real correctness guard** (the kind a production
app actually needs) and a `*View` read surface the frontend decodes directly.

| Example | What it shows | The guard it demonstrates |
|---|---|---|
| [`e-commerce`](./e-commerce) | storefront — products, cart, orders | atomic checkout |
| [`store`](./store) | richer storefront with on-chain product photos | atomic stock decrement |
| [`chat`](./chat) | social room — profiles, avatars, Memphis-authenticated posts | append-only bounded log |
| [`finance`](./finance) | personal ledger — accounts, transactions, budgets, receipts | no-overdraft + balance oracle |
| [`booking`](./booking) | reservations — listings, time slots | no double-booking (atomic) |
| [`restaurant`](./restaurant) | menu + customer orders + kitchen queue | forward-only order lifecycle |
| [`crm`](./crm) | sales pipeline — contacts, deals, activity log | forward-only pipeline + per-rep ownership |
| [`loyalty`](./loyalty) | points & rewards | no-negative-balance + conservation oracle |
| [`university`](./university) | course registration | seat capacity (atomic) + no double-enroll |
| [`cards`](./cards) | "Majlis" — Estimation & Tarneeb, four players | fair on-chain shuffle via `raw_rand` |

The full-stack apps share a small toolkit: a typed `EgyptBoundary` SDK wrapper, a
passkey (Memphis) sign-in as web auth, and a shared `motoko/lib/` (an `Admin`
owner/pause tier, plus `Users`/`Pagination`/`MemphisAuth` where used). Image bytes
live in a separate Thebes **media contract** — the apps store only the path and
fall back to a placeholder when no image is set.

Every example here compiles in CI. `counter` and the `e-commerce` storefront are
also **deployed and exercised live on the testnet** end-to-end with
`thebes-deploy` — `increment`/`get` and `placeOrder`/`myOrders` both finalize
through the validator quorum and read back from chain state.

**Each example has its own README** with its full interface and how to connect to
its API three ways — the `thebes-deploy` CLI, the `EgyptBoundary` JS SDK for
frontends, and raw HTTP. Open any example folder above.

> **Authoring note (Thebes):** write a private helper that `await`s another
> contract as **`async*`**, not `async` — `async*` inlines into the caller so its
> post-`await` mutations commit correctly.

## Build one

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

## Deploy one

> Full walkthrough — manifest, build, deploy, calling a live contract: **[../docs/deploying.md](../docs/deploying.md)**.

Deploy to the testnet with [`thebes-deploy`](../README.md): write a `thebes.toml`,
generate an identity, run `thebes-deploy deploy`. The tool compiles the contract,
signs the install, routes the chunks across the validators, and prints the live
URL. See the root README for the full walkthrough.

> Attribution: these examples build on the Internet Computer CDK (`ic-cdk` for
> Rust, the Motoko base for Motoko), authored by the DFINITY Foundation. See
> [`/NOTICE`](../NOTICE).
