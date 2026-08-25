#!/usr/bin/env node
// Regenerates clients/registry-client from the live Registry contract,
// reading network/contract config from environments.toml (see that file's
// header comment for why this doesn't go through `stellar scaffold` itself).
//
// Usage: node scripts/generate-registry-client.mjs <testnet|mainnet>

import { execFileSync } from "node:child_process"
import { readFileSync, writeFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { parse } from "smol-toml"

const root = fileURLToPath(new URL("..", import.meta.url))
const network = process.argv[2]

if (network !== "testnet" && network !== "mainnet") {
	console.error(
		`Usage: node scripts/generate-registry-client.mjs <testnet|mainnet>\nGot: ${network ?? "(nothing)"}`,
	)
	process.exit(1)
}

const environments = parse(readFileSync(`${root}/environments.toml`, "utf8"))
const env = environments[network]
const rpcUrl = env.network["rpc-url"]
const networkPassphrase = env.network["network-passphrase"]
const contractId = env.contracts.registry.id

console.log(
	`Generating clients/registry-client from ${network} (${contractId})...`,
)

// `--overwrite` replaces the entire output directory, including our
// hand-maintained README.md — snapshot it and restore it below.
const readmePath = `${root}/clients/registry-client/README.md`
const readme = readFileSync(readmePath, "utf8")

execFileSync(
	"stellar",
	[
		"contract",
		"bindings",
		"typescript",
		"--contract-id",
		contractId,
		"--rpc-url",
		rpcUrl,
		"--network-passphrase",
		networkPassphrase,
		"--output-dir",
		`${root}/clients/registry-client`,
		"--overwrite",
	],
	{ stdio: "inherit" },
)

writeFileSync(readmePath, readme)

// The generated package.json points `exports`/`typings` at `dist/`, not
// `src/index.ts` directly (as of stellar-cli 27.1.0's codegen template) — so
// the package needs its own build step before anything importing
// "registry-client" can resolve it.
execFileSync("npm", ["install"], { cwd: root, stdio: "inherit" })
execFileSync("npm", ["run", "build", "--workspace=registry-client"], {
	cwd: root,
	stdio: "inherit",
})
