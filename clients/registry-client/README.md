# registry-client

Generated TypeScript bindings for the Stellar Registry contract itself (see
[`stellar-registry/contracts`](https://github.com/stellar-registry/contracts),
package `registry`).

Not hand-written — regenerate after a Registry contract release with:

```bash
npm run generate:registry-client
```

(see the root `package.json` script — downloads the current `registry` Wasm via
the `stellar registry` CLI and re-runs `stellar contract bindings typescript`
against it).

Consumed as an npm workspace package (`clients/*` in the root `package.json`) —
imported directly from source ([`src/index.ts`](./src/index.ts)) by
`app/lib/deploy.ts`, no separate build step. Not published to npm.
