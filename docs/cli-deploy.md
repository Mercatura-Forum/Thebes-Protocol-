# Dependencies, API keys, and installing canisters

A complete walk from a fresh machine to a live smart contract on Thebes, with
both ways of signing the install: **sign it yourself**, or **deploy through the
gateway against a credit balance** using an API key. The five-minute version is
in [quickstart.md](quickstart.md); the full command reference is in
[deploying.md](deploying.md). This guide is the part in between — what to
install, and how the credit-metered path works.

Every command below is shown with the output it actually produces.

---

## 1. What you need

| Tool | What it is | Check |
| --- | --- | --- |
| `thebes-deploy` | the deploy CLI | `thebes-deploy --version` |
| `moc` | the Motoko compiler | `moc --version` → `Motoko compiler …` |
| `mops` | the Motoko package manager | `mops --version` |
| Node 20+ | only if your contract ships a frontend | `node --version` |

Install the CLI:

```sh
curl -L https://github.com/Mercatura-Forum/Thebes-Protocol-/releases/download/v0.1.4-thebes-deploy/install-thebes-deploy.sh | bash
thebes-deploy setup
```

`setup` reports what it finds:

```
  moc: 1.4.x (/path/to/moc)
  mops: 2.x (/path/to/mops)
  cargo: 1.x (…)
  mo:core: present
```

**Two things to watch in `setup`:**

- **A `moc` that isn't Motoko.** On a machine with Qt installed, `which moc`
  often finds Qt's *Meta-Object Compiler* — `setup` will print something like
  `moc: 5.15.x`. They share a name. If the version isn't `Motoko compiler …`,
  point your build command at the real Motoko compiler explicitly (an absolute
  path to the `moc` that `dfx` or your Motoko install provides).
- **`mo:core: missing`** usually means the package cache isn't where `setup`
  looked, not that it's truly absent — `mops install` in your contract directory
  resolves it (next step).

**Platform note.** The CLI runs natively on Linux and macOS. On Windows, use WSL:
the Motoko compiler has no native Windows build, so the compile step needs a
Linux environment.

---

## 2. Install dependencies

