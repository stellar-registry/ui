import {
	type RouteConfig,
	index,
	prefix,
	route,
} from "@react-router/dev/routes"

const wasmChildren = (prefix: string) =>
	[
		index("routes/wasmDetails.tsx", { id: `${prefix}Details` }),
		route("versions", "routes/wasmVersions.tsx", { id: `${prefix}Versions` }),
		route("v/:version", "routes/wasmDetails.tsx", {
			id: `${prefix}VersionDetail`,
		}),
	] satisfies RouteConfig

export default [
	index("routes/home.tsx"),
	...prefix("contracts", [
		index("routes/contracts.tsx"),
		route("unverified/:name", "routes/contractDetails.tsx", {
			id: "unverifiedContract",
		}),
		route(":name", "routes/contractDetails.tsx"),
	]),
	...prefix("wasms", [
		index("routes/wasms.tsx"),
		route(
			"unverified/:name",
			"routes/wasmOverview.tsx",
			{ id: "unverifiedWasm" },
			wasmChildren("unverifiedWasm"),
		),
		route(
			":name",
			"routes/wasmOverview.tsx",
			{ id: "wasm" },
			wasmChildren("wasm"),
		),
	]),
	route("api/*", "routes/api.tsx"),
] satisfies RouteConfig
