# Upgrading a contract in place

[quickstart.md](quickstart.md), [cli-deploy.md](cli-deploy.md), and
[deploying.md](deploying.md) cover **installing** a contract onto a fresh id.
This guide covers the other half of a contract's life: shipping a **new version
to the same id, keeping the state already there.** The id does not change, so
every link, balance, and row of history survives the deploy.

---

## 1. The upgrade command

The cluster refuses to re-install a wasm onto an id that already holds one — a
plain `deploy` to an existing id is an *install*, and is rejected
(`CanisterAlreadyHasWasm`). That guard stops an accidental re-install from
wiping a live contract.

To ship new code to the same id:

```sh
thebes-deploy upgrade <name>
```

The chunked commit carries `mode=Upgrade`, so the substrate runs
`canister_pre_upgrade`, carries the contract's **stable memory** to a fresh
instance of the new module, and runs `canister_post_upgrade`. The `cid` in your
`thebes.toml` must be explicit (not `"auto"`) and must already hold a wasm.
`deploy <name> --upgrade` is equivalent.

Main memory is **not** carried across. Everything in §2 follows from that.

---

## 2. The persistence model

Motoko contracts are compiled with **`moc --legacy-persistence`**, which keeps
actor state in stable memory — exactly what the upgrade contract carries.

Declare `source` and let the tool compose the compile line:

```toml
[canisters.my-app]
type   = "backend-motoko"
cid    = "auto"
source = "main.mo"
wasm   = "build/my-app.wasm"
```

If you write your own `build` command, it must pass the flag:

```toml
build = "mkdir -p build && moc --legacy-persistence $(mops sources) -o build/my-app.wasm main.mo"
```

`moc`'s default model, enhanced orthogonal persistence, keeps actor state in main
memory and depends on the replica retaining it across an upgrade. This platform
carries stable memory only, so such a module is the wrong artifact for this
target: it installs and runs, and comes back up empty after an upgrade.
`thebes-deploy` reads the module's bytes and refuses it — at install and at
upgrade — before uploading anything:

```
refusing to install on canister <cid>: the module uses Motoko main-memory
persistence / EOP (memory64, exported as `mem`), and this platform's upgrade
contract carries STABLE memory only.
```

The deploy log states the model of what it is about to ship:

```
persistence: Motoko stable-memory persistence (memory32, exported as `mem`)
```

Confirm that line reads `memory32` on every backend deploy.

---

## 3. Changing the type of a persistent variable

The type of a persistent variable determines what the contract can restore after
an upgrade. Change a type, and the old bytes no longer describe the new shape.

**The tool checks this for you.** Before uploading, it extracts the new module's
stable-type signature and compares it against the installed one with
`moc --stable-compatible`. An incompatible change is refused, quoting the
compiler:

```
Compatibility error [M0170], the new type of stable variable `count` is not
compatible with the previous version.
 The previous type
  var Nat
 is not a subtype of
  var Text
```

### The record

The comparison needs the installed signature, and the cluster does not serve an
installed module's bytes back. The tool therefore records it: every successful
install and upgrade writes

```
.thebes/deployed/<cid>.most
```

**Commit that file with your source.** It is the record of what your live
contract's state looks like, and the next upgrade is checked against it.

A missing record refuses the upgrade. For a contract deployed before v0.1.10,
write the record once from the source you last deployed:

```sh
moc --legacy-persistence --stable-types -o /tmp/deployed.wasm <that source>
mkdir -p .thebes/deployed && cp /tmp/deployed.most .thebes/deployed/<cid>.most
```

### Carrying data forward: `with migration`

A migration function maps the old persistent fields onto the new ones and runs
during the upgrade:

```motoko
// Migration.mo — v1 → v2
import Map "mo:core/Map";
import Nat "mo:core/Nat";
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

Only variables whose types changed appear in the migration's input and output.
Every other persistent variable carries across untouched, matched by name.

**Resetting a variable.** Route the reset through the migration — read the old
value in, return a fresh one out. The reset then appears in your source, where it
can be reviewed, rather than as a consequence of two types drifting apart.

---

## 4. Contracts already live on the default persistence model

A contract deployed from a module compiled without `--legacy-persistence` holds
its state in main memory. Two things to know:

**Do not convert it in place.** Rebuilding it with `--legacy-persistence` and
upgrading is not a supported migration: `post_upgrade` traps and the contract is
left unusable on the id. The same applies in the opposite direction.

**The supported path is a fresh id.** Query the state out of the running
contract, install the `--legacy-persistence` build on a new id
(`thebes-deploy fresh-cid <name>`), and import it. Ship state-holding contracts
with a full-state export query from the first version so this is always
available.

To ship one more version of such a contract without losing its state, serialise
the heap into stable memory first, then force the upgrade:

```sh
thebes-deploy call    <name> __motoko_stabilize_before_upgrade
thebes-deploy upgrade <name> --allow-state-loss
```

The guard reads module bytes and cannot observe that you stabilised, which is why
the override is required. Read your state back afterwards.

---

## 5. Frontends: re-upload assets, keep the id

A frontend's wasm is the generic asset canister and rarely changes. Ship a new
build by re-uploading the **assets** to the same id, which is not an install:

```sh
cd frontend && npm run build && cd ..
thebes-deploy deploy web --skip-install
```

If your page reads a backend id at runtime, inject it into the fresh `dist/`
before uploading, and bump whatever version marker your app serves so clients
pick up the new bytes. The URL — `/_/raw/<web-id>/index.html` — is unchanged.

---

## 6. Rehearse on a throwaway id

Test an upgrade against a disposable id, never against the live one. Deploy the
*current* wasm to a fresh id (`cid = "auto"`), put representative state on it, run
the exact sequence you intend to run, and confirm the state survived and the new
methods answer. A `post_upgrade` that traps can leave a contract unusable on its
id.

---

## 7. Checklist

1. Build with `--legacy-persistence` — declare `source` and let the tool compose
   it. Confirm the deploy log reads `persistence: Motoko stable-memory
   persistence (memory32, …)`.
2. Changed a persistent type? Add a `with migration` function (§3). The upgrade
   is refused until the signatures are compatible or the migration accounts for
   the change.
3. Rehearse on a throwaway id (§6).
4. Backend: `thebes-deploy upgrade <name>`.
5. Frontend: `thebes-deploy deploy web --skip-install`.
6. Verify: `module_hash` changed, **and** a query returns the pre-upgrade state.
   A new method answering shows new code is running; it does not show that data
   survived.
7. Commit the updated `.thebes/deployed/<cid>.most` with the release.

See [cli-deploy.md](cli-deploy.md) for first-install and the credit-metered path,
and [deploying.md](deploying.md) for the full command reference.
