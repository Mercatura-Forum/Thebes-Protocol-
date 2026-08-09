# Upgrading a canister in place (state-preserving)

[quickstart.md](quickstart.md), [cli-deploy.md](cli-deploy.md), and
[deploying.md](deploying.md) all cover the same thing: **installing** a contract
onto a fresh id. This guide covers the other half of a contract's life — shipping
a **new version to the same id, keeping the state that's already there.** Your
canister id doesn't change, so every link, every stored balance, and every row of
history survives the deploy.

Every command and every result below was measured on the live cluster. Where a
claim rests on a specific run, the contract id is given so it can be re-checked.

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
dispatches `engine.upgrade_canister`: it runs `canister_pre_upgrade`, carries the
canister's **stable memory** to a fresh instance of the new module, and runs
`canister_post_upgrade`. The id in your `thebes.toml` must be explicit (not
`"auto"`) and must already hold a wasm.

Main memory is **not** carried across, and there is no keep-vs-replace mode to
ask for — the contract has exactly one shape. Everything in §2 follows from that.

---

## 2. The persistence model your contract must be compiled for

Compile every Motoko contract with **`moc --legacy-persistence`**:

```toml
build = "mkdir -p build && moc --legacy-persistence $(mops sources) -o build/my-app.wasm main.mo"
```

Legacy (classical) persistence keeps actor state in **stable memory**, which is
exactly what the upgrade contract carries. `moc`'s *default* is enhanced
orthogonal persistence (EOP), which keeps actor state in **main memory** and
relies on the replica retaining it across an upgrade. This platform does not
implement main-memory retention, so an EOP module is the wrong artifact for this
target: it installs, it runs, it upgrades — and it comes back up blank.

Because that failure is silent, `thebes-deploy` reads the module's own bytes and
**refuses the upgrade before uploading anything**:

```
refusing to upgrade canister <cid> in place: the new module uses Motoko main-memory
persistence / EOP (memory64, exported as `mem`), and this platform's upgrade contract
carries STABLE memory only (pre_upgrade → carry stable memory → fresh instance →
post_upgrade). The upgrade would report success and leave the canister blank.
  Evidence: read from the module's own bytes — export `mem` → memory64.
```

Measured, one contract per arm, same source, same tool, same day — the only
variable is the compiler flag:

| Build | id | state before → after | new code ran? |
|---|---|---|---|
| `moc --legacy-persistence` | `50571071155301` | **3 → 3** | yes (`version` v1 → v2) |
| `moc` (EOP), upgrade forced | `137619036531241` | **3 → 0** | yes (`version` v1 → v2) |

Both arms shipped a module that answered from its new code, so "the upgrade ran"
is not evidence that state survived. Read your state back.

> **A note on the flag.** `moc` marks `--legacy-persistence` deprecated and says
> it will be removed in a future compiler. We name it anyway because it is the
> model this platform actually implements; when the substrate gains main-memory
> retention, this guidance changes and the tool's guard changes with it.

---

## 3. Changing the type of a persistent variable

**Under legacy persistence a changed persistent type is discarded silently.**
Nothing traps, nothing rolls back, and the upgrade reports success:

```motoko
// before: var count : Nat = 0;   (contract holds 3)
// after:  var count : Text = "zero";
```

Measured on `50571071155301`: `get()` returned `3` before the upgrade and
`"zero"` after — the initialiser value. The variable was dropped and re-created.
Every *other* persistent variable carries across untouched, matched by name.

This is the opposite of EOP's behaviour, where `post_upgrade` traps
`Memory-incompatible program upgrade` and refuses to land until you write a
migration. On this platform nothing forces you. **Check it yourself, every time.**

### The check that catches it

`moc` can emit a contract's stable-type signature and compare two of them:

```sh
moc --legacy-persistence --stable-types -o /tmp/new.wasm main.mo   # writes /tmp/new.most
moc --stable-compatible old.most new.most                          # exit 0 = safe
```

An incompatible change fails loudly, with the remedy:

```
Compatibility error [M0170], the new type of stable variable `count` is not
compatible with the previous version.
 The previous type
  var Nat
 is not a subtype of
  var Text
```

Keep the `.most` file of whatever is currently deployed **in your repository**,
next to the manifest. It is the only record of what the live contract's state
looks like; the cluster does not serve the installed module's bytes back to you.

### Carrying the data forward instead: `with migration`

