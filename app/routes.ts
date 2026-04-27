import {
	type RouteConfig,
	index,
	prefix,
	route,
} from "@react-router/dev/routes"

export default [
	index("routes/home.tsx"),
	...prefix("contracts", [
		index("routes/contracts.tsx"),
		route(":channel?/:name", "routes/contractDetails.tsx", {
			id: "contract",
		}),
	]),
	...prefix("wasms", [
		index("routes/wasms.tsx"),
		route(":channel?/:name", "routes/wasmOverview.tsx", { id: "wasm" }, [
			index("routes/wasmDetails.tsx", { id: `wasmDetails` }),
			route("versions", "routes/wasmVersions.tsx", { id: `wasmVersions` }),
			route("v/:version", "routes/wasmDetails.tsx", {
				id: `wasmVersionDetail`,
			}),
		]),
	]),
	route("api/*", "routes/api.tsx"),
	route("*", "routes/404.tsx"),
] satisfies RouteConfig
