//! Guestbook — anyone posts a message; everyone reads the list (Rust).
//!
//! Each message records its author (the caller's principal) and text. State is
//! replicated across the Byzantine validator set and sealed into the chain's
//! append-only history — the list IS the chain state, no database behind it.
//! Built on `ic-cdk` (the Internet Computer Rust CDK, by DFINITY — see /NOTICE).

use candid::{CandidType, Principal};
use std::cell::RefCell;

#[derive(CandidType, Clone)]
struct Message {
    author: Principal,
    text: String,
}

thread_local! {
    static MESSAGES: RefCell<Vec<Message>> = const { RefCell::new(Vec::new()) };
}

/// Update — finalized by a BFT quorum, then sealed.
#[ic_cdk::update]
fn post_message(text: String) {
    let author = ic_cdk::caller();
    MESSAGES.with(|m| m.borrow_mut().push(Message { author, text }));
}

/// Query — reads replicated state, no mutation.
#[ic_cdk::query]
fn get_messages() -> Vec<Message> {
    MESSAGES.with(|m| m.borrow().clone())
}
