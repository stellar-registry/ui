import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/_index.tsx"),
  route("contracts/:wasm_hash", "routes/contracts.$wasm_hash.tsx"),
] satisfies RouteConfig;
