import { type Network } from "@theahaco/contract-explorer"

const NETWORKS: Record<"testnet" | "mainnet", Network> = {
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

export function getNetwork(networkId: string): Network {
	return NETWORKS[networkId as "testnet" | "mainnet"] ?? NETWORKS.testnet
}
