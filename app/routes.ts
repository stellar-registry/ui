import { type RouteConfig, index, route } from "@react-router/dev/routes"

export default [
	index("routes/_index.tsx"),
	route("contracts", "routes/contracts._index.tsx"),
	route("contracts/:contract_name", "routes/contracts.$contract_name.tsx"),
	route("wasms", "routes/wasms._index.tsx"),
	route("wasms/:wasm_name", "routes/wasms.$wasm_name.tsx"),
	route("health", "routes/health.tsx"),
] satisfies RouteConfig
