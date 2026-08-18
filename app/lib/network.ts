// Stellar network constants for the `network` label already threaded through
// the app via `useRootData()` (see app/root.tsx). These are protocol/registry
// constants, not operational config — unlike REGISTRY_API_URL/REGISTRY_RPC_URL
// there's nothing to configure per-deploy, so they live in code.

const TESTNET_PASSPHRASE = "Test SDF Network ; September 2015"
const MAINNET_PASSPHRASE = "Public Global Stellar Network ; September 2015"

export function networkPassphrase(network: string) {
	return network === "mainnet" ? MAINNET_PASSPHRASE : TESTNET_PASSPHRASE
}

// The Stellar Registry contract's own address on each network. Deployed
// deterministically (fixed salt) by stellar-registry/contracts, so these are
// stable — see indexer/goldsky/networks/{testnet,mainnet}.env `ROOT_REGISTRY`.
const TESTNET_REGISTRY_CONTRACT_ID =
	"CAAXJETKPYAATU4HVVQUTE2FFBULNFGZNEOC3MS635U5K3GZLAY2HI4M"
const MAINNET_REGISTRY_CONTRACT_ID =
	"CDU4M3LDIOUJJ5F3YXKJ4EJEP5VPRPG6N2LJ5HOQIMN7MNGL3NS3EGUY"

export function registryContractId(network: string) {
	return network === "mainnet"
		? MAINNET_REGISTRY_CONTRACT_ID
		: TESTNET_REGISTRY_CONTRACT_ID
}
