import { createRequestHandler } from "react-router"

interface Env {
	REGISTRY_API_URL: string
	REGISTRY_NETWORK: string
  TANSU_ID: string
  REGISTRY_ID: string
  MANAGER_ID: string
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
