# registry-client

Generated TypeScript bindings for the Stellar Registry contract itself (see
[`stellar-registry/contracts`](https://github.com/stellar-registry/contracts),
package `registry`).

Not hand-written, and not checked in — `src/`/`dist/` are gitignored. Generate
them with:

```bash
npm run generate:registry-client:testnet   # or :mainnet
```

(see the root `package.json` scripts — reads the contract's address and network
config from the root [`environments.toml`](../../environments.toml) and calls
`stellar contract bindings typescript --contract-id` directly, no local identity
needed). There's no bare `generate:registry-client` / default network: CI builds
once and deploys the same bundle to both testnet and mainnet Cloudflare Workers
environments, so which network's contract the generated bindings come from has
to be a deliberate choice, not an implicit one.

Consumed as an npm workspace package (`clients/*` in the root `package.json`) by
`app/lib/registry-client.ts` (client construction/caching), which is in turn
used by the deploy dialog in `app/routes/wasmOverview.tsx`. Requires its own
build step (`npm run build`, run automatically by the generate scripts above) —
the generated `package.json` points `exports`/`typings` at `dist/`, not `src/`
directly. Not published to npm.

This file is rewritten by `scripts/generate-registry-client.mjs` after every
regeneration, since `stellar contract bindings typescript --overwrite` otherwise
replaces it with its own generic template.