A migration function maps the old persistent fields onto the new ones. It runs on
this platform under legacy persistence — measured on `268607152579679`: a contract
holding `count : Nat = 3` upgraded to a version declaring `count : Text`, with the
migration below, came back reading `"3"`, not `"zero"`.

```motoko
// Migration.mo — v1 → v2
import Map "mo:core/Map";
import Nat "mo:core/Nat";
module {
  type ItemV1 = { id : Nat; qty : Nat };
  type ItemV2 = { id : Nat; onHand : Nat; sold : Nat };

  // Carry data forward: read old.items, return the new shape.
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

Only the variables whose types changed appear in the migration's input and output;
every other persistent variable carries across untouched, matched by name.

**Resetting instead of carrying forward.** If a changed variable holds ephemeral
state you're fine discarding, still route it through the migration — read it in
the input, and return a fresh value in the output (e.g. `Map.empty<…>()`). The
reset then appears in your source, reviewable, instead of happening silently
because two types drifted apart.

---

## 4. Already live on an EOP module?

A contract that is *already deployed* as an EOP module holds its state in a main
memory the upgrade does not carry. Two paths work and one bricks the contract.

**Keeps your state (measured).** Serialise the heap into stable memory first,
using the entry point the EOP compiler provides, then force the upgrade:

```sh
thebes-deploy call   <name> __motoko_stabilize_before_upgrade
thebes-deploy deploy <name> --upgrade --allow-state-loss
```

Measured on `271082849709232`: `3` before, `3` after. The red control — the same
module hash, upgraded the same way but **without** the stabilize call
(`137619036531241`) — read `0`. The stabilize call is the whole difference.

> `--allow-state-loss` is required only because the guard reads the module's
> bytes and cannot see that you stabilised. Its name describes the ordinary case,
> not this one. Verify by reading your state back after the upgrade.

**Bricks the contract — do not do this.** Rebuilding the same contract with
`--legacy-persistence` and upgrading in place does **not** convert it. The legacy
runtime cannot read the stable image EOP wrote:

```
post_upgrade trapped: canister trapped: higher stable memory version (expected 1..2)
```

Measured on `271082849709232`: after that trap, every subsequent call and query
traps `internal error: unexpected state entering InQuery` / `InUpdate`, on **all
four validators**, and stays that way. The contract is unrecoverable; the id is
lost. (The reverse direction, legacy → EOP, fails the same way.)

**The safe conversion** is not an in-place upgrade at all: query the state out of
the running contract, install the `--legacy-persistence` build on a **fresh id**
(`thebes-deploy fresh-cid <name>`), and import it. Ship state-holding contracts
with a full-state export query from day one so this is always available.

---

## 5. Frontends: re-upload assets, keep the id

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

## 6. What a failed upgrade leaves behind

`engine.upgrade_canister` is designed to be atomic: if `post_upgrade` traps, the
cluster rolls back and the id keeps the previous wasm and the previous state.

**That is not something to rely on.** The `post_upgrade` trap in §4 rolled the
module back and still left the contract wedged — every query and update trapping
`unexpected state entering InQuery`, identically on all four validators, with no
recovery. A failed upgrade can cost you the id.

So: **never rehearse an upgrade against a live id.** Deploy the *current* wasm to
a throwaway id (`cid = "auto"`), put representative state on it, run the exact
sequence you intend to run, and confirm the state survived and the new methods
answer. Only then touch the real id.

---

## 7. Checklist

1. Build with `moc --legacy-persistence`. Confirm the deploy log prints
   `persistence: Motoko stable-memory persistence (memory32, exported as 'mem')`.
2. Changed a persistent type? `moc --stable-compatible <deployed>.most <new>.most`.
   Non-zero exit means the variable will be **silently discarded** — write a
   `with migration` function (§3), or accept the reset deliberately and in writing.
3. Dry-run on a throwaway id: install the deployed wasm → seed state → upgrade →
   verify state and new methods. Never rehearse on the live id (§6).
4. Backend: `thebes-deploy deploy <name> --upgrade`.
5. Frontend: `thebes-deploy deploy web --skip-install` (inject backend id, bump version).
6. Verify: `module_hash` changed, **and** a query returns the pre-upgrade state.
   A new `version()` answering proves only that new code ran — not that data survived.
7. Commit the new `.most` alongside the release, so the next upgrade has something
   to compare against.

See [cli-deploy.md](cli-deploy.md) for first-install and the credit-metered path,
and [deploying.md](deploying.md) for the full command reference.
