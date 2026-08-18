import { cloudflare } from "@cloudflare/vite-plugin"
import { reactRouter } from "@react-router/dev/vite"
import { defineConfig } from "vite"
import { nodePolyfills } from "vite-plugin-node-polyfills"
import tsconfigPaths from "vite-tsconfig-paths"

export default defineConfig({
	plugins: [
		cloudflare({ viteEnvironment: { name: "ssr" } }),
		reactRouter(),
		tsconfigPaths(),
		// @stellar/stellar-sdk expects a Node-style `Buffer` global. Deploy/wallet
		// code only ever runs client-side (never in loaders/SSR, where Cloudflare's
		// nodejs_compat already provides a real one), but this plugin has no way
		// to scope itself to one Vite environment — it's harmless for the SSR
		// bundle since nothing server-side imports `buffer` or references `Buffer`.
		nodePolyfills({
			include: ["buffer"],
			globals: { Buffer: true },
		}),
	],
	optimizeDeps: {
		exclude: ["cloudflare:workers"],
	},
})
