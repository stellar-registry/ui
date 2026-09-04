# Stellar Registry UI

A public registry for browsing deployed Stellar smart contracts, built with
React Router v7 and deployed to Cloudflare Workers.

## Development

Copy the example env file and start the dev server:

```bash
cp .dev.vars.example .dev.vars
npm install
npm run dev
```

The dev server runs at `http://localhost:5173` using the Cloudflare Workers
runtime locally (via miniflare), so behaviour matches production.

## Commands

| Command                            | Description                                                              |
| ---------------------------------- | ------------------------------------------------------------------------ |
| `npm run dev`                      | Start local dev server                                                   |
| `npm run build`                    | Production build                                                         |
| `npm run typecheck`                | Type-check (generates CF + RR types first)                               |
| `npm run lint`                     | Run ESLint                                                               |
| `npm run format`                   | Run Prettier                                                             |
| `npm run cf-typegen`               | Regenerate Cloudflare types from `wrangler.jsonc`                        |
| `npm run generate:registry-client` | Regenerate `clients/registry-client` from the deployed Registry contract |

## Stack

- **React Router v7** (SSR framework mode)
- **TanStack Query** — client-side caching; loaders provide `initialData`
- **Cloudflare Workers** — edge-deployed, no cold starts
- **CSS Modules** — no Tailwind; design tokens in `app/app.css`
- **shadcn/css** — copy-paste components (badge, button, card, input)

## Deployment

Merges to `main` automatically deploy via GitHub Actions to `rgstry-testnet` and
`rgstry-stellar`. Each build selects its named environment with
`CLOUDFLARE_ENV`; the generated Worker config contains that network's variables
and custom domain.

Hosted PR previews use a separate `registry-ui` Worker and Testnet-only config.
Run `npm run build:preview` to build and validate that target. The production
configuration and deployment workflow are unchanged. See
[Hosted previews](docs/hosted-previews.md) for the one-time Cloudflare GitHub
connection, build settings, and where reviewers will find the preview URLs.

## Project structure

```
app/
  routes/
    _index.tsx                   # / — hero + search + about
    contracts._index.tsx         # /contracts — contract list with search
    contracts.$contract_name.tsx # /contracts/:contract_name — contract detail
    wasms._index.tsx             # /wasms — Wasm list with search
    wasms.$wasm_name.tsx         # /wasms/:wasm_name — Wasm detail
    api.$.tsx                    # /api/* — server-side proxy to backend API
  components/                    # Shared UI components
  lib/
    api.ts                       # API client (uses /api proxy client-side)
    queries.ts                   # TanStack Query queryOptions
    types.ts                     # TypeScript types
  entry.server.tsx               # SSR entry point
  root.tsx                       # Root layout
  app.css                        # Global styles and design tokens
workers/
  app.ts                         # Cloudflare Worker entry
clients/
  registry-client/               # Generated Registry contract bindings (see below)
wrangler.jsonc                   # Cloudflare config (vars + env per network)
```

## Backend

Data is fetched from the Stellar Registry Indexer API. The base URL is set per
environment via the `REGISTRY_API_URL` variable in `wrangler.jsonc`. All
client-side requests are proxied through `/api/*` to avoid CORS issues.

## Registry contract client

`app/lib/deploy.ts` (the "Deploy a contract using this Wasm" flow) talks to the
Registry contract itself through generated TypeScript bindings at
`clients/registry-client`, an npm workspace package (`registry-client`) — not
hand-written. It's checked in, so you don't need to regenerate it just to work
on the app.

Regenerate it after a Registry contract release with:

```bash
npm run generate:registry-client
```

This runs two steps under the hood:

1. `stellar registry download registry -o /tmp/registry.wasm --network testnet -s me`
   — fetches the current `registry` Wasm (the Registry contract publishes itself
   into the registry, channel `root`) via the
   [`stellar-registry` CLI](https://github.com/stellar-registry/cli)
2. `stellar contract bindings typescript --wasm /tmp/registry.wasm --output-dir clients/registry-client --overwrite`
   — regenerates the client package from that binary via
   [`stellar-cli`](https://github.com/stellar/stellar-cli)

Requires both CLIs installed (`cargo install --locked stellar-registry-cli`,
`cargo install --locked stellar-cli` or equivalent) and a configured identity
for `-s`/`--source-account` (e.g.
`stellar keys generate me --network testnet --fund`) — `download` simulates a
read call, which still needs a source account. The contract's interface is the
same on testnet and mainnet (deployed deterministically, see
`app/lib/network.ts`), so generating from testnet is fine either way.

---

<div align="center">
  <p>Brought to you by your friends at</p>
  <a
    alt="The Aha Co"
    href="https://theaha.co"
  >
    <img
      width="300px"
      src="https://github.com/theahaco/ts-config/raw/main/logo.svg"
    />
  </a>
</div>
