# Contributing

This repository holds the public-facing surface of Thebes: worked **examples**,
the **`thebes-deploy`** developer tool, and the **docs**. (The substrate binary
is not here — the protocol the tool speaks is a wire format, and this is one of
its clients.)

## What lives here

| Path | What it is |
|---|---|
| [`examples/`](examples) | smart contracts — Motoko + Rust — each compiled in CI |
| [`docs/`](docs) | quickstart, deploy walkthrough, spec |
| `.github/workflows/ci.yml` | compiles every example so nothing rots |

## Adding an example

1. Create `examples/<name>/motoko/main.mo` and, where it makes sense,
   `examples/<name>/rust/` (Cargo project targeting `wasm32-unknown-unknown`).
2. Add an `examples/<name>/README.md` with: an **interface** table, a
   `thebes.toml` to **deploy** it, and **how to connect the API** (CLI, the
   `EgyptBoundary` JS SDK, and raw HTTP). Match the existing examples.
3. List it in [`examples/README.md`](examples/README.md).

### An authoring rule worth knowing

A private Motoko helper that `await`s another contract must be **`async*`**, not
`async`. `async*` inlines into the caller so its post-`await` state mutations
commit correctly; with a plain `async` helper, a write after the `await` can be
dropped. If you see "succeeded but state didn't change," this is the first
suspect.

## Build + check locally

**Motoko** (uses [mops](https://mops.one) for `mo:core`):

```sh
mops install
moc $(mops sources) --check examples/<name>/motoko/main.mo
```

**Rust:**

```sh
cd examples/<name>/rust
cargo build --target wasm32-unknown-unknown --release
```

CI runs exactly these for every example on each push and PR.

## Pull requests

- Branch from `main`, open a PR; **CI must be green** (both the `motoko` and
  `rust` jobs) before merge.
- Keep examples minimal and self-explanatory — they are teaching material.
- No chain-specific secrets, node IPs, or operational data in this public repo.

## Attribution

Examples build on the Internet Computer CDK (`ic-cdk` for Rust, the Motoko base
for Motoko), authored by the DFINITY Foundation — see [`NOTICE`](NOTICE). Keep
that attribution intact when adding code that uses it.

## Authorship

Commits and code headers are attributed to the **Thebes Protocol contributors**.
Please don't add personal-name or AI co-author lines.
