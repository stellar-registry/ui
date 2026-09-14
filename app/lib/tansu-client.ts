// Thin client-only wrapper around the generated `tansu-client` bindings (see
// clients/tansu-client/README.md), mirroring `registry-client.ts`. Dynamically
// imports both `tansu-client` and its `@stellar/stellar-sdk` dependency so
// neither is ever pulled into the SSR bundle — this is only ever called from
// browser event handlers.

import { type Client as TansuClient } from "tansu-client"

let cached: { key: string; client: TansuClient } | undefined

function isLocalRpc(rpcUrl: string): boolean {
	try {
		const { hostname } = new URL(rpcUrl)
		return hostname === "localhost" || hostname === "127.0.0.1"
	} catch {
		return false
	}
}

export async function getTansuClient({
	rpcUrl,
	networkPassphrase,
	contractId,
}: {
	rpcUrl: string
	networkPassphrase: string
	contractId: string
}): Promise<TansuClient> {
	const key = `${rpcUrl}|${networkPassphrase}|${contractId}`
	if (cached?.key === key) return cached.client
	const { Client } = await import("tansu-client")
	const client = new Client({
		contractId,
		networkPassphrase,
		rpcUrl,
		allowHttp: isLocalRpc(rpcUrl),
	})
	cached = { key, client }
	return client
}
