import { cloudflare } from "@cloudflare/vite-plugin"
import { reactRouter } from "@react-router/dev/vite"
import { defineConfig } from "vite"
import tsconfigPaths from "vite-tsconfig-paths"

export default defineConfig({
	plugins: [
		cloudflare({ viteEnvironment: { name: "ssr" } }),
		reactRouter(),
		tsconfigPaths(),
	],
	optimizeDeps: {
		// Scan all app code up front so deps aren't discovered mid-session, which
		// triggers a re-optimize and "Outdated Optimize Dep" 504s in the browser
		entries: ["./app/**/*.{ts,tsx}"],
		exclude: ["cloudflare:workers", "@stellar/stellar-xdr-json"],
	},
})
