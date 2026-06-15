//! Key-value store — set / get / delete / list keys (Rust).
//! A replicated, sealed map. Built on `ic-cdk` (DFINITY's IC Rust CDK — see /NOTICE).

use std::cell::RefCell;
use std::collections::BTreeMap;

thread_local! {
    static STORE: RefCell<BTreeMap<String, String>> = const { RefCell::new(BTreeMap::new()) };
}

#[ic_cdk::update]
fn set(key: String, value: String) {
    STORE.with(|s| {
        s.borrow_mut().insert(key, value);
    });
}

#[ic_cdk::query]
fn get(key: String) -> Option<String> {
    STORE.with(|s| s.borrow().get(&key).cloned())
}

#[ic_cdk::update]
fn delete(key: String) -> bool {
    STORE.with(|s| s.borrow_mut().remove(&key).is_some())
}

#[ic_cdk::query]
fn keys() -> Vec<String> {
    STORE.with(|s| s.borrow().keys().cloned().collect())
}
