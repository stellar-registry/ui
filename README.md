# Stellar Registry UI

A public registry for browsing deployed Stellar smart contracts, built with
React Router v7 and deployed to Cloudflare Workers.

## Development

Copy the example env file and start the dev server:

```bash
cp .dev.vars.example .dev.vars
npm install
npm run generate:registry-client:testnet
npm run dev
```

The dev server runs at `http://localhost:5173` using the Cloudflare Workers
runtime locally (via miniflare), so behaviour matches production.

## Commands

| Command                                    | Description                                                             |
| ------------------------------------------ | ----------------------------------------------------------------------- |
| `npm run dev`                              | Start local dev server                                                  |
| `npm run build`                            | Production build                                                        |
| `npm run typecheck`                        | Type-check (generates CF + RR types first)                              |
| `npm run lint`                             | Run ESLint                                                              |
| `npm run format`                           | Run Prettier                                                            |
| `npm run cf-typegen`                       | Regenerate Cloudflare types from `wrangler.jsonc`                       |
| `npm run generate:registry-client:testnet` | Regenerate `clients/registry-client` from the testnet Registry contract |
| `npm run generate:registry-client:mainnet` | Regenerate `clients/registry-client` from the mainnet Registry contract |

## Stack

- **React Router v7** (SSR framework mode)
- **TanStack Query** — client-side caching; loaders provide `initialData`
- **Cloudflare Workers** — edge-deployed, no cold starts
- **CSS Modules** — no Tailwind; design tokens in `app/app.css`
- **shadcn/css** — copy-paste components (badge, button, card, input)

## Deployment

Merges to `main` automatically deploy via GitHub Actions. A single worker serves
all environments — the network config (API URL, network label) is derived from
the request hostname at runtime. Custom domains are configured once in the
Cloudflare dashboard.

## Project structure

```
app/
  routes/
    _index.tsx                   # / — hero + search + about
    contracts._index.tsx         # /contracts — contract list with search
    contracts.$contract_name.tsx # /contracts/:contract_name — contract detail
    wasms._index.tsx             # /wasms — WASM list with search
    wasms.$wasm_name.tsx         # /wasms/:wasm_name — WASM detail
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
scripts/
  generate-registry-client.mjs   # Reads environments.toml, regenerates clients/registry-client
environments.toml               # Per-network Stellar config (see below)
wrangler.jsonc                   # Cloudflare config (vars + env per network)
```

## Backend

Data is fetched from the Stellar Registry Indexer API. The base URL is set per
environment via the `REGISTRY_API_URL` variable in `wrangler.jsonc`. All
client-side requests are proxied through `/api/*` to avoid CORS issues.

## Registry contract client

`app/lib/registry-client.ts` (used by the "Deploy a contract using this Wasm"
flow in `app/routes/wasmOverview.tsx`) talks to the Registry contract itself
through generated TypeScript bindings at `clients/registry-client`, an npm
workspace package (`registry-client`) — not hand-written. **It's gitignored, not
checked in** — you need to generate it once after cloning, before
`npm run dev`/`typecheck`/`build` will work:

```bash
npm run generate:registry-client:testnet
```

This reads the Registry contract's address and network config for `testnet` from
[`environments.toml`](./environments.toml) — the single source of truth for
this, also used at build time by `app/lib/network.ts` — and calls:

```
stellar contract bindings typescript --contract-id <id> --rpc-url <rpc-url> \
  --network-passphrase <passphrase> --output-dir clients/registry-client --overwrite
```

via [`stellar-cli`](https://github.com/stellar/stellar-cli). This is a pure RPC
read (fetches the contract's stored spec directly by address) — no local
identity/signer needed, and only `stellar-cli` needs to be installed. The
contract's interface is the same on testnet and mainnet (deployed
deterministically, see `environments.toml`), so generating from testnet covers
both; use `generate:registry-client:mainnet` if you need to confirm that
explicitly.

We don't run [`stellar-scaffold`](https://github.com/stellar-scaffold/cli)'s own
build tooling here — see the comment at the top of `environments.toml` for why —
but we do follow its `environments.toml` convention and use the same underlying
primitive it relies on internally for pre-deployed contracts.

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
