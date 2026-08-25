# registry-client

Generated TypeScript bindings for the Stellar Registry contract itself (see
[`stellar-registry/contracts`](https://github.com/stellar-registry/contracts),
package `registry`).

Not hand-written — regenerate after a Registry contract release with:

```bash
npm run generate:registry-client:testnet   # or :mainnet
```

(see the root `package.json` scripts — downloads the current `registry` Wasm via
the `stellar registry` CLI and re-runs `stellar contract bindings typescript`
against it). There's no bare `generate:registry-client` / default network: CI
builds once and deploys the same bundle to both testnet and mainnet Cloudflare
Workers environments, so which network's contract the checked-in bindings come
from has to be a deliberate choice, not an implicit one.

Consumed as an npm workspace package (`clients/*` in the root `package.json`) —
imported directly from source ([`src/index.ts`](./src/index.ts)) by
`app/lib/registry-client.ts` (client construction/caching), which is in turn
used by the deploy dialog in `app/routes/wasmOverview.tsx`. No separate build
step. Not published to npm.
