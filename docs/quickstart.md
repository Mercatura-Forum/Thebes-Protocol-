# Quickstart

From nothing to a live smart contract you can call, in a few minutes. The deep
version of every step is in [deploying.md](deploying.md); this is the fast path.

## 1. Install the tool

```sh
curl -L https://github.com/Mercatura-Forum/Thebes-Protocol-/releases/download/v0.1.4-thebes-deploy/install-thebes-deploy.sh | bash
thebes-deploy setup     # checks moc, mops, cargo
```

> If `moc --version` doesn't say **"Motoko compiler"**, you've got Qt's `moc` on
> your PATH — point your build command at the real Motoko compiler.

## 2. Write a contract

The smallest complete one ([`examples/counter`](../examples/counter)):

```motoko
persistent actor Counter {
  var count : Nat = 0;
  public func increment() : async Nat { count += 1; count };
  public query func get() : async Nat { count };
};
```

`persistent` state is replicated across the validator set and sealed into the
chain's history on every update. No database, no server.

## 3. Describe the deploy

A `thebes.toml` next to your contract:

```toml
[project]
name = "counter"
default_network = "wan"
chain_id = 2026

[networks.wan]
validators = ["http://NODE_A:18080", "http://NODE_B:18080", "http://NODE_C:18080", "http://NODE_D:18080"]
boundary = "https://<boundary-host>"
routing = "smart"

[canisters.counter]
type   = "backend-motoko"
cid    = "auto"
source = "main.mo"
wasm   = "build/counter.wasm"
build  = "moc -o build/counter.wasm main.mo"
```

(Get the validator endpoints + boundary for the network you're joining from
whoever runs it.)

## 4. Deploy

```sh
thebes-deploy identity new me     # one-time: your signing key
thebes-deploy deploy
```

The tool compiles, signs the install, chunks the wasm across the validators,
and verifies — finalized by a Byzantine quorum, sealed into the chain.

## 5. Call it

```sh
thebes-deploy query counter get          # → (0 : nat)
thebes-deploy call  counter increment    # → (1 : nat)
```

That's a running smart contract. From here:

- **Add a frontend** — a `type = "frontend"` canister serves your static bundle
  on-chain; the browser talks to your backend through `window.EgyptBoundary`.
  See [`examples/e-commerce`](../examples/e-commerce) for a full-stack app.
- **Go deeper** — [deploying.md](deploying.md) covers frontends, the command
  reference, and connecting to the API from the CLI, a frontend, or raw HTTP.
- **Browse the examples** — [`examples/`](../examples) has counter, guestbook,
  todo, kv-store, and the e-commerce storefront, each in Motoko and Rust.
