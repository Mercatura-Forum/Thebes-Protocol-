# Thebes

**The Layer 1 where your whole application lives on-chain — replicated across every node, tamper-proof, and impossible to take down. No servers to breach. No backups to restore.**

> 𓂀

---

## Live, on-chain

The links below are not websites; each is a smart contract on the Thebes Layer 1 serving its own frontend. The HTML and JavaScript a browser loads are bytes committed into the chain's signed state. No web server, no content-delivery network, no hosting provider sits between the reader and the chain.

**→ [The homepage](https://memphis.mercaturaforum.com/_/raw/129525575222625/index.html)** — Thebes, served by its own smart contract on the cluster

**→ [The technical specification](https://memphis.mercaturaforum.com/_/raw/129525575222625/spec.html)** — the source of truth, also served on-chain

**→ [The Thebes IDE](https://memphis.mercaturaforum.com/_/raw/129525575222700/index.html)** — write, compile, and deploy a smart contract from the browser

**→ [A live storefront](https://memphis.mercaturaforum.com/_/raw/231151000642772/index.html)** — "Souk", the [Store example](https://github.com/Mercatura-Forum/thebes-example-store) running on-chain: catalog, cart, and orders, all served and settled by the cluster

**→ [Twelve full-stack apps, live](examples/README.md#full-stack-applications)** — store, chat, finance, booking, restaurant, CRM, loyalty, university, a card game, invoicing, medical imaging, and ISO 20022 open banking. Each is served entirely on-chain — open any of them in your browser to see what full-stack hosting on Thebes looks like.

The spec is the source of truth; everything below is a preview of what it contains.

---

## Build on Thebes

Two audiences, one chain.

### For developers — ship a full app in one command

Your **backend and your frontend both live on the chain**. No servers, no database, no cloud bill, no CI/CD pipeline. Write a smart contract in **Motoko or Rust**, write a frontend, run one command, and get a live URL whose bytes are committed into signed chain state. A *query* reads replicated state; an *update* is finalized by a Byzantine quorum and sealed forever.

```sh
thebes-deploy deploy        # compiles, installs, uploads the frontend, prints the live URL
```

- **Start from a working example →** [`examples/`](./examples) — core contracts (counter, guestbook, to-do, key-value store) in **Motoko and Rust**, plus a catalog of twelve full-stack application repositories (store, chat, finance, booking, restaurant, CRM, loyalty, university, a card game, invoicing, medical imaging, and ISO 20022 open banking) — **each one live on the testnet** and built on the shared [`@thebes/sdk`](https://github.com/Mercatura-Forum/thebes-sdk) and [`thebes-lib`](https://github.com/Mercatura-Forum/thebes-lib).
- **End-user identity is built in** — your users sign in with a **passkey** (Memphis): no wallets, no seed phrases, no extensions.
- **One binary, no dependencies** — see [Deploying to Thebes](#deploying-to-thebes).

### For enterprise — infrastructure that cannot be taken down or tampered with

Your application and its data are **replicated across every validator** and **sealed**, append-only, into the chain's signed state. There is no single server to breach, no cloud console to misconfigure, no privileged admin to compromise — the infrastructure *is* a Byzantine-fault-tolerant network. It keeps serving through node failures with **no downtime and nothing to recover**.

- **Replicated, always-on** — every node holds the full state; lose nodes and the network keeps finalizing. Sub-second deterministic finality; state byte-identical across nodes.
- **No disaster recovery** — there is nothing to back up or restore. The chain is its own continuously-verified backup; a node that falls behind re-syncs from the others automatically.
- **Tamper-proof** — every write is signed by a Byzantine quorum and sealed into an append-only history. No operator — not even us — can alter or delete a deployed contract or its records.
- **Unhackable at the infrastructure layer** — no web server, no database, no SSH, no cloud IAM to get wrong; the entire class of attacks that breaches conventional systems does not exist here.
- **Cross-chain, cross-border** — threshold ECDSA/Schnorr sign Bitcoin, Ethereum, Solana, and XRP natively; a settlement becomes one atomic, self-auditing transaction.
- **Talk to us →** [mercaturaforum.com](https://mercaturaforum.com).

---

## The window we are inside

In 2024 the United States National Institute of Standards and Technology standardised the first post-quantum signature schemes; in the same year the US Department of Commerce instructed federal systems to migrate off classical cryptography by 2030. In 2023 the Dutch intelligence service, the AIVD, described *harvest-now-decrypt-later* — the practice of intercepting encrypted traffic today in order to decrypt it when a sufficiently large quantum machine arrives — as an active adversary pattern against state and critical-infrastructure communications. CISA, the European Commission, and the government of France have published the same warning in different registers.

Those notices represent a narrow window. Governments, banks, health systems, and courts are signing records today under elliptic-curve schemes that a future quantum machine is expected to break. A land title, a court ruling, a cross-border payment instruction, a medical record, a diplomatic cable; each is signed now, each is archived, each becomes readable the year the machine arrives unless the signature is produced under a scheme designed to survive it.

> *The integrity of a record is not a one-time event. It is a duration.*

Thebes is built for institutions that must sign records whose integrity must last longer than the cryptography the rest of the internet is currently using. It is not an upgrade over classical infrastructure; it is a different premise. Every block on the chain is signed, by default, under a post-quantum certificate — not beside the classical one, not as a retrofit, but on the consensus critical path.

---

## The protocol, in eight chapters

The specification reads in eight chapters; the cryptography classical and post-quantum; the verified-inference layer; the runtime and its installation pipeline; the smart-contract surface; the subnets the substrate supports. Each chapter below is a preview; the spec page has the full text.

### I. The Substrate

A Byzantine-fault-tolerant substrate built on a two-chain commit rule; prepare, then commit; the chain advances one block per round in the common case. The leader is chosen by a hybrid verifiable delay function — a Wesolowski VDF whose output is mixed with sorted validator-revealed entropy — so even a purpose-built ASIC cannot predict the next leader faster than the network can observe its emergence. Availability is decoupled from order: erasure-coded block bodies disseminate in parallel with consensus, and the slowest link in the cluster does not become the throughput ceiling. Sub-second deterministic finality; no probabilistic confirmations.

### II. Threshold ECDSA

Cross-chain transactions are signed with threshold ECDSA over the secp256k1 curve. Bitcoin; Ethereum; every chain in the EVM family; every chain that uses secp256k1 at all. A quorum of validators jointly produces a signature whose verification is indistinguishable from a signature produced by a single classical signer; no validator, no server, no operator ever holds the private key in full. Class-group pre-signing — NIM — pushes the online signing cost to a sub-millisecond regime adequate for real cross-border flows.

### III. Threshold Schnorr

For Schnorr-curve chains — the ed25519 family on one side, the secp256k1-taproot family on the other — Thebes implements threshold Schnorr through the FROST family of protocols, adapted to consensus-driven dealing. The same protocol runs over secp256k1 and ed25519 with curve-specific arithmetic injected at the field-operation layer; one substrate covers Solana, XRP, and Bitcoin's taproot output type, alongside any other ed25519- or secp256k1-Schnorr destination.

### IV. Post-Quantum Threshold Signatures

The quorum certificates that finalize every block carry post-quantum signatures over MAYO-2; a multivariate-quadratic signature family submitted to the NIST post-quantum standardization process; the parameter set tuned for the signature-size and verification-cost regime that chain finality requires. The construction is the dual signing stack of the substrate; classical NIM-ECDSA for cross-chain user signatures; MAYO-2 for the chain's own internal consensus certificates. Per-validator MAYO-2 signatures are on the consensus critical path today; threshold assembly is staged behind Silent-VOLE preprocessing improvements.

### V. Verified Inference

Inference is verified by replay, not by signature alone. A smart contract that requests inference receives an output, the output hash, and a compute certificate — a small MAYO-2 signature over the tuple of the model hash, the input hash, the output hash, the execution-environment hash, the timestamp, and the provider identity. The certificate is the commitment; the verification is the replay. Anyone who holds the registered weights and the recorded inputs can reproduce the output bit-for-bit and verify the chain's certificate against it.

### VI. The Runtime

Smart contracts execute inside a WebAssembly runtime built on Wasmtime. The substrate inherits the WebAssembly execution model and the Motoko language from the Internet Computer Protocol; the call surface, the type system, and the lifecycle semantics smart-contract developers in this ecosystem already know are honored at the runtime boundary. The installation pipeline is three-phase and chunked; a contract larger than a single block budget is admitted, sliced, and committed deterministically across validators.

### VII. The Smart Contract Surface

A smart contract receives messages addressed to its identifier; a smart contract sends inter-contract calls to other smart contracts on the same subnet, or, in subnets where outcalls are enabled, to external chains and to HTTP endpoints. A contract is a full program with its own memory, its own persistent state, and the ability to host the application interface its users interact with; the HTML and JavaScript rendered in the user's browser are bytes committed into the chain's signed state. Full-stack development is supported end-to-end; a project ships its backend smart contracts, its frontend smart contracts, and its assets through one command.

### VIII. The Subnets

The substrate supports four subnet specializations; each specialization enables a subset of capabilities; each capability has a corresponding chapter above. One binary runs on every subnet; the configuration determines which subsystems initialize and which remain dormant. The application subnet hosts smart contracts whose execution is purely on-chain. The signing subnet adds distributed key generation and threshold signing across every curve the substrate covers. The compute subnet adds the verified-inference path. The storage subnet adds long-lived Merkle-committed state any other subnet can verify.

---

## Specialised subnets, one chain

A chain cannot be optimal for every job at once. Thebes splits the work into specialised subnets; each chooses its own hardware, quorum, and pace. Cross-subnet messages carry a post-quantum signature any subnet can verify without trusting the sender.

- **Finance** — high-throughput settlement tuned for interbank, non-banking, and cross-border transactions at volumes traditional clearing rails have not matched; batch verification on the graphics card lifts the ceiling well past single-processor limits.
- **Enterprise** — dedicated capacity for regulated institutions; each tenant's state is isolated; every write is signed into the chain's state root; committee composition, jurisdictional reach, and retention policy are configurable per subnet instance.
- **Signing** — graphics-accelerated threshold signing across every major curve; NIM class-group pre-signing sustains sub-millisecond online signing at volumes adequate for real cross-border flows.
- **Storage** — long-lived records and application state, Merkle-committed into the chain's signed state so any other subnet can verify them.
- **Compute & Inference** — validators agree on, and sign, the output of a deterministic computation — from a statistical model, a research pipeline, or a foundation-model inference; signing path live; committee-level execution determinism in testing.

### Sovereignty of the record

A subnet class is a choice of workload; a subnet instance is also a choice of geography. Thebes is designed to run subnets that are nationally operated and regionally distributed — starting with Egypt-based instances and extending across the MENA and African corridor — so that the committee that signs a country's records is resident in that country, subject to its laws, and accountable under its jurisdiction.

This is data localisation enforced by cryptography. An institution required by regulation to keep its data inside a national boundary does not need to trust a cloud provider's promise; the chain itself enforces that only a committee within that boundary can sign the record.

> *Where the committee sits, the sovereignty sits.*

---

## Programmable transactions for cross-border finance

A programmable transaction on Thebes is a sequence of signed operations executed atomically under the chain's distributed keys — fetch a reference rate, convert between currencies, debit an account, credit a counterparty, record the attestation, return a signed receipt. Operations can span jurisdictions and chains: a contract running on an Egyptian finance subnet can settle against a counterparty on a MENA enterprise subnet, produce an audit trail on a storage subnet, and return a signed compute certificate to the originating institution — inside one transaction.

Because the signing keys — secp256k1, Ed25519, Schnorr, and post-quantum MAYO-2 — are held in distributed form across the signing subnet's committee, the same contract can sign outbound transactions for Bitcoin, Ethereum, Solana, XRP, Litecoin, and any other destination the committee's curves cover. No validator, no server, and no operator ever holds the private key in full. The cross-chain message is signed inside the chain, and the destination verifies it the way it verifies any native signature.

A cross-border payment becomes a line of code. A correspondent-banking relationship becomes a contract. A settlement between two institutions in two jurisdictions becomes a single atomic transaction whose audit trail is the chain itself.

---

## Smart contracts with compute

The programs that run on Thebes are not balance-moving scripts. They are full programs with their own memory, their own persistent state, and the ability to talk to the outside world through signed outbound calls. A contract can host the application interface its users interact with; the HTML and JavaScript rendered in the user's browser are bytes committed into the chain's signed state.

For the past fifteen years, an application has been a program running on infrastructure rented from a cloud provider; the program runs until the rental ends, the provider removes it, or the provider changes its access terms. A Thebes contract does not have an operator that can remove it. The only way to change the program is the way the program itself describes.

> *A smart contract on Thebes is a program with its own life.*

---

## Deploying to Thebes

**New here?** The [quickstart](docs/quickstart.md) takes you from install to a
live contract in five minutes. For dependencies, API keys, and the credit-metered
deploy path see [docs/cli-deploy.md](docs/cli-deploy.md); for the full reference,
[docs/deploying.md](docs/deploying.md); for fetching the open internet from a
contract — quorum-agreed HTTP outcalls and multi-source surveys —
[docs/http-outcalls.md](docs/http-outcalls.md); for how the SDK, the Motoko library, and
the example apps fit together, [docs/repository-map.md](docs/repository-map.md);
for the protocol itself, [docs/spec.md](docs/spec.md); for a single authoritative rule sheet to keep beside you (or load into a coding agent), [SKILL.md](SKILL.md); to contribute,
[CONTRIBUTING.md](CONTRIBUTING.md).

Anyone can deploy a smart contract to the testnet. The tool is `thebes-deploy`; one binary; no runtime dependencies beyond a working shell. The operator writes a `thebes.toml` describing their smart contracts, generates an ed25519 identity, runs one command. The tool compiles every smart contract the manifest declares — Motoko via `moc`; Rust via `cargo build --target wasm32-unknown-unknown --release` — signs the install envelopes, routes the chunks across the cluster's validators, uploads the frontend bundles, and verifies the result against the testnet's boundary.

Install:

```sh
curl -L https://github.com/Mercatura-Forum/Thebes-Protocol-/releases/download/v0.1.10-thebes-deploy/install-thebes-deploy.sh | bash
```

First-time setup:

```sh
thebes-deploy identity new alice          # generate an ed25519 identity
thebes-deploy setup                       # check moc, mops, cargo, node, mo:core
thebes-deploy new my-app                  # scaffold a whole project (backend + optional frontend)
```

`new` writes a project whose build flags already match this platform's
persistence model; `thebes-deploy init` still scaffolds a bare `thebes.toml`
into an existing directory if you'd rather wire it yourself. A Motoko contract
must be compiled with `moc --legacy-persistence` — see
[docs/upgrading.md](docs/upgrading.md) for why, and what the tool refuses if it
isn't.

Then one command compiles every smart contract the manifest declares, installs each on the cluster, uploads the frontend bundles, and verifies the result:

```sh
thebes-deploy deploy
```

At the end of a successful deploy, the tool prints the URLs to visit. Frontend smart contracts become boundary links the operator can open in a browser; backend smart contracts become identifiers the operator can call through `thebes-deploy call`:

```
✓ deploy complete

Frontends — open in a browser:
  portal       cid <cid-1>  https://memphis.mercaturaforum.com/_/raw/<cid-1>/index.html
  marketing    cid <cid-2>  https://memphis.mercaturaforum.com/_/raw/<cid-2>/index.html

Backends — call via `thebes-deploy call <name> <method>`:
  ledger       cid <cid-3>
  applications cid <cid-4>
```

Full-stack development is supported end-to-end. A project's smart-contract backend and smart-contract frontend ship from one manifest; the manifest decides which smart contracts are backends and which are frontends; the deploy tool handles both, in order, in one command. For a worked walkthrough — manifest, build, deploy, and calling a live contract — see **[docs/deploying.md](docs/deploying.md)**.

The tool composes the substrate's three-phase chunked install with a smart-routed HTTP client that picks the least-busy validator for each operation, polls receipts, surfaces install-guard symptoms with file pointers into the deployment-procedures folder, and rotates educational facts about the substrate during slow phases. Smart contract ids are random one-time draws from a 281-trillion-id range — `cid = "auto"` in the manifest delegates allocation to the tool; the chosen id is written back so re-deploys are stable; collisions with manually-chosen low-range cids are impossible by construction. Identity is local — one ed25519 seed file per operator at `~/.thebes/identities/<name>.seed`; Memphis, the substrate's end-user identity layer, is a separate surface and is not in the deploy path.

The source is a standalone Rust workspace; eight crates under `tools/thebes-deploy`; eighty-two tests; no dependency on any internal substrate crate. The chain protocol the tool speaks to is public by being a wire format, and the tool is one of several possible clients.

The current release is `v0.1.10-thebes-deploy`; the binary, the install script, and a source tarball are attached to the [release page](https://github.com/Mercatura-Forum/Thebes-Protocol-/releases). It composes the Motoko build line from the manifest, refuses a module whose persistence model this platform cannot carry across an upgrade, and verifies stable-type compatibility before an in-place upgrade uploads anything. Subsequent releases will track the substrate's wire-format additions and the toolchain's UX work.

---

## Verifying the chain

Every block finalised on Thebes carries a post-quantum attestation from a quorum of validators. Each validator signs the block's state root under its own MAYO-2 keypair; the collection of signatures is the chain's certificate of finality. The frontend served from smart contract 42 exposes the chain's per-block certificate alongside the page it renders, and ships a browser-side verifier that walks the Merkle witness from the served bytes back to the signed state root.

The verifier is active work — the chain already signs; the browser-side check of the per-validator MAYO-2 quorum is the last piece of the trust path, and its final step lands in the next release.

---

## Status

- **Testnet** — four-validator cluster live across the MENA region. Block production sub-second, state roots byte-identical across nodes, smart contract 100 serving the spec page and smart contract 42 serving the announcement frontend; finalization sustained at ~14 blocks per second with retention-bounded memory growth.
- **Signing subnet** — threshold ECDSA, Schnorr, and Ed25519 are live. Per-validator MAYO-2 post-quantum signing runs on the consensus critical path today; threshold MAYO-2 assembly is on the roadmap, built on Silent-VOLE preprocessing.
- **Enterprise & finance subnets** — architecture live; first institutional deployments in procurement.
- **Mainnet** — coordinated with the first institutional partners. Timeline disclosed to partners under NDA.

---

## Acknowledgements

Thebes builds on the **canister model** of the [Internet Computer](https://internetcomputer.org), created by the [DFINITY Foundation](https://dfinity.org) — smart contracts as orthogonally-persistent actors, and the Motoko language built around it. Their work is excellent and directly inspired this stack. We are grateful to the DFINITY team and the wider Internet Computer community.

---

## About

Thebes is designed and built by **Mercatura Forum Web3 Labs**, the research and engineering arm of Mercatura Forum. The protocol is the product of two years of in-house work across consensus, distributed cryptography, graphics-accelerated arithmetic, and post-quantum signing.

For partnership or institutional enquiries: [mercaturaforum.com](https://mercaturaforum.com).

---

*𓂀 Thebes · post-quantum, sovereign, on-chain.*
