# Registry UI — Claude Instructions

## Project overview

Public registry frontend for deployed Stellar smart contracts, similar to
crates.io/npmjs.com. Backend is the Stellar Registry Indexer deployed on Fly.io.
Built with React Router v7 (framework/SSR mode) deployed to Cloudflare Workers.

## Tech stack

- **React Router v7** (framework mode, SSR) — explicit routing via
  `app/routes.ts`
- **TanStack Query** — client-side caching; loaders fetch server-side and pass
  `initialData` to `useQuery` for instant first render
- **Cloudflare Workers** — production runtime via `@cloudflare/vite-plugin`
- **CSS Modules** — all styling (no Tailwind)
- **shadcn/css** — component library (copy-paste, CSS Modules based)
- **@theahaco/ts-config** — shared TS, ESLint, Prettier config

## Project structure

```
app/
  routes/
    _index.tsx                   # / — hero, search, feature cards, about
    contracts._index.tsx         # /contracts — list with ?q search param
    contracts.$contract_name.tsx # /contracts/:contract_name — detail
    wasms._index.tsx             # /wasms — list with search
    wasms.$wasm_name.tsx         # /wasms/:wasm_name — detail
    api.$.tsx                    # /api/* — proxy to backend (avoids CORS)
  components/                    # Shared UI only (badge, button, card, input)
  lib/
    api.ts                       # Fetch client; uses /api base URL client-side,
                                 # direct backend URL server-side (import.meta.env.SSR)
    queries.ts                   # TanStack Query queryOptions for all endpoints
    types.ts                     # Contract, ContractDetail, Wasm, WasmDetail types
  entry.server.tsx               # Web-standard SSR entry (renderToReadableStream)
  root.tsx                       # Root layout — Header, ScaffoldBanner, Footer
  app.css                        # Design tokens (CSS custom properties)
workers/
  app.ts                         # Cloudflare Worker fetch handler; defines Env interface
                                 # and passes env into React Router load context
```

Route-specific components (e.g. `WasmRow`) are defined inline in their route
file, not extracted to `components/`.

## Styling rules

- **Do not use Tailwind.** Use CSS Modules for all styling.
- Each route has a co-located `*.module.css` file.
- Components in `app/components/` follow the shadcn/css pattern: one `*.tsx` +
  one `*.module.css`, using `data-variant` / `data-size` attributes instead of
  CVA.
- All design tokens (colors, spacing, radii, shadows, typography) are CSS custom
  properties in `app/app.css`.
- Dark mode: `.dark` class on `<html>`. `:root` = light, `.dark` = dark.

## API and data fetching

- Backend: Stellar Registry Indexer on Fly.io
- `app/lib/api.ts` — shared `apiFetch` helper; `API_BASE` is `/api` in the
  browser and the direct backend URL on the server (`import.meta.env.SSR`)
- `app/routes/api.$.tsx` — splat resource route that proxies `/api/*` to the
  backend, keeping all browser requests same-origin
- `app/lib/queries.ts` — `queryOptions` for all five endpoints (contracts list,
  contract detail, wasms list, wasm detail, health)
- Loaders call the API directly (server-side, no CORS concern) and return data
  as `initialData` for TanStack Query

## Environment variables

Configured in `wrangler.jsonc` under `vars` (default) and `env.testnet` /
`env.mainnet`. For local dev, copy `.dev.vars.example` → `.dev.vars`.

| Variable           | Purpose                              |
| ------------------ | ------------------------------------ |
| `REGISTRY_API_URL` | Backend base URL for the proxy route |
| `REGISTRY_NETWORK` | Network label displayed in the UI    |

The `Env` interface is defined in `workers/app.ts` and exposed to loaders via
load context (`context.cloudflare.env`).

## Deployment

GitHub Actions (`.github/workflows/deploy.yml`) builds once on push to `main`,
then deploys to both `testnet` and `mainnet` Cloudflare Workers environments via
`npx wrangler deploy --env <name>`.

## npm version

`actions/setup-node`'s node 22 bundles npm 10.x, but a locally-installed npm
11.x writes a `package-lock.json` that npm 10's `npm ci` rejects as out-of-sync.
Rather than pin everyone's local npm backward, CI bumps to npm 11 itself (see
`ci.yml`/`deploy.yml`); `engines.npm` (`^11.0.0`) and `.npmrc`'s
`engine-strict=true` keep local installs on the same major version so this can't
silently drift again in either direction.

## Key config files

- `wrangler.jsonc` — Cloudflare Worker config; defines vars and named
  environments
- `vite.config.ts` — `cloudflare({ viteEnvironment: { name: "ssr" } })` must
  come before `reactRouter()`
- `react-router.config.ts` — `future.v8_viteEnvironmentApi: true` required for
  Cloudflare Vite plugin
