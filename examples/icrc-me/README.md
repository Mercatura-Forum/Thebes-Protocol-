# ICRC-ME — the Thebes token standard (Motoko)

**ICRC-ME** is Mercatura Forum's production token-ledger standard for Thebes,
written in Motoko. It implements the ICRC family end-to-end — **ICRC-1** (transfer
+ metadata), **ICRC-2** (approve / allowance / transfer-from), **ICRC-3** (the
block log + transaction history), and **ICRC-10** (supported-standards discovery)
— with a Region-backed B-tree account index, a Merkle Mountain Range over the
block log for `O(log n)` inclusion proofs, a certified tip, and an on-ledger
shield surface.

> Motoko only. ICRC-ME is the Thebes standard; the primitive `examples/token`
> (Motoko + Rust) is the teaching version — ICRC-ME is the production one.

## Source

The full ledger lives in its own repository:

**→ [`github.com/Menese-Protocol/ICRC-ME`](https://github.com/Menese-Protocol/ICRC-ME)**

~13 modules / ~4,300 lines, zero dead code: `IndexedLedger.mo` (the actor),
`CBOR.mo`, `BlockLog.mo`, `RegionBTree.mo`, `MerkleMMR.mo`, `BTreeIndex.mo`,
`Balances.mo`, `Allowances.mo`, `Archive.mo`, `BloomFilter.mo`, and the certified
tree. It builds on `mo:core` and `mo:sha2` (see attribution in [`/NOTICE`](../../NOTICE)).

## Public interface (selected)

```motoko
// ICRC-1
icrc1_name()         : async Text;
icrc1_symbol()       : async Text;
icrc1_decimals()     : async Nat8;
icrc1_fee()          : async Nat;
icrc1_total_supply() : async Nat;
icrc1_balance_of(account : Account)      : async Nat;
icrc1_transfer(args : TransferArgs)      : async TransferResult;     // update
icrc1_metadata()     : async [(Text, Value)];

// ICRC-2 (allowances)
icrc2_approve(args : ApproveArgs)        : async ApproveResult;      // update
icrc2_allowance(args : AllowanceArgs)    : async Allowance;
icrc2_transfer_from(args : TransferFromArgs) : async TransferFromResult; // update

// ICRC-3 (block log / history) + proofs
icrc3_get_blocks(args)        : async GetBlocksResult;
icrc3_get_transactions(args)  : async GetTransactionsResult;
icrc3_get_tip_certificate()   : async ?Certificate;
mmr_root()                    : async ?Blob;
mmr_proof(blockIndex : Nat)   : async ?MmrProof;

// discovery
icrc1_supported_standards()   : async [{ name : Text; url : Text }];
icrc10_supported_standards()  : async [{ name : Text; url : Text }];
```

## Deploy

Clone the ICRC-ME repo and deploy it like any Thebes contract:

```sh
thebes-deploy deploy        # compiles IndexedLedger.mo + modules, installs, verifies
```

## Why on Thebes

Every block the ledger commits is folded into the chain's signed, post-quantum
state root; `icrc3_get_tip_certificate` + `mmr_proof` let any client verify a
transaction's inclusion against that certificate — token history whose integrity
is meant to outlast classical cryptography.

> Attribution: ICRC-ME builds on the IC CDK (Motoko base) and `mo:sha2`, authored
> by the DFINITY Foundation and the Motoko community — see [`/NOTICE`](../../NOTICE).
