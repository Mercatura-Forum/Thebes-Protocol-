/// Http.mo — outbound HTTPS from a Thebes smart contract.
///
/// A canister can fetch a URL from the open internet. This is not the same as
/// the IC's `http_request`, and three differences matter:
///
/// 1. **Quorum is per call.** You choose, on each request, how many validators
///    must independently fetch the URL and agree on the result. A cheap read
///    can run at quorum 1 and a settlement oracle at quorum 4 in the same
///    contract.
/// 2. **There is no transform callback.** Agreement is on a canonical hash of
///    the response, so there is no callback to write. The consequence: at
///    quorum ≥ 2 the endpoint must return byte-identical responses —
///    *including headers* — or the validators will not reach agreement. An
///    endpoint that stamps a `Date` header or a per-request id needs quorum 1.
/// 3. **Submit and read are two messages.** The response is not available in
///    the call that submits it. Submit in one update; read it from a later
///    one. This is the single thing to get right when porting.
///
/// `submit` is update-only — the runtime rejects it from a query, and so does
/// the compiler. Reading the response (`poll`, headers) is query-safe.
///
/// The response of a completed outcall lives in update-execution context.
/// Read it from an update call; if you want to serve it from a query
/// afterwards, copy it into stable state in that update first.
import Prim "mo:⛔";

module {
  public type Method = { #get; #post; #head; #put; #delete };

  public type Error = {
    /// The runtime rejected the request — a malformed URL, an unsupported
    /// scheme, a body on a method that forbids one, or a quorum out of range.
    #rejected;
    /// A header was refused; carries the header name.
    #headerRejected : Text;
  };

  public type Response = { status : Nat16; body : Blob };

  public type Poll = { #pending; #ready : Response };

  public type Request = {
    url : Text;
    method : Method;
    body : Blob;
    quorum : Nat32;
    headers : [(Text, Text)];
  };

  // Positional method encoding, fixed by the host ABI.
  func methodCode(m : Method) : Nat32 {
    switch m {
      case (#get) 0;
      case (#post) 1;
      case (#head) 2;
      case (#put) 3;
      case (#delete) 4;
    }
  };

  /// A GET request at quorum 1 with no headers. Refine with the `with*`
  /// helpers before submitting.
  public func get(url : Text) : Request = {
    url; method = #get; body = ""; quorum = 1; headers = [];
  };

  /// A POST request carrying `body`, quorum 1, no headers.
  public func post(url : Text, body : Blob) : Request = {
    url; method = #post; body; quorum = 1; headers = [];
  };

  /// A request with an explicit method.
  public func request(url : Text, method : Method) : Request = {
    url; method; body = ""; quorum = 1; headers = [];
  };

  /// Set how many validators must independently fetch and agree. Higher
  /// quorum costs more and buys more assurance; choose it per call.
  public func withQuorum(r : Request, quorum : Nat32) : Request = { r with quorum };

  /// Set the request body.
  public func withBody(r : Request, body : Blob) : Request = { r with body };

  /// Append a request header.
  public func withHeader(r : Request, name : Text, value : Text) : Request = {
    r with headers = Prim.Array_tabulate<(Text, Text)>(
      r.headers.size() + 1,
      func i = if (i < r.headers.size()) r.headers[i] else (name, value))
  };

  /// Submit the request. Returns once it is queued — not once it has
  /// completed. Read the response from a later update with `poll`.
  ///
  /// Update-only: calling this from a query is a compile-time error.
  public func submit(r : Request) : { #ok; #err : Error } {
    for ((name, value) in r.headers.values()) {
      let rc = Prim.thebesHttpRequestAddHeader(
        Prim.encodeUtf8(name), Prim.encodeUtf8(value));
      if (rc != 0) return #err(#headerRejected(name));
    };
    let rc = Prim.thebesHttpRequestSubmit(
      Prim.encodeUtf8(r.url), methodCode(r.method), r.body, r.quorum);
    if (rc == 0) #ok else #err(#rejected)
  };

  /// Whether the outcall submitted earlier has landed. Returns `#pending`
  /// until a response is available, then `#ready`.
  public func poll() : Poll {
    let st = Prim.thebesHttpResponseStatus();
    if (st < 0) return #pending;
    #ready({
      status = Prim.intToNat16Wrap(Prim.int32ToInt(st));
      body = Prim.thebesHttpResponseBodyCopy();
    })
  };

  /// The response body as UTF-8 text, or `null` if it is not valid UTF-8.
  public func text(r : Response) : ?Text = Prim.decodeUtf8(r.body);

  /// The number of headers on the response.
  public func headerCount() : Nat32 = Prim.thebesHttpResponseHeaderCount();

  /// The header VALUE at `idx`, or `null` when the index is out of range or
  /// the value is not valid UTF-8.
  ///
  /// Header values are addressable by index only: the host exposes no
  /// accessor for header *names*, so a value cannot be looked up by name.
  /// If you need a specific header, request an endpoint that returns it in
  /// the body, or read values by position when their order is known.
  public func headerValue(idx : Nat32) : ?Text {
    let size = Prim.thebesHttpResponseHeaderValueSize(idx);
    if (size < 0) return null;
    Prim.decodeUtf8(Prim.thebesHttpResponseHeaderValueCopy(idx))
  };
}
