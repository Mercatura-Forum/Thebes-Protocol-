//! To-do — add tasks, toggle done, list them (Rust).
//! State is replicated across the BFT validator set and sealed into the chain's
//! append-only history. Built on `ic-cdk` (DFINITY's IC Rust CDK — see /NOTICE).

use candid::CandidType;
use std::cell::RefCell;
use std::collections::BTreeMap;

#[derive(CandidType, Clone)]
struct Task {
    id: u64,
    text: String,
    done: bool,
}

thread_local! {
    static TASKS: RefCell<BTreeMap<u64, Task>> = const { RefCell::new(BTreeMap::new()) };
    static NEXT_ID: RefCell<u64> = const { RefCell::new(0) };
}

#[ic_cdk::update]
fn add(text: String) -> u64 {
    let id = NEXT_ID.with(|n| {
        let id = *n.borrow();
        *n.borrow_mut() = id + 1;
        id
    });
    TASKS.with(|t| t.borrow_mut().insert(id, Task { id, text, done: false }));
    id
}

#[ic_cdk::update]
fn toggle(id: u64) -> bool {
    TASKS.with(|t| {
        let mut m = t.borrow_mut();
        match m.get_mut(&id) {
            Some(task) => {
                task.done = !task.done;
                task.done
            }
            None => false,
        }
    })
}

#[ic_cdk::query]
fn list() -> Vec<Task> {
    TASKS.with(|t| t.borrow().values().cloned().collect())
}
