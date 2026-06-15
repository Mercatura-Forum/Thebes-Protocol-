// Guestbook — anyone posts a message; everyone reads the list.
//
// Each message records its author (the caller's principal) and text. State is
// replicated across the Byzantine validator set and sealed into the chain's
// append-only history; there is no database behind this — the list IS the chain
// state. Written in Motoko (part of the IC CDK — see /NOTICE).

import List "mo:core/List";
import Iter "mo:core/Iter";

persistent actor Guestbook {
  public type Message = { author : Principal; text : Text };

  // Implicitly stable in a `persistent actor`; mutated in place (mo:core List).
  let messages : List.List<Message> = List.empty<Message>();

  // Update — finalized by a BFT quorum, then sealed. `msg.caller` is the
  // transport sender; for a real app key identity on Memphis (see the docs).
  public shared (msg) func postMessage(text : Text) : async () {
    List.add<Message>(messages, { author = msg.caller; text });
  };

  // Query — reads replicated state, no mutation.
  public query func getMessages() : async [Message] {
    Iter.toArray<Message>(List.values<Message>(messages));
  };
}
