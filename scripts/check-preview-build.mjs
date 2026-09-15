import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"

// Inspect the generated config that Wrangler will actually upload, not just
// the source config. A wrong Vite environment must fail before publication.
const config = JSON.parse(
	await readFile(
		new URL("../build/server/wrangler.json", import.meta.url),
		"utf8",
	),
)

assert.equal(
	config.name,
	"registry-ui",
	"Preview must target its dedicated Worker",
)
assert.equal(
	config.workers_dev,
	true,
	"Preview must enable its workers.dev URL",
)
assert.equal(config.preview_urls, true, "Preview URLs must be enabled")
assert.equal(
	config.targetEnvironment ?? "",
	"",
	"Preview must not use a named environment",
)
assert.equal(
	config.route,
	undefined,
	"Preview must not attach a production route",
)
assert.deepEqual(
	config.routes ?? [],
	[],
	"Preview must not attach production domains",
)
assert.deepEqual(config.vars, {
	REGISTRY_API_URL: "https://stellar-registry-testnet.fly.dev",
	REGISTRY_NETWORK: "testnet",
	REGISTRY_RPC_URL: "https://soroban-testnet.stellar.org",
})
assert.equal(
	config.assets?.directory,
	"../client",
	"Preview must include built assets",
)

console.log("Preview build verified: registry-ui, Testnet, no custom domains.")
