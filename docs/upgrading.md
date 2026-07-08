# Upgrading a canister in place (state-preserving)

[quickstart.md](quickstart.md), [cli-deploy.md](cli-deploy.md), and
[deploying.md](deploying.md) all cover the same thing: **installing** a contract
onto a fresh id. This guide covers the other half of a contract's life — shipping
a **new version to the same id, keeping the state that's already there.** Your
canister id doesn't change, so every link, every stored balance, and every row of
history survives the deploy.

Every command below is shown with the output it actually produces.

---

## 1. Why upgrade is a separate flag

The cluster **refuses to re-install** a wasm onto an id that already holds one — a
plain `thebes-deploy deploy` to an existing id is an *install*, and the substrate
rejects it (`CanisterAlreadyHasWasm`). That guard is deliberate: it stops an
accidental re-install from silently wiping a live contract.

To ship new code to an id that already has a wasm, use `--upgrade`:

```sh
thebes-deploy deploy <name> --upgrade
```

`--upgrade` sends the chunked commit with `mode=Upgrade`, so the substrate
dispatches the state-preserving `engine.upgrade_canister` path (which runs your
contract's `post_upgrade` and **rolls back on any failure** — see §5). The id in
your `thebes.toml` must be explicit (not `"auto"`) and must already hold a wasm.

---

## 2. The step you cannot skip: stabilize first

Motoko contracts on Thebes use **enhanced orthogonal persistence (EOP)**: your
`stable`/`persistent` state lives in the main heap, and it is the heap — not a
hand-written `stable var` blob — that carries your data. An upgrade transports
*stable memory*, so **before** you upgrade you serialize the heap into stable
memory with the compiler-provided entry point:

```sh
thebes-deploy call <name> __motoko_stabilize_before_upgrade
```

Then upgrade. `post_upgrade` reads the state back (destabilizes) on the new wasm:

```sh
thebes-deploy call   <name> __motoko_stabilize_before_upgrade
thebes-deploy deploy <name> --upgrade
```

```
[call] ()
  upgrade: 570093 bytes wasm → cid 21800575273018 (chunked)
  ✓  module_hash=fb94…ad18 validator=http://NODE_A:18080 chunks=18 (…ms)
✓ deploy complete
```

Confirm the `module_hash` changed and read your state back with a query — the row
counts, balances, or history that were there before the upgrade are still there.

> If you skip the stabilize step, a bare upgrade can carry an empty stable image
> and your heap state is lost. Make `__motoko_stabilize_before_upgrade` the first
> line of every upgrade script.

---

## 3. Migrations: when you change a persistent type

If the new version changes the **type** of any persistent variable — adds a field
to a stored record, changes a variant, renames a field — the destabilize on the
new wasm can't map the old bytes onto the new shape, and `post_upgrade` traps:

```
post_upgrade trapped: RTS error: Memory-incompatible program upgrade
```

This is safe (§5 — the canister keeps running the *old* code and its state), but
your new version won't land until you make the old state assignable to the new
one. Two supported ways:

**A — a migration function.** Attach `with migration` to the actor; the function
receives the old stable fields and returns the new ones. Keep it in its own module:

```motoko
// Migration.mo — v1 → v2
import Map "mo:core/Map";
module {
  type ItemV1 = { id : Nat; qty : Nat };
  type ItemV2 = { id : Nat; onHand : Nat; sold : Nat };
  public func run(old : { items : Map.Map<Nat, ItemV1> })
                     : { items : Map.Map<Nat, ItemV2> } {
    let items = Map.empty<Nat, ItemV2>();
    for ((k, v) in Map.entries(old.items)) {
      Map.add(items, Nat.compare, k, { id = v.id; onHand = v.qty; sold = 0 });
    };
    { items }
  };
}
```

```motoko
// main.mo
import Migration "Migration";
(with migration = Migration.run)
persistent actor MyApp { /* … new types … */ };
```

Only the variables whose types changed appear in the migration's input/output;
every other persistent variable carries across untouched, matched by name.

**B — drop-and-reinitialize (for state you're fine resetting).** Rename the
persistent variable. EOP discards the removed name and initializes the new one
from its initializer, while your other variables persist by name — no migration
function needed:

```motoko
// before
let orders = Map.empty<Nat, Order>();   // old, now type-incompatible
// after — old `orders` data is dropped, `orders2` starts fresh; the rest persists
let orders2 = Map.empty<Nat, Order>();
```

Use **A** to carry data forward; use **B** only for ephemeral/rebuildable state
you explicitly want to reset. Document which one you chose and why, right at the
variable — the next maintainer needs to know a rename was a deliberate reset.

---

## 4. Frontends: re-upload assets, keep the id

A frontend's wasm is the generic asset canister — it rarely changes. To ship a new
build you re-upload the **assets** to the same id, which is not an install and so
isn't blocked by the re-install guard:

```sh
cd frontend && npm run build && cd ..
thebes-deploy deploy web --skip-install
```

`--skip-install` keeps the installed wasm and uploads the new bundle. If your page
reads a backend id at runtime (e.g. injected into `index.html`), inject it into
the fresh `dist/` before uploading, and bump whatever version marker your app
serves so clients pick up the new bytes. The URL — `/_/raw/<web-id>/index.html` —
is unchanged.

---

## 5. Rollback safety

`engine.upgrade_canister` is atomic: if `post_upgrade` traps for any reason (a
type mismatch, a migration bug, a trap in your own upgrade hook), the cluster
**rolls back** — the id keeps the previous wasm and the previous state, exactly as
before the attempt. A failed upgrade never leaves a half-migrated or bricked
contract. That makes it safe to test an upgrade against a live-shaped id: worst
case, nothing changes.

The recommended loop before touching a production id: deploy the *old* wasm to a
throwaway id, put representative state on it, run the exact
stabilize → `--upgrade` sequence, and confirm the state survived and the new
methods answer. Then run the same two commands against the real id.

---

## 6. Checklist

1. `moc --check` the new backend; `npm run build` the frontend.
2. Changed a persistent type? Add a migration (§3) — or a deliberate rename.
3. Dry-run on a throwaway id: install old wasm → seed state →
   `__motoko_stabilize_before_upgrade` → `deploy --upgrade` → verify state + new methods.
4. Backend: `call __motoko_stabilize_before_upgrade`, then `deploy <name> --upgrade`.
5. Frontend: `deploy web --skip-install` (inject backend id, bump version).
6. Verify: `module_hash` changed, a query returns the pre-upgrade state, the new
   surface answers.

See [cli-deploy.md](cli-deploy.md) for first-install and the credit-metered path,
and [deploying.md](deploying.md) for the full command reference.
