import { stellarExpertNetworkSegment } from "./network"

// Stellar Expert attests wasm builds via a GitHub Actions workflow that
// compiles a contract's source and publishes the resulting hash/repo/commit
// to their explorer — see https://github.com/stellar-experimental/contract-verifications.
// `status` is "verified" when that attestation matches this contract's
// deployed wasm; there's no distinct "unverified" status to check for, the
// `validation` key is simply absent from the response otherwise.
export interface ContractValidation {
	status: string
	repository: string
	commit: string
	path: string
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
		typeof entry.path === "string" &&
		typeof entry.package === "string" &&
		typeof entry.ts === "number"
	)
}

// api.stellar.expert sends no CORS headers, so this can only be called
// server-side (a route loader), never from the browser.
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
