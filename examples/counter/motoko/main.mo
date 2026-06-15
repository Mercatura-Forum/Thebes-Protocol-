// Counter — the smallest complete Thebes smart contract.
//
// `persistent actor` state is replicated across the Byzantine validator set and
// sealed into the chain's signed, append-only history on every update — there is
// no database to back up and no server to keep running. A query reads the
// replicated state; an update mutates it and is finalized by a BFT quorum.
//
// Written in Motoko. The Motoko base/runtime is part of the IC CDK — see /NOTICE.

persistent actor Counter {
  // Survives upgrades; committed to sealed state on every change.
  // In a `persistent actor`, fields are stable implicitly.
  var count : Nat = 0;

  // Update call — finalized by a Byzantine quorum, then sealed.
  public func increment() : async Nat {
    count += 1;
    count;
  };

  // Query call — reads replicated state, no state change.
  public query func get() : async Nat {
    count;
  };
}
