import { createRequestHandler } from "react-router"

// Optional: .dev.vars can override these for local testing
interface Env {
	REGISTRY_API_URL?: string
	REGISTRY_NETWORK?: string
}

declare module "react-router" {
	export interface AppLoadContext {
		cloudflare: {
			env: {
				REGISTRY_API_URL: string
				REGISTRY_NETWORK: string
			}
			ctx: ExecutionContext
		}
	}
}

const HOSTNAME_CONFIG: Record<
	string,
	{ REGISTRY_API_URL: string; REGISTRY_NETWORK: string }
> = {
	"testnet.rgstry.xyz": {
		REGISTRY_API_URL: "https://registry-indexer.fly.dev",
		REGISTRY_NETWORK: "testnet",
	},
	"mainnet.rgstry.xyz": {
		REGISTRY_API_URL: "https://registry-indexer-mainnet.fly.dev",
		REGISTRY_NETWORK: "mainnet",
	},
	"rgstry.xyz": {
		REGISTRY_API_URL: "https://registry-indexer-mainnet.fly.dev",
		REGISTRY_NETWORK: "mainnet",
	},
}

const DEFAULT_CONFIG = {
	REGISTRY_API_URL: "https://registry-indexer.fly.dev",
	REGISTRY_NETWORK: "testnet",
}

const requestHandler = createRequestHandler(
	() => import("virtual:react-router/server-build"),
	import.meta.env.MODE,
)

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext) {
		const hostname = new URL(request.url).hostname
		const hostnameConfig = HOSTNAME_CONFIG[hostname] ?? DEFAULT_CONFIG
		const resolvedEnv = {
			REGISTRY_API_URL: env.REGISTRY_API_URL ?? hostnameConfig.REGISTRY_API_URL,
			REGISTRY_NETWORK: env.REGISTRY_NETWORK ?? hostnameConfig.REGISTRY_NETWORK,
		}
		return requestHandler(request, {
			cloudflare: { env: resolvedEnv, ctx },
		})
	},
} satisfies ExportedHandler<Env>
