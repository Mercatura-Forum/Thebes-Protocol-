import List    "mo:core/List";
import Map     "mo:core/Map";
import Nat     "mo:core/Nat";
import Text    "mo:core/Text";
import Runtime "mo:core/Runtime";

/// Storefront — demo e-commerce smart contract.
/// Products are seeded at init; users place orders recorded on-chain.
persistent actor Storefront {

  // ── Types ───────────────────────────────────────────────────────────────

  type Product = {
    id    : Nat;
    name  : Text;
    price : Nat;   // price in cents
    emoji : Text;
    desc  : Text;
  };

  type Order = {
    id        : Nat;
    total     : Nat;   // total price in cents
    itemCount : Nat;
  };

  // ── Stable state ─────────────────────────────────────────────────────────

  // Product catalogue keyed by product id (Map iterates in key order)
  let catalogue : Map.Map<Nat, Product> = Map.empty<Nat, Product>();

  // Per-buyer order history (principal debug string → List of Orders)
  let orderBook : Map.Map<Text, List.List<Order>> = Map.empty<Text, List.List<Order>>();

  var nextOrderId : Nat = 0;

  // ── Seed products at init ───────────────────────────────────────

  do {
    let seed : [Product] = [
      { id = 0; name = "Onyx Keycap Set";   price = 6995; emoji = "⌨️"; desc = "120-key PBT doubleshot; deep onyx colorway with gold legends." },
      { id = 1; name = "Ceramic Pour-Over"; price = 3450; emoji = "☕"; desc = "Hand-thrown stoneware dripper. Fits Chemex and V60 filters." },
      { id = 2; name = "Linen Notebook";    price = 1800; emoji = "📓"; desc = "A5, 192 pages, 100 gsm ivory Tomoe River paper." },
      { id = 3; name = "Desk Terrarium";    price = 5200; emoji = "🌿"; desc = "Sealed borosilicate globe with live moss and pebble substrate." },
      { id = 4; name = "Beeswax Candle";    price = 2400; emoji = "🕯️"; desc = "100% pure beeswax, 45-hour burn, light honey fragrance." },
      { id = 5; name = "Walnut Card Tray";  price = 3990; emoji = "🪵"; desc = "CNC-milled solid walnut, oiled finish. Holds 30 business cards." },
    ];
    for (p in seed.vals()) {
      Map.add(catalogue, Nat.compare, p.id, p);
    };
  };

  // ── Public interface ─────────────────────────────────────────────────────

  /// Return the full product catalogue (in id order, lowest first).
  public query func products() : async [{ id : Nat; name : Text; price : Nat; emoji : Text; desc : Text }] {
    let buf = List.empty<{ id : Nat; name : Text; price : Nat; emoji : Text; desc : Text }>();
    for ((_, p) in Map.entries(catalogue)) {
      List.add(buf, { id = p.id; name = p.name; price = p.price; emoji = p.emoji; desc = p.desc });
    };
    List.toArray(buf)
  };

  /// Place an order for the calling principal.
  /// `ids` and `qtys` are parallel arrays — ids[i] × qtys[i] units purchased.
  /// Returns the new order id. Traps on bad input or unknown product id.
  public shared(msg) func placeOrder(ids : [Nat], qtys : [Nat]) : async Nat {
    if (ids.size() == 0)           { Runtime.trap("empty order") };
    if (ids.size() != qtys.size()) { Runtime.trap("ids/qtys length mismatch") };

    var total : Nat = 0;
    var itemCount : Nat = 0;
    var i = 0;
    while (i < ids.size()) {
      let qty = qtys[i];
      if (qty == 0) { Runtime.trap("zero qty at index " # Nat.toText(i)) };
      switch (Map.get(catalogue, Nat.compare, ids[i])) {
        case null    { Runtime.trap("unknown product id " # Nat.toText(ids[i])) };
        case (?prod) { total += prod.price * qty; itemCount += qty };
      };
      i += 1;
    };

    let orderId = nextOrderId;
    nextOrderId += 1;

    let order : Order = { id = orderId; total; itemCount };
    let buyerKey = debug_show(msg.caller);

    switch (Map.get(orderBook, Text.compare, buyerKey)) {
      case null {
        let lst = List.empty<Order>();
        List.add(lst, order);
        Map.add(orderBook, Text.compare, buyerKey, lst);
      };
      case (?lst) {
        List.add(lst, order);
      };
    };

    orderId
  };

  /// Return the calling principal's order history (newest first).
  public shared query(msg) func myOrders() : async [{ id : Nat; total : Nat; itemCount : Nat }] {
    let buyerKey = debug_show(msg.caller);
    switch (Map.get(orderBook, Text.compare, buyerKey)) {
      case null { [] };
      case (?lst) {
        // Reverse to newest-first: build result list in reverse traversal order
        let buf = List.empty<{ id : Nat; total : Nat; itemCount : Nat }>();
        for (o in List.reverseValues(lst)) {
          List.add(buf, { id = o.id; total = o.total; itemCount = o.itemCount });
        };
        List.toArray(buf)
      };
    }
  };
}
