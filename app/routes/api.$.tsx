import { type Route } from "./+types/api.$"

const BACKEND = "https://registry-indexer.fly.dev"

export async function loader({ params, request }: Route.LoaderArgs) {
	const path = params["*"] ?? ""
	const { search } = new URL(request.url)
	const res = await fetch(`${BACKEND}/${path}${search}`)
	return new Response(res.body, {
		status: res.status,
		headers: {
			"Content-Type": res.headers.get("Content-Type") ?? "application/json",
		},
	})
}
