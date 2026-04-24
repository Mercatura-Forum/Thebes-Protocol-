# Thebes

**A post-quantum Layer 1 for the infrastructure that will outlive classical cryptography.**

> 𓂀

---

## Live, on-chain

The link below is not a website. It is a smart contract on the Thebes Layer 1 serving its own frontend. The HTML and JavaScript a browser loads are bytes committed into the chain's signed state. No web server, no content-delivery network, no hosting provider sits between the reader and the chain.

**→ [http://194.31.150.154:8090/_/raw/42/index.html](http://194.31.150.154:8090/_/raw/42/index.html)**

Open the page. Everything you see is served by canister 42 on the live testnet.

---

## The window we are inside

In 2024 the United States National Institute of Standards and Technology standardised the first post-quantum signature schemes, and in the same year the US Department of Commerce instructed federal systems to migrate off classical cryptography by 2030. In 2023 the Dutch intelligence service, the AIVD, described *harvest-now-decrypt-later* — the practice of intercepting encrypted traffic today in order to decrypt it when a sufficiently large quantum machine arrives — as an active adversary pattern against state and critical-infrastructure communications. CISA, the European Commission, and the government of France have published the same warning in different registers.

Those notices represent a narrow window. Governments, banks, health systems, and courts are signing records today under elliptic-curve schemes that a future quantum machine is expected to break. A land title, a court ruling, a cross-border payment instruction, a medical record, a diplomatic cable: each is signed now, each is archived, each becomes readable the year the machine arrives unless the signature is produced under a scheme designed to survive it.

> *The integrity of a record is not a one-time event. It is a duration.*

Thebes is built for institutions that must sign records whose integrity must last longer than the cryptography the rest of the internet is currently using. It is not an upgrade over classical infrastructure; it is a different premise. Every block on the chain is signed, by default, under a post-quantum certificate — not beside the classical one, not as a retrofit, but on the consensus critical path.

---

## What the chain is

Consensus, availability, execution, threshold signing across four cryptographic schemes, a verifiable delay beacon, and graphics-accelerated state — each layer written in-house to fit the one above it. Two years of research and development. Nothing is a shim around somebody else's protocol.

### Nine layers, one tree

| Layer | What it gives you |
|---|---|
| **Consensus** | Pipelined Byzantine agreement, sub-second deterministic finality. No probabilistic confirmations. |
| **Availability** | Erasure-coded block bodies. The slowest link in the cluster does not become the throughput ceiling. |
| **Execution** | Smart contracts with compute — logic, memory, and the application's own interface in one executable unit. |
| **Signing** | Distributed-key signatures across secp256k1, Ed25519, Schnorr, and post-quantum MAYO-2. No validator, server, or company ever holds a key in full. |
| **Randomness** | Wesolowski verifiable delay beacon. The next leader is unknowable until the clock permits it. |
| **Acceleration** | Graphics-card-native Merkle hashing and batch signature verification. State commitments measured in tens of milliseconds, not seconds. |
| **Validators** | Nakamoto-Epoch proof-of-stake. Validator sets rotate epoch-by-epoch through distributed key reshare — no hard fork, no downtime window. |
| **Scale** | Specialised subnets for specialised work. |
| **Post-quantum** | Every block's attestation is MAYO-2. No elliptic-curve pairing primitive on the consensus critical path. |

---

## Specialised subnets, one chain

A chain cannot be optimal for every job at once. Thebes splits the work into specialised subnets; each chooses its own hardware, quorum, and pace. Cross-subnet messages carry a post-quantum signature any subnet can verify without trusting the sender.

- **Finance** — High-throughput settlement tuned for interbank, non-banking, and cross-border transactions at volumes traditional clearing rails have not matched. Batch verification on the graphics card lifts the ceiling well past single-processor limits.
- **Enterprise** — Dedicated capacity for regulated institutions. Each tenant's state is isolated; every write is signed into the chain's state root. Committee composition, jurisdictional reach, and retention policy are configurable per subnet instance.
- **Signing** — Graphics-accelerated threshold signing across every major curve. NIM class-group pre-signing sustains sub-millisecond online signing at volumes adequate for real cross-border flows.
- **Storage** — Long-lived records and application state, Merkle-committed into the chain's signed state so any other subnet can verify them.
- **Compute & Inference** — Validators agree on, and sign, the output of a deterministic computation — from a statistical model, a research pipeline, or a foundation-model inference. Signing path live; committee-level execution determinism in testing.

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

## Verifying the chain

Every block finalised on Thebes carries a post-quantum attestation from a quorum of validators. Each validator signs the block's state root under its own MAYO-2 keypair; the collection of signatures is the chain's certificate of finality. The frontend served from canister 42 exposes the chain's per-block certificate alongside the page it renders, and ships a browser-side verifier that walks the Merkle witness from the served bytes back to the signed state root.

The verifier is active work — the chain already signs; the browser-side check of the per-validator MAYO-2 quorum is the last piece of the trust path, and its final step lands in the next release.

---

## Status

- **Testnet** — Four-validator cluster live across the MENA region. Block production sub-second, state roots byte-identical across nodes, canister 42 serving this repository's announcement frontend.
- **Signing subnet** — Threshold ECDSA, Schnorr, and Ed25519 live. MAYO-2 threshold assembly deferred pending Silent-VOLE preprocess improvements; per-validator MAYO-2 signing is live and on the consensus critical path today.
- **Enterprise & finance subnets** — Architecture live; first institutional deployments in procurement.
- **Mainnet** — Coordinated with the first institutional partners. Timeline disclosed to partners under NDA.

---

## About

Thebes is designed and built by **Mercatura Forum Web3 Labs**, the research and engineering arm of Mercatura Forum. The protocol is the product of two years of in-house work across consensus, distributed cryptography, graphics-accelerated arithmetic, and post-quantum signing.

For partnership or institutional enquiries: [mercaturaforum.com](https://mercaturaforum.com).

---

*𓂀 Thebes · post-quantum, sovereign, on-chain.*
