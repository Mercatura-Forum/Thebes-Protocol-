// Price oracle — external readings a contract can trust.
//
// Two shapes of trust, both live on Thebes:
//
//   1. A QUORUM fetch: one URL, fetched independently by 2 validators that
//      must agree byte-for-byte on the body (`HttpOracle`, `#bodyOnly`).
//   2. A SURVEY: three different sources fetched by different validators,
//      reduced in this contract to a guarded median a single wrong source
//      cannot steer (`HttpSurveyReduce`).
//
// Requires the Thebes Motoko compiler (the `Http*` modules ride on Thebes
// host functions; stock Motoko has no such primitives). Submits are
// update-only — the compiler refuses them from a query.

import Http "mo:thebes/Http";
import Oracle "mo:thebes/HttpOracle";
import SurveyReduce "mo:thebes/HttpSurveyReduce";
import Time "mo:core/Time";

persistent actor PriceOracle {

  // ── 1. Quorum fetch: one feed, cached with a known age ──

  var feed = Oracle.init;
  let cfg = Oracle.config("https://api.example.com/v1/price?pair=BTC-USD");

  /// Land anything delivered, then keep a fetch in flight. Call this on
  /// use, or on a schedule — it is idempotent about in-flight requests.
  public func poke() : async () {
    feed := (Oracle.settle(feed, Time.now())).0;
    feed := (Oracle.refresh(cfg, feed)).0;
  };

  /// The cached body if fetched within the last 5 minutes.
  public query func price() : async ?Text {
    switch (Oracle.read(feed, 5 * 60 * 1_000_000_000, Time.now())) {
      case (#fresh b) ?b;
      case (#stale _) null;   // the caller decides; here stale = no answer
      case (#empty) null;
    };
  };

  // ── 2. Survey: three sources, guarded-median reduction ──

  var surveyHandle : Http.Handle = 0;
  var haveSurvey = false;
  var medianPrice : ?Int = null;

  public func askSources() : async Text {
    let s = Http.survey([
      "https://a.example/price",
      "https://b.example/price",
      "https://c.example/price",
    ])
      |> Http.withSurveyAgreement(_, #bodyOnly)
      |> Http.withReplication(_, 1)
      |> Http.withDeadlineBlocks(_, 256);
    switch (Http.submitSurvey(s)) {
      case (#ok h) { surveyHandle := h; haveSurvey := true; "submitted" };
      case (#err e) { debug_show e };
    };
  };

  /// Runtime-invoked at the survey's finalization block. Stores the reduced
  /// outcome into persisted state — a validator restarted mid-survey
  /// re-derives this identically. Idempotent; harmless if called by a user.
  public func thebesSurveyDeliver() : async () {
    if (not haveSurvey) return;
    switch (Http.pollSurvey(surveyHandle)) {
      case (#ready outcomes) {
        // Median of the per-source "px" fields; null unless a strict
        // majority of the sources produced one.
        switch (SurveyReduce.robustInt(outcomes, ?"px")) {
          case (?px) { medianPrice := ?px };
          case null {};   // too few agreeing sources — keep the old value
        };
        ignore Http.freeSurvey(surveyHandle);
        haveSurvey := false;
      };
      case (#pending) {};
    };
  };

  public query func median() : async ?Int { medianPrice };
}
