// Stellar network constants for the `network` label already threaded through
// the app via `useRootData()` (see app/root.tsx). These are protocol/registry
// constants, not operational config — unlike REGISTRY_API_URL/REGISTRY_RPC_URL
// there's nothing to configure per-deploy, so they're sourced from
// environments.toml (the single source of truth, also read by
// `scripts/generate-registry-client.mjs`) rather than duplicated here.
//
// Imported as raw text (a Vite feature, works in both the SSR/worker bundle
// and the browser bundle) and parsed at module-init time — no build plugin
// needed for a file that changes only when the Registry contract itself is
// redeployed.

import { parse } from "smol-toml"
import environmentsToml from "../../environments.toml?raw"

interface Environment {
	network: { "network-passphrase": string }
	contracts: { registry: { id: string } }
}

const environments = parse(environmentsToml) as unknown as Record<
	"testnet" | "mainnet",
	Environment
>

function resolveEnvironment(network: string) {
	return environments[network === "mainnet" ? "mainnet" : "testnet"]
}

export function networkPassphrase(network: string) {
	return resolveEnvironment(network).network["network-passphrase"]
}

// The Stellar Registry contract's own address on each network. Deployed
// deterministically (fixed salt) by stellar-registry/contracts, so these are
// stable — see environments.toml and
// indexer/goldsky/networks/{testnet,mainnet}.env `ROOT_REGISTRY`.
export function registryContractId(network: string) {
	return resolveEnvironment(network).contracts.registry.id
}
