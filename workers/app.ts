import { createRequestHandler } from "react-router"

interface Env {
	REGISTRY_API_URL: string
	REGISTRY_NETWORK: string
}

declare module "react-router" {
	export interface AppLoadContext {
		cloudflare: {
			env: Env
			ctx: ExecutionContext
		}
	}
}

const requestHandler = createRequestHandler(
	() => import("virtual:react-router/server-build"),
	import.meta.env.MODE,
)

export default {
	async fetch(request, env, ctx) {
		return requestHandler(request, {
			cloudflare: { env, ctx },
		})
	},
} satisfies ExportedHandler<Env>
