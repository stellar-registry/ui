import { type Network } from "@theahaco/contract-explorer"

// Stellar network constants for the `network` label already threaded through
// the app via `useRootData()` (see app/root.tsx). These are protocol/registry
// constants, not operational config — unlike REGISTRY_API_URL/REGISTRY_RPC_URL
// there's nothing to configure per-deploy, so they live in code.

type NetworkId = "testnet" | "mainnet"

// The Stellar Registry contract's own address on each network. Deployed
// deterministically (fixed salt) by stellar-registry/contracts, so these are
// stable — see indexer/goldsky/networks/{testnet,mainnet}.env `ROOT_REGISTRY`.
const REGISTRY_CONTRACT_IDS: Record<NetworkId, string> = {
	testnet: "CAAXJETKPYAATU4HVVQUTE2FFBULNFGZNEOC3MS635U5K3GZLAY2HI4M",
	mainnet: "CDU4M3LDIOUJJ5F3YXKJ4EJEP5VPRPG6N2LJ5HOQIMN7MNGL3NS3EGUY",
}

const NETWORKS: Record<NetworkId, Network> = {
	testnet: {
		id: "testnet",
		label: "Testnet",
		horizonUrl: "https://horizon-testnet.stellar.org",
		rpcUrl: "https://soroban-testnet.stellar.org",
		passphrase: "Test SDF Network ; September 2015",
	},
	mainnet: {
		id: "mainnet",
		label: "Mainnet",
		horizonUrl: "https://horizon.stellar.org",
		rpcUrl: "https://mainnet.sorobanrpc.com",
		passphrase: "Public Global Stellar Network ; September 2015",
	},
}

function toNetworkId(networkId: string): NetworkId {
	return networkId === "mainnet" ? "mainnet" : "testnet"
}

export function getNetwork(networkId: string): Network {
	return NETWORKS[toNetworkId(networkId)]
}

export function networkPassphrase(networkId: string): string {
	return getNetwork(networkId).passphrase
}

export function registryContractId(networkId: string): string {
	return REGISTRY_CONTRACT_IDS[toNetworkId(networkId)]
}

// Stellar Expert's own network segment naming — "public" for mainnet,
// "testnet" otherwise. Shared by the stellarExpertUrl web links (root.tsx)
// and the api.stellar.expert calls (lib/stellar-expert.ts).
export function stellarExpertNetworkSegment(networkId: string): string {
	return networkId === "mainnet" ? "public" : "testnet"
}
