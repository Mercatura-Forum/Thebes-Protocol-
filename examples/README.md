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
| [`price-oracle`](./price-oracle) | **HTTP outcalls** — a quorum-agreed feed + a survey reduced to a guarded median ([guide](../docs/http-outcalls.md)) | Motoko (Thebes compiler) |

## Full-stack applications

Each full-stack app is its own repository: a Motoko backend on
[`thebes-lib`](https://github.com/Mercatura-Forum/thebes-lib) and a React frontend
on [`@thebes/sdk`](https://github.com/Mercatura-Forum/thebes-sdk), with passkey
sign-in and a real correctness guard — the kind a production app actually needs.

**Every app below runs live on the public testnet — backend, frontend, and assets
all served and settled by the validator set, with no server or database behind
it.** Open the **▶ live** link to use one in your browser; **src** is its full
source repository.

| Application | What it shows | The guard it demonstrates | Live · Source |
|---|---|---|---|
| **Store** | storefront with on-chain product photos | atomic stock decrement | [▶ live](https://memphis.mercaturaforum.com/_/raw/231151000642772/index.html) · [src](https://github.com/Mercatura-Forum/thebes-example-store) |
| **Chat** | multi-room salon — profiles, reactions, moderation | accountable conversation: tombstones, bookkept trims, on-chain cooldown + oracle | [▶ live](https://memphis.mercaturaforum.com/_/raw/186131445741167/index.html) · [src](https://github.com/Mercatura-Forum/thebes-example-chat) |
| **Finance** | personal ledger — accounts, double-entry transfers, budgets | no-overdraft + global conservation seal (Σ balances = Σ postings) | [▶ live](https://memphis.mercaturaforum.com/_/raw/179495140191996/index.html) · [src](https://github.com/Mercatura-Forum/thebes-example-finance) |
| **Booking** | reservation engine — seated slots, waitlists, deposit escrow | capacity never oversells + escrow conservation oracle | [▶ live](https://memphis.mercaturaforum.com/_/raw/177129167469535/index.html) · [src](https://github.com/Mercatura-Forum/thebes-example-booking) |
| **Restaurant** | menu + customer orders + kitchen queue | forward-only order lifecycle | [▶ live](https://memphis.mercaturaforum.com/_/raw/208885335789510/index.html) · [src](https://github.com/Mercatura-Forum/thebes-example-restaurant) |
| **CRM** | sales pipeline — contacts, deals, stage trails | append-only trails that replay to the booked stage + per-rep ownership | [▶ live](https://memphis.mercaturaforum.com/_/raw/40115267434385/index.html) · [src](https://github.com/Mercatura-Forum/thebes-example-crm) |
| **Loyalty** | points, tier multipliers, stocked rewards | circulation conserved + per-entry auditable tier bonuses | [▶ live](https://memphis.mercaturaforum.com/_/raw/173835690051930/index.html) · [src](https://github.com/Mercatura-Forum/thebes-example-loyalty) |
| **University** | registrar — prerequisites, waitlists, transcripts | seats/prereqs/load enforced atomically + on-chain GPA from an append-only transcript | [▶ live](https://memphis.mercaturaforum.com/_/raw/191581724526353/index.html) · [src](https://github.com/Mercatura-Forum/thebes-example-university) |
| **Cards** | "Majlis" — Estimation & Tarneeb, four players | fair on-chain shuffle via `raw_rand` | [▶ live](https://memphis.mercaturaforum.com/_/raw/185079164137313/index.html) · [src](https://github.com/Mercatura-Forum/thebes-example-cards) |
| **Invoicing** | invoices over the shared `Invoices` module (also embedded in Store & Restaurant) | exact settlement: partial payments never overshoot, the settling payment flips `paid` atomically, no void after money | [▶ live](https://memphis.mercaturaforum.com/_/raw/128363932940845/index.html) · [src](https://github.com/Mercatura-Forum/thebes-example-invoicing) |
| **Medical imaging** | "Lumen" — X-ray studies (Patient→Study→Series→Image), images in the media contract | clinical RBAC + gap-free (density-checked) access log + five-law archive oracle | [▶ live](https://memphis.mercaturaforum.com/_/raw/57650296797843/index.html) · [src](https://github.com/Mercatura-Forum/thebes-example-xray) |
| **Open banking (ISO 20022)** | a message validation + audit hub for the ISO 20022 payment standard — capability metadata, hash-linked records, bounded reads (backend contract; no web frontend) | append-only audit trail + explicit standards discovery | [src](https://github.com/Mercatura-Forum/thebes-example-open-banking-iso20022) |

The full-stack apps share one toolkit:
[`@thebes/sdk`](https://github.com/Mercatura-Forum/thebes-sdk) for the frontend
(boundary client, typed calls, React hooks, the Memphis passkey gate) and
[`thebes-lib`](https://github.com/Mercatura-Forum/thebes-lib) for the backend
(`Admin`, `Users`, `Pagination`, `MemphisAuth`). Each app vendors a snapshot of
both so the repository builds self-contained, with no external toolkit pins; the
two toolkit repositories remain the single upstream source of truth. Image bytes
live in a separate Thebes **media contract**; apps store only the path.

Looking for something bigger? **[digital-asset-exchange](https://github.com/Mercatura-Forum/digital-asset-exchange)**
is a sovereign delivery-versus-payment exchange — cash, company shares, and land
titles settling in one indivisible step — built on the same substrate.

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
