// Key-value store — set / get / delete / list keys. A replicated, sealed map.
// Motoko (part of the IC CDK — see /NOTICE).

import Map "mo:core/Map";
import Text "mo:core/Text";
import Iter "mo:core/Iter";

persistent actor KV {
  let store : Map.Map<Text, Text> = Map.empty<Text, Text>();

  public func set(key : Text, value : Text) : async () {
    Map.add(store, Text.compare, key, value);
  };

  public query func get(key : Text) : async ?Text {
    Map.get(store, Text.compare, key);
  };

  public func delete(key : Text) : async Bool {
    Map.delete(store, Text.compare, key);
  };

  public query func keys() : async [Text] {
    Iter.toArray<Text>(Map.keys<Text, Text>(store));
  };
}
