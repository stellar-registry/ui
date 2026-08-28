// Thin client-only wrapper around the generated `registry-client` bindings
// (see clients/registry-client/README.md). Dynamically imports both
// `registry-client` and its `@stellar/stellar-sdk` dependency so neither is
// ever pulled into the SSR bundle — this is only ever called from browser
// event handlers.
//
// Caches one Client per (rpcUrl, networkPassphrase, contractId) identity as a
// module-level singleton, so every Registry-interacting route reuses the same
// instance instead of rebuilding one per component/click. `publicKey` and
// `signTransaction` are the only things that change per call (which
// wallet/account is connected) — set those on `client.options` right before
// use rather than baking them in here.

import { type Client as RegistryClient } from "registry-client"

let cached: { key: string; client: RegistryClient } | undefined

function isLocalRpc(rpcUrl: string): boolean {
	try {
		const { hostname } = new URL(rpcUrl)
		return hostname === "localhost" || hostname === "127.0.0.1"
	} catch {
		return false
	}
}

export async function getRegistryClient({
	rpcUrl,
	networkPassphrase,
	contractId,
}: {
	rpcUrl: string
	networkPassphrase: string
	contractId: string
}): Promise<RegistryClient> {
	const key = `${rpcUrl}|${networkPassphrase}|${contractId}`
	if (cached?.key === key) return cached.client
	const { Client } = await import("registry-client")
	const client = new Client({
		contractId,
		networkPassphrase,
		rpcUrl,
		// Only trust plaintext RPC for a local dev network — anything else
		// should be going over https.
		allowHttp: isLocalRpc(rpcUrl),
	})
	cached = { key, client }
	return client
}
