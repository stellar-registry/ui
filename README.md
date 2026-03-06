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

| Command              | Description                                       |
| -------------------- | ------------------------------------------------- |
| `npm run dev`        | Start local dev server                            |
| `npm run build`      | Production build                                  |
| `npm run typecheck`  | Type-check (generates CF + RR types first)        |
| `npm run lint`       | Run ESLint                                        |
| `npm run format`     | Run Prettier                                      |
| `npm run cf-typegen` | Regenerate Cloudflare types from `wrangler.jsonc` |

## Stack

- **React Router v7** (SSR framework mode)
- **TanStack Query** — client-side caching; loaders provide `initialData`
- **Cloudflare Workers** — edge-deployed, no cold starts
- **CSS Modules** — no Tailwind; design tokens in `app/app.css`
- **shadcn/css** — copy-paste components (badge, button, card, input)

## Deployment

Merges to `main` automatically deploy via GitHub Actions to both the `testnet`
and `mainnet` Cloudflare Workers environments. Environments are defined in
`wrangler.jsonc`; add domain routes there once custom domains are configured.

To deploy manually:

```bash
npm run build
npx wrangler deploy --env testnet
npx wrangler deploy --env mainnet
```

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
wrangler.jsonc                   # Cloudflare config (vars + env per network)
```

## Backend

Data is fetched from the Stellar Registry Indexer API. The base URL is set per
environment via the `REGISTRY_API_URL` variable in `wrangler.jsonc`. All
client-side requests are proxied through `/api/*` to avoid CORS issues.

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
