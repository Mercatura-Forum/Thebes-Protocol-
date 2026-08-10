// http-outcall — fetch a URL from a Thebes smart contract.
//
// An outcall is two messages: `start` submits the request, and a later
// `read` returns the response once it has landed. The response of a
// completed outcall lives in update-execution context, so `read` is an
// update; it copies the result into stable state, which the `last` query
// then serves.
//
// Written in Motoko. The Motoko base/runtime is part of the IC CDK — see /NOTICE.

import Http "../../../src/Http";

persistent actor HttpOutcall {
  var lastStatus : Nat16 = 0;
  var lastBody : Text = "";

  // Submit an outcall for `url` at quorum 1. Returns whether it was queued.
  // Update-only: submitting from a query is refused by the compiler.
  public func start(url : Text) : async Bool {
    switch (Http.submit(Http.get(url))) {
      case (#ok) true;
      case (#err(_)) false;
    }
  };

  // Read the response if it has landed, storing it for later queries.
  // Returns the (status, body) once ready, or null while still pending.
  public func read() : async ?(Nat16, Text) {
    switch (Http.poll()) {
      case (#pending) null;
      case (#ready(r)) {
        let body = switch (Http.text(r)) { case (?t) t; case null "" };
        lastStatus := r.status;
        lastBody := body;
        ?(r.status, body)
      };
    }
  };

  // Serve the last response read, from replicated state.
  public query func last() : async (Nat16, Text) { (lastStatus, lastBody) };
}
