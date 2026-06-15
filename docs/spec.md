# Thebes — technical specification

> The canonical specification is served **on-chain** by its own smart contract:
> **[the technical specification](https://memphis.mercaturaforum.com/_/raw/129525575222625/spec.html)**.
> This page is a condensed reference for developers reading the repo.

## What Thebes is

A Layer 1 on which a single **smart contract** holds replicated state, runs
logic, and serves its own frontend. There is no database and no web server: the
bytes a browser loads and the records a contract keeps are committed into the
chain's signed, append-only history.

## Execution model

- Contracts are written in **Motoko** or **Rust** and compiled to **WebAssembly**.
- A **query** reads replicated state and mutates nothing.
- An **update** mutates state; it is ordered and finalized by a Byzantine
  quorum, then sealed into history. Every node executes it and must agree on the
  resulting state (deterministic execution → identical state root).
- State is **replicated** across the validator set, not stored in one place.
  `persistent` (Motoko) / stable (Rust) state survives upgrades.

## Consensus + integrity

- **BFT consensus** orders and finalizes blocks; with `n` validators the network
  tolerates up to `f` Byzantine faults (`n ≥ 3f + 1`).
- Each finalized block carries a **state root** that every honest node
  independently reproduces — a divergence is detectable, not silent.
- Finality is **threshold-signed**, including a **post-quantum** signature, so
  the chain's history stays verifiable against future cryptographic advances.

## Operational properties

- **Replicated** — the contract and its data run on every validator at once.
- **Always-on** — a node that falls behind re-syncs from the others; there is no
  single point whose failure stops the service.
- **No disaster recovery to run** — the chain is its own continuously-verified
  backup; there is nothing to snapshot or restore.
- **Tamper-proof** — every write is quorum-signed and appended; no operator can
  alter or delete a deployed contract or its records.
- **Minimal attack surface** — no web server, database, SSH, or cloud IAM in the
  serving path, so that whole class of breaches does not apply.

## Identity + cross-chain

- End users authenticate with **passkeys** (a WebAuthn identity layer); no seed
  phrases or external wallets.
- The network holds **threshold ECDSA / Schnorr** keys, so a contract can sign
  Bitcoin, Ethereum, Solana, and XRP transactions natively — cross-chain
  settlement as one self-auditing transaction.

## Talking to a contract

A deployed contract is reachable three ways (see [deploying.md](deploying.md)):

- the **`thebes-deploy` CLI** (`call` / `query`, Candid textual args),
- the **`EgyptBoundary` JS SDK** from an on-chain frontend, and
- **raw HTTP** to the boundary (`/api/query`, `/api/call`) with Candid-encoded
  arguments.
