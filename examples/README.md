# Examples

Working smart contracts for the Thebes Layer 1 — each written in **both Motoko
and Rust**, each compiled in CI (`moc --check` for Motoko, `cargo build
--target wasm32-unknown-unknown` for Rust) so nothing rots.

Every contract here is replicated across a Byzantine validator set and its state
is sealed into the chain's signed, append-only history — there is no database and
no server. A *query* reads replicated state; an *update* mutates it and is
finalized by a BFT quorum.

| Example | What it shows | Languages |
|---|---|---|
| [`counter`](./counter) | the smallest complete contract — one update, one query | Motoko · Rust |
| [`guestbook`](./guestbook) | append-only list keyed by the caller; query the whole list | Motoko · Rust |
| [`todo`](./todo) | keyed map — add, toggle done, list | Motoko · Rust |
| [`kv-store`](./kv-store) | set / get / delete / list keys | Motoko · Rust |
| [`e-commerce`](./e-commerce) | **full-stack storefront** — products, cart, orders, served on-chain | Motoko + frontend |
| [`icrc-me`](./icrc-me) | **the Thebes token standard** — full ICRC-1/2/3/10 ledger | Motoko |

Every example here compiles in CI. `counter` and the `e-commerce` storefront are
also **deployed and exercised live on the testnet** end-to-end with
`thebes-deploy` — `increment`/`get` and `placeOrder`/`myOrders` both finalize
through the validator quorum and read back from chain state.

_More on the way: more full-stack apps (restaurant, CRM, ERP) with rich on-chain
frontends matching the Thebes homepage._

> **Authoring note (Thebes):** a private helper that `await`s another contract must
> be **`async*`**, not `async` — `async*` inlines into the caller so its post-`await`
> mutations commit correctly. (Plain `async` helpers are a known engine pitfall.)

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
