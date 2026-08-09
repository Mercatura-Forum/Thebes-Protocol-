---
name: thebes-deploy
description: Build, deploy, call, and upgrade smart contracts on the Thebes Layer 1 with the thebes-deploy CLI. Use when writing a Motoko or Rust contract for Thebes, writing or editing a thebes.toml, deploying or upgrading a contract, or debugging a failed deploy.
---

# Deploying on Thebes

Authoritative rules for shipping a smart contract to Thebes. Follow them in
order; each section is a rule, not a suggestion.

## 1. Install the CLI

```sh
curl -L https://github.com/Mercatura-Forum/Thebes-Protocol-/releases/download/v0.1.10-thebes-deploy/install-thebes-deploy.sh | bash
thebes-deploy --version     # confirm 0.1.10 or later before anything else
thebes-deploy setup         # checks moc, mops, cargo, node
```

Always check `--version` first. Older binaries do not enforce the guards below
and will let a project be built in a shape that cannot be upgraded later.

`moc` is a contested binary name — Qt's meta-object compiler often occupies
`/usr/bin/moc`. If `moc --version` does not say **"Motoko compiler"**, the wrong
one is on `PATH`.

## 2. Start a project

```sh
thebes-deploy new my-app        # backend (motoko|rust) + optional frontend + manifest
thebes-deploy identity new me   # one-time: your ed25519 signing key
```

`new` writes a manifest already in the correct shape. Prefer it over writing a
`thebes.toml` by hand.

## 3. The manifest

```toml
[project]
name = "my-app"
default_network = "wan"
chain_id = 2026

[networks.wan]
validators = ["http://NODE_A:18080", "http://NODE_B:18080", "http://NODE_C:18080", "http://NODE_D:18080"]
boundary = "https://<boundary-host>"
routing = "smart"

[canisters.my-app]
type   = "backend-motoko"
cid    = "auto"                 # allocated on first deploy and written back
source = "main.mo"
wasm   = "build/my-app.wasm"
```

**Declare `source` and omit `build`.** The tool then compiles the contract as
`moc --legacy-persistence $(mops sources) -o <wasm> <source>`.

**If you write your own `build` command, it must pass `--legacy-persistence`.**
This is the rule that matters most on this platform:

```toml
build = "mkdir -p build && moc --legacy-persistence $(mops sources) -o build/my-app.wasm main.mo"
```

`--legacy-persistence` keeps actor state in **stable memory**, which an in-place
upgrade carries across. `moc`'s default keeps state in **main memory**, which
this platform does not carry — a contract built that way installs and runs, and
comes back empty after its first upgrade. The tool refuses such a module at
install and at upgrade. Never work around that refusal with
`--allow-state-loss` on a contract that holds state.

Two more manifest rules:

- `moc` does not create the output directory. Any hand-written build command
  needs `mkdir -p build &&` in front.
- Frontends use `type = "frontend"` with a `bundle` directory.

## 4. Deploy

```sh
thebes-deploy deploy
```

Check two lines in the output:

```
persistence: Motoko stable-memory persistence (memory32, exported as `mem`)
stable types: recorded at ./.thebes/deployed/<cid>.most
```

`memory32` is correct. `memory64` means the build lost `--legacy-persistence`.

**Commit `.thebes/deployed/<cid>.most`** with your source. It records the shape
of your live contract's state and is what the next upgrade is checked against.

## 5. Call it

```sh
thebes-deploy query my-app get                       # → (0 : nat)
thebes-deploy call  my-app increment                 # → (1 : nat)
thebes-deploy call  my-app setName --arg '("ada")'   # textual Candid
```

## 6. Upgrade

```sh
thebes-deploy upgrade my-app
```

The tool verifies stable-type compatibility before uploading. If a persistent
variable's type changed, the upgrade is refused with the compiler's `M0170`
diagnostic. Fix it by attaching a migration function:

```motoko
import Migration "Migration";
(with migration = Migration.run)
persistent actor MyApp { /* … new types … */ };
```

Only variables whose types changed appear in the migration; the rest carry
across by name. A deliberate reset goes through the migration too, so it is
visible in the source.

After any upgrade, confirm data survived by **reading state back**. A new method
answering only shows that new code is running.

Never rehearse an upgrade on a live id. Deploy the current wasm to a throwaway
id, seed it, run the exact sequence, then touch the real one.

## 7. Contracts already live on main-memory persistence

Do not convert one in place — rebuilding it with `--legacy-persistence` and
upgrading leaves the contract unusable on that id. Query the state out, install
the correct build on a fresh id (`thebes-deploy fresh-cid <name>`), and import
it. Ship state-holding contracts with a full-state export query from version one.

## 8. Time

Canisters read a monotonic clock derived from block height, not wall-clock time.
`Time.now()` does not return a real date, and it advances faster than real time.

- Express deadlines in ticks, not seconds: `real_seconds × F`, where `F` is at
  or above the cluster's block rate.
- For display timestamps, store the tick and convert on read against an anchor
  pair (a height and the real time it was observed at).
- Never compare a canister timestamp with a browser's `Date.now()`. The
  magnitudes differ by orders of magnitude and every comparison silently takes
  one branch. Let the contract compare tick to tick.
- Detect the regime rather than hardcoding a factor forever:

```motoko
let realClock = Time.now() > 1_500_000_000_000_000_000;
```

## 9. Common failures

| Symptom | Cause | Fix |
|---|---|---|
| `CanisterAlreadyHasWasm` | `deploy` to an id that already holds a wasm | `thebes-deploy upgrade <name>` |
| `refusing to install … main-memory persistence` | build lost `--legacy-persistence` | declare `source` and drop the `build` line, or add the flag |
| `Compatibility error [M0170]` | a persistent variable's type changed | add a `with migration` function |
| `there is no record of the stable-type signature` | contract predates v0.1.10 | write the record once (see below) |
| `moc: 5.15.x` in `setup` | Qt's `moc` shadows Motoko's | point at the real compiler |
| `No such file or directory` writing the wasm | build dir missing | `mkdir -p build &&` |

Writing the record for a contract deployed before v0.1.10:

```sh
moc --legacy-persistence --stable-types -o /tmp/deployed.wasm <the source you last deployed>
mkdir -p .thebes/deployed && cp /tmp/deployed.most .thebes/deployed/<cid>.most
```

## Reference

- [Quickstart](docs/quickstart.md) — nothing to a live contract
- [Dependencies and installing](docs/cli-deploy.md) — toolchain, API keys, metered deploys
- [Deploying](docs/deploying.md) — full command reference
- [Upgrading](docs/upgrading.md) — persistence, migrations, the record
- [Examples](examples/README.md) — Motoko and Rust contracts, full-stack apps
