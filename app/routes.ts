import { type RouteConfig, index, route } from "@react-router/dev/routes"

export default [
	index("routes/_index.tsx"),
	route("contracts", "routes/contracts._index.tsx"),
	route("contracts/:contract_name", "routes/contracts.$contract_name.tsx"),
	route("wasms", "routes/wasms._index.tsx"),
	route("wasms/:wasm_name", "routes/wasms.$wasm_name.tsx", { id: "wasm" }, [
		index("routes/wasms.$wasm_name._index.tsx"),
		route("versions", "routes/wasms.$wasm_name.versions.tsx"),
		route("v/:version", "routes/wasms.$wasm_name.v.$version.tsx"),
	]),
	route("api/*", "routes/api.$.tsx"),
] satisfies RouteConfig
