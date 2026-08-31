import { stellarExpertNetworkSegment } from "./network"

// Stellar Expert attests wasm builds via a GitHub Actions workflow that
// compiles a contract's source and publishes the resulting hash/repo/commit
// to their explorer; This utility fetches that information.
export interface ContractValidation {
	status: string
	repository: string
	commit: string
	// Only present when the verified build is a subdirectory of the
	// repository (a monorepo)
	path?: string
	package: string
	ts: number
}

type ContractResponse = {
	validation?: ContractValidation
}

function isContractValidation(value: unknown): value is ContractValidation {
	if (!value || typeof value !== "object") return false
	const entry = value as Record<string, unknown>
	return (
		typeof entry.status === "string" &&
		typeof entry.repository === "string" &&
		typeof entry.commit === "string" &&
		typeof entry.package === "string" &&
		typeof entry.ts === "number"
	)
}

export async function getContractValidation(
	contractId: string,
	network: string,
): Promise<ContractValidation | null> {
	try {
		const segment = stellarExpertNetworkSegment(network)
		const url = `https://api.stellar.expert/explorer/${segment}/contract/${contractId}`
		const response = await fetch(url)
		if (!response.ok) return null

		const data = (await response.json()) as ContractResponse
		if (!isContractValidation(data.validation)) return null
		if (data.validation.status !== "verified") return null

		return data.validation
	} catch {
		return null
	}
}