**Backend (Motoko).** In the contract directory, `mops install` pulls
[`mo:core`](https://github.com/dfinity/motoko-core) and any libraries your
contract imports (for example
[`thebes-lib`](https://github.com/Mercatura-Forum/thebes-lib)). Confirm it
type-checks before you deploy:

```sh
cd motoko
mops install
moc --check $(mops sources) main.mo      # use the real Motoko moc (see §1)
```

`mops sources` expands to the `--package` flags your build needs — keep it in the
build command so the compiler can find every import.

**Frontend (optional).** If your contract serves a UI, install the web
dependencies — including [`@thebes/sdk`](https://github.com/Mercatura-Forum/thebes-sdk),
the browser client:

```sh
cd frontend
npm install
npm run build
```

---

## 3. Describe the deploy

A `thebes.toml` declares the network and the contracts. Get the validator
endpoints and boundary for the network you're joining from whoever runs it:

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
cid    = "auto"                       # the tool allocates one and writes it back
source = "main.mo"
wasm   = "build/my-app.wasm"
build  = "mkdir -p build && moc --package core $(…) -o build/my-app.wasm main.mo"
```

**A build-line detail that bites:** the compiler writes the wasm but does **not**
create the output directory — `moc -o build/my-app.wasm …` fails with
`No such file or directory` if `build/` doesn't exist. Prefix the build with
`mkdir -p build &&` (as above). When your contract imports packages, include the
`mops sources` flags in the build line — e.g. for a contract using `mo:core` and
`thebes-lib`:

```
build = "mkdir -p build && moc --package core .mops/core@<v>/src --package thebes-lib '.mops/_github/thebes-lib#<tag>/src' -o build/my-app.wasm main.mo"
```

---

## 4. Path A — sign the install yourself

You hold a signing key; the CLI signs the install envelope and submits it to the
validators directly. This is the path for operators, CI, and anyone running
against a network they control.

```sh
thebes-deploy identity new me      # one-time: your ed25519 signing key
thebes-deploy deploy
```

```
[deploy] my-app
  build: `mkdir -p build && moc … -o build/my-app.wasm main.mo`
  cid:   21800575273018 (auto-allocated; writing back to manifest)
  identity: me (principal=6e3e…02)
  install: 598925 bytes wasm → cid 21800575273018
  ✓  module_hash=8672…896e validator=http://NODE_B:18080 chunks=19 (…ms)
[manifest] cid 21800575273018 written back for my-app
✓ deploy complete
```

The tool compiles, signs, chunks the wasm across the validators, and verifies the
installed module hash — finalized by a Byzantine quorum and sealed into the chain.
The allocated `cid` is written back to your manifest so re-runs are stable.

Call it — arguments are textual Candid passed with `--arg`:

```sh
thebes-deploy query my-app get               # → (0 : nat)
thebes-deploy call  my-app increment         # → (1 : nat)
thebes-deploy call  my-app seedDemo          # → (true)
thebes-deploy query my-app myRole            # → (vec { record { … = "owner" } })
```

> **Install once per id.** The cluster refuses to re-install a wasm onto a cid
> that already holds one. Deploy to a fresh id (`cid = "auto"`); to ship a new
> version of a frontend's *assets* (same wasm), use `thebes-deploy deploy
> --skip-install`. To ship a new version of a **backend** to the same id while
> keeping its state, see [upgrading.md](upgrading.md).

---

## 5. Path B — deploy with an API key (credit-metered)

When you don't run the cluster yourself, you deploy through the **gateway**: it
signs and installs on your behalf and debits a **credit** balance keyed to your
developer account. You authenticate the CLI with an API key.

**1 — Get an API key.** Sign in to the **Thebes IDE** with a passkey and generate
an API key. The key begins `tbk_`. (The IDE is itself a smart contract served
on-chain — see the link on the [project homepage](../README.md).)

**2 — Log in.** Store the key for the CLI:

```sh
thebes-deploy login --api-key tbk_xxxxxxxxxxxx
```

This writes `~/.thebes/credentials.toml` (`api_key` + the `gateway` it talks to).

**3 — Check your balance.** `credits` shows what you have and what it buys:

```sh
thebes-deploy credits
```

```
Balance: 60,000,000 credits
  = 3 single deploys (20,000,000 each)
  or 1 project deploys (40,000,000 each)
```

**4 — Deploy.** `--metered` builds every canister locally, uploads the artifacts
to the gateway, which charges your pool per contract and installs each as
controller:

```sh
thebes-deploy deploy --metered
```

```
[build]   my-app (metered)
[metered] uploading 1 contract(s) to the gateway …
  ✓ my-app → cid 900165
[metered] credits remaining: 40,000,000
```

The charge lands only on a confirmed install — a build or upload that fails
costs nothing. Re-check any time with `thebes-deploy credits`.

---

## Command reference (short)

| Command | Does |
| --- | --- |
| `thebes-deploy setup` | check the local toolchain |
| `thebes-deploy init` | scaffold a `thebes.toml` |
| `thebes-deploy identity new <name>` | create a local signing key |
| `thebes-deploy build` | compile every canister in the manifest |
| `thebes-deploy deploy` | build + install + upload + verify (you sign) |
| `thebes-deploy login --api-key <tbk_…>` | store an API key for metered deploys |
| `thebes-deploy credits` | show credit balance and deploys it buys |
| `thebes-deploy deploy --metered` | deploy through the gateway, charged to credits |
| `thebes-deploy call \| query <name> <method> [--arg '(…)']` | invoke a method |
| `thebes-deploy verify <name>` | re-run post-install verification |

`--no-facts` gives clean CI output; `--json` gives machine-readable results.

See [deploying.md](deploying.md) for frontends, the full command reference, and
calling contracts from a browser or raw HTTP.
