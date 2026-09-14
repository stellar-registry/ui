import { createRequestHandler } from "react-router"

interface Env {
	REGISTRY_API_URL: string
	REGISTRY_NETWORK: string
	REGISTRY_RPC_URL: string
	// Public (not secret) endpoint for the governance IPFS pinning worker —
	// see app/lib/ipfs.ts. Testnet-only; not yet deployed, so unset in every
	// environment until that infra decision lands (milestone 6 plan, Phase 0).
	GOVERNANCE_IPFS_WORKER_URL?: string
}

declare module "react-router" {
	export interface AppLoadContext {
		cloudflare: {
			env: {
				REGISTRY_API_URL: string
				REGISTRY_NETWORK: string
				REGISTRY_RPC_URL: string
				GOVERNANCE_IPFS_WORKER_URL?: string
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
