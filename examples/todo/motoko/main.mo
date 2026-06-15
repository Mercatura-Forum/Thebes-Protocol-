// To-do — add tasks, toggle done, list them. A keyed-map smart contract.
// State is replicated across the BFT validator set and sealed into the chain's
// append-only history. Motoko (part of the IC CDK — see /NOTICE).

import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Iter "mo:core/Iter";

persistent actor Todo {
  public type Task = { id : Nat; text : Text; done : Bool };

  let tasks : Map.Map<Nat, Task> = Map.empty<Nat, Task>();
  var nextId : Nat = 0;

  public func add(text : Text) : async Nat {
    let id = nextId;
    nextId += 1;
    Map.add(tasks, Nat.compare, id, { id; text; done = false });
    id;
  };

  public func toggle(id : Nat) : async Bool {
    switch (Map.get(tasks, Nat.compare, id)) {
      case null { false };
      case (?t) {
        let flipped = { id = t.id; text = t.text; done = not t.done };
        Map.add(tasks, Nat.compare, id, flipped);
        flipped.done;
      };
    };
  };

  public query func list() : async [Task] {
    Iter.toArray<Task>(Map.values<Nat, Task>(tasks));
  };
}
