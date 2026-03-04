# Registry UI — Claude Instructions

## Project overview

Public registry frontend for deployed Stellar smart contracts, similar to
crates.io/npmjs.com. Hits a single AWS Lambda endpoint. Built with React Router
v7 (framework/SSR mode) deployed to Cloudflare Workers.

## Tech stack

- **React Router v7** (framework mode, SSR) — file-based routing via
  `app/routes.ts`
- **Cloudflare Workers** — production runtime via `@cloudflare/vite-plugin`
- **CSS Modules** — all styling (no Tailwind)
- **shadcn/css** — component library (copy-paste, CSS Modules based)
- **@theahaco/ts-config** — shared TS, ESLint, Prettier config

## Project structure

```
app/
  routes/
    _index.tsx                # / — contract list with search
    contracts.$wasm_hash.tsx  # /contracts/:wasm_hash — contract detail
  components/                 # Shared UI only (badge, button, card, input)
  lib/
    api.ts                    # Lambda fetch client
    types.ts                  # Contract types
  entry.server.tsx            # Web-standard SSR entry (renderToReadableStream)
  root.tsx                    # Root layout — Header with dark/light toggle
  app.css                     # Design tokens (CSS custom properties)
workers/
  app.ts                      # Cloudflare Worker fetch handler
```

Route-specific components (e.g. `ContractRow` on the home page) are defined
inline in their route file, not extracted to `components/`.

## Styling rules

- **Do not use Tailwind.** Use CSS Modules for all styling.
- Each route has a co-located `*.module.css` file.
- Components in `app/components/` follow the shadcn/css pattern: one `*.tsx` +
  one `*.module.css`, using `data-variant` / `data-size` attributes instead of
  CVA.
- All design tokens (colors, spacing, radii, shadows, typography) are CSS custom
  properties in `app/app.css`.
- Dark mode: `.dark` class on `<html>`. `:root` = light, `.dark` = dark.

## API

Single endpoint in AWS Lambda, the client logic is in `app/lib/api.ts`.

Endpoint response types are defined in `app/lib/types.ts`.

## Deployment

Deploys to Cloudflare Workers on push to `main` via GitHub Actions
(`.github/workflows/deploy.yml`).

- `npm run dev` — local dev server (Workers runtime via miniflare)
- `npm run build` — production build
- `npm run deploy` — build + deploy to Cloudflare
- `npm run cf-typegen` — regenerate `worker-configuration.d.ts` after changing
  `wrangler.jsonc`

## Key config files

- `wrangler.jsonc` — Cloudflare Worker config (name, entry, compatibility)
- `vite.config.ts` — `cloudflare({ viteEnvironment: { name: "ssr" } })` must
  come before `reactRouter()`
- `react-router.config.ts` — `future.v8_viteEnvironmentApi: true` required for
  Cloudflare Vite plugin
