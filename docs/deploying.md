# Deploying with `thebes-deploy`

`thebes-deploy` is the command-line tool for shipping a smart contract to Thebes.
One manifest (`thebes.toml`) describes your project; the tool builds the wasm,
signs the install, routes the chunks across the validator set, verifies the
result, and gives you a contract id you can call. Backend and frontend in one
motion.

This guide walks the whole loop on a real example — the [`counter`](../examples/counter)
contract — then the full-stack [`e-commerce`](../examples/e-commerce) store. Every
command and output below is from an actual deploy.

---

## 1. Toolchain

You need three things on your `PATH`:

| Tool | What for | Check |
|---|---|---|
| `moc` (Motoko compiler) | compiles Motoko contracts | `moc --version` → `Motoko compiler 1.4.x` |
| `mops` | Motoko package manager (`mo:core` etc.) | `mops --version` |
| `cargo` (+ `wasm32-unknown-unknown`) | only for Rust contracts | `cargo --version` |

> **Watch the `moc` trap.** On systems with Qt installed, `which moc` may find
> Qt's *Meta-Object Compiler* (`moc 5.x`) instead of the Motoko compiler. They
> share a name. If `moc --version` doesn't say **"Motoko compiler"**, point your
> build command at the real binary explicitly (e.g. `/path/to/moc-1.4.1/moc`).

Run the built-in check:

```sh
thebes-deploy setup
```

---

## 2. Scaffold a manifest

```sh
thebes-deploy init
```

This writes a `thebes.toml`. It is the single source of truth for your deploy —
which network, which contracts, how they're built, and which identity signs the
install. Here's a complete manifest for a Motoko backend:

```toml
[project]
name = "counter-demo"
default_network = "wan"
chain_id = 2026                      # must match the network you're joining

[networks.wan]
validators = [
    # the validator endpoints for the network you're deploying to
    "http://NODE_A:18080",
    "http://NODE_B:18080",
    "http://NODE_C:18080",
    "http://NODE_D:18080",
]
boundary = "https://<boundary-host>" # serves your frontend at /_/raw/<cid>/...
routing  = "smart"                   # picks the lowest-load validator per call

[canisters.counter]
type   = "backend-motoko"
cid    = "auto"                      # the tool allocates one + writes it back here
source = "main.mo"
wasm   = "build/counter.wasm"
build  = "mkdir -p build && moc --legacy-persistence -o build/counter.wasm main.mo"
```

The first deploy replaces `cid = "auto"` with the allocated id and writes it
back, so re-runs are stable.

### Identities

Installs are signed. Create one once; it becomes the controller of the contracts
you deploy:

```sh
thebes-deploy identity new my-id
```

The active identity (in `~/.thebes/config.toml`) signs by default; override per
run with `--identity`, or per contract with an `identity = "..."` line in the
manifest.

---

## 3. Build, deploy, verify

```sh
thebes-deploy build      # compile every contract in the manifest
thebes-deploy deploy     # build + install + (upload frontend) + verify
```

A real backend deploy:

```
[deploy] counter
  build: `mkdir -p build && moc --legacy-persistence -o build/counter.wasm main.mo`
  cid:   251811379359164 (auto-allocated; writing back to manifest)
  identity: my-id (principal=6e3e78…)
  install: 268278 bytes wasm → cid 251811379359164
  ✓  module_hash=f461cd20… validator=http://NODE_A:18080 chunks=9
✓ deploy complete
```

The wasm is split into 32 KiB chunks, reassembled and SHA-256-verified on the
cluster, then installed — finalized by a Byzantine quorum and sealed into the
chain's history.

---

## 4. Call it

`call` submits an update (mutates state, finalized by quorum); `query` reads
replicated state. Both take arguments in **Candid's textual form**:

```sh
thebes-deploy query counter get                 # → (0 : nat)
thebes-deploy call  counter increment           # → (1 : nat)
thebes-deploy call  counter increment           # → (2 : nat)
thebes-deploy query counter get                 # → (2 : nat)
```

Arguments use `--arg`:

```sh
# e-commerce: order 2× product[0] and 1× product[1]
thebes-deploy call storefront placeOrder --arg '(vec {0:nat; 1:nat}, vec {2:nat; 1:nat})'
# → (0 : nat)   the new order id

thebes-deploy query storefront myOrders
# → (vec { record { id = 0; total = 17_440; itemCount = 3 } })
```

That's a full storefront — catalog, cart, orders — served entirely from the
chain, with each order signed by the validator set and keyed to the buyer.

---

## 5. Frontends

A frontend contract installs the asset wasm, then uploads your bundle:

```toml
[canisters.web]
type   = "frontend"
cid    = "auto"
wasm   = "/path/to/asset_canister.wasm"
bundle = "dist"                       # your built static site
health_check_url = "/index.html"
```

`thebes-deploy deploy` uploads `dist/` in small chunks after the install. The
boundary then serves it at `/_/raw/<cid>/<path>`. To re-upload only the bundle
(same wasm), use `--skip-install`.

---

## Command reference

| Command | Does |
|---|---|
| `thebes-deploy new <name>` | scaffold a whole project: backend, optional frontend, wired manifest |
| `thebes-deploy add auth` | add Memphis passkey sign-in to the project in this directory |
| `thebes-deploy init` | scaffold a bare `thebes.toml` into an existing directory |
| `thebes-deploy setup` | check the local toolchain |
| `thebes-deploy build [name]` | compile contracts |
| `thebes-deploy deploy [name]` | build + install + upload + verify |
| `thebes-deploy call <name> <method> [--arg '(…)']` | update call |
| `thebes-deploy query <name> <method> [--arg '(…)']` | query call |
| `thebes-deploy status` | cluster + validator status |
| `thebes-deploy verify <name>` | re-run post-install verification |
| `thebes-deploy identity new <name>` | create a signing identity |
| `thebes-deploy fresh-cid <name>` | re-allocate a contract's id in the manifest |

Add `--no-facts` for clean CI output and `--json` for machine-readable results.
