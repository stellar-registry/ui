# Stellar Registry UI

A public registry for browsing deployed Stellar smart contracts, built with
React Router v7 and deployed to Cloudflare Workers.

## Development

```bash
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
| `npm run deploy`     | Build and deploy to Cloudflare Workers            |
| `npm run typecheck`  | Type-check (generates CF + RR types first)        |
| `npm run lint`       | Run ESLint                                        |
| `npm run format`     | Run Prettier                                      |
| `npm run cf-typegen` | Regenerate Cloudflare types from `wrangler.jsonc` |

## Stack

- **React Router v7** (SSR framework mode)
- **Cloudflare Workers** — edge-deployed, no cold starts
- **CSS Modules** — no Tailwind; design tokens in `app/app.css`
- **shadcn/css** — copy-paste components (badge, button, card, input)

## Deployment

Merges to `main` automatically deploy via GitHub Actions to a Cloudflare Workers
subdomain by default. A custom domain can be added under **Workers & Pages →
registry-ui → Settings → Domains & Routes**.

## Project structure

```
app/
  routes/
    _index.tsx                # / — browse contracts
    contracts.$wasm_hash.tsx  # /contracts/:wasm_hash — contract detail
  components/                 # Shared UI components
  lib/
    api.ts                    # API client
    types.ts                  # TypeScript types
  entry.server.tsx            # SSR entry point
  root.tsx                    # Root layout
  app.css                     # Global styles and design tokens
workers/
  app.ts                      # Cloudflare Worker entry
wrangler.jsonc                # Cloudflare config
```

## Backend

Data is fetched from a single AWS Lambda endpoint. See `app/lib/api.ts` for the
base URL and `app/lib/types.ts` for the `Contract` type.

---

<div align="center">
  <p>Brought to you by your friends at</p>
  <a
    alt="The Aha Co"
    href="https://theaha.co"
  >
    <img
      width="300px"
      src="logo.svg"
    />
  </a>
</div>
