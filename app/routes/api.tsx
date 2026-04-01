import { type Route } from "./+types/api"

export async function loader({ params, request, context }: Route.LoaderArgs) {
	const backend = context.cloudflare.env.REGISTRY_API_URL
	const path = params["*"] ?? ""
	const { search } = new URL(request.url)
	const res = await fetch(`${backend}/${path}${search}`)
	return new Response(res.body, {
		status: res.status,
		headers: {
			"Content-Type": res.headers.get("Content-Type") ?? "application/json",
		},
	})
}
