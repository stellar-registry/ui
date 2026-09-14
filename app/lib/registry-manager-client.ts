// Thin client-only wrapper around the generated `registry-manager-client`
// bindings for `registry-tansu-manager` (see
// clients/registry-manager-client/README.md), mirroring `registry-client.ts`.
// Its only method this app calls is `trigger(proposal_id)` — the
// permissionless call that executes an Approved Tansu proposal's outcome (see
// `contracts/registry-tansu-manager/src/lib.rs`).

import { type Client as RegistryManagerClient } from "registry-manager-client"

let cached: { key: string; client: RegistryManagerClient } | undefined

function isLocalRpc(rpcUrl: string): boolean {
	try {
		const { hostname } = new URL(rpcUrl)
		return hostname === "localhost" || hostname === "127.0.0.1"
	} catch {
		return false
	}
}

export async function getRegistryManagerClient({
	rpcUrl,
	networkPassphrase,
	contractId,
}: {
	rpcUrl: string
	networkPassphrase: string
	contractId: string
}): Promise<RegistryManagerClient> {
	const key = `${rpcUrl}|${networkPassphrase}|${contractId}`
	if (cached?.key === key) return cached.client
	const { Client } = await import("registry-manager-client")
	const client = new Client({
		contractId,
		networkPassphrase,
		rpcUrl,
		allowHttp: isLocalRpc(rpcUrl),
	})
	cached = { key, client }
	return client
}
