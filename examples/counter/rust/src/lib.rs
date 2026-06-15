//! Counter — the smallest complete Thebes smart contract (Rust).
//!
//! State lives in the smart contract itself, replicated across the Byzantine
//! validator set and sealed into the chain's signed, append-only history on
//! every update. A `query` reads replicated state; an `update` mutates it and is
//! finalized by a BFT quorum.
//!
//! Built on `ic-cdk`, the Internet Computer Rust CDK authored by DFINITY — see
//! /NOTICE for attribution.

use std::cell::RefCell;

thread_local! {
    // Replicated, sealed state. Survives upgrades via the CDK's stable storage
    // hooks (omitted here for brevity; see the token example for persistence).
    static COUNT: RefCell<u64> = const { RefCell::new(0) };
}

/// Update call — finalized by a Byzantine quorum, then sealed.
#[ic_cdk::update]
fn increment() -> u64 {
    COUNT.with(|c| {
        *c.borrow_mut() += 1;
        *c.borrow()
    })
}

/// Query call — reads replicated state, no state change.
#[ic_cdk::query]
fn get() -> u64 {
    COUNT.with(|c| *c.borrow())
}
