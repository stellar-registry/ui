import { createRequestHandler } from "react-router"

interface Env {
	REGISTRY_API_URL: string
	REGISTRY_NETWORK: string
	REGISTRY_RPC_URL: string
	// Secret (via `wrangler secret put`), not a var — read only server-side by
	// routes/apiGovernancePin.tsx. Testnet-only; unset in mainnet since there's
	// no Tansu gating there. See CLAUDE.md's Governance section.
	GOVERNANCE_FILEBASE_TOKEN?: string
}

declare module "react-router" {
	export interface AppLoadContext {
		cloudflare: {
			env: {
				REGISTRY_API_URL: string
				REGISTRY_NETWORK: string
				REGISTRY_RPC_URL: string
				GOVERNANCE_FILEBASE_TOKEN?: string
			}
			ctx: ExecutionContext
		}
	}
}

const requestHandler = createRequestHandler(
	() => import("virtual:react-router/server-build"),
	import.meta.env.MODE,
)

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext) {
		return requestHandler(request, {
			cloudflare: { env, ctx },
		})
	},
} satisfies ExportedHandler<Env>
