// Shared plumbing behind app/lib/{registry,tansu,registry-manager}-client.ts.
// Each of those is a one-line wrapper supplying its own literal `import()`
// (so Vite can still code-split per package and keep it out of the SSR
// bundle — a variable module specifier here would defeat that) and calling
// into this for the caching/allowHttp logic they'd otherwise all duplicate.

const cache = new Map<string, unknown>()

function isLocalRpc(rpcUrl: string): boolean {
	try {
		const { hostname } = new URL(rpcUrl)
		return hostname === "localhost" || hostname === "127.0.0.1"
	} catch {
		return false
	}
}

export interface ContractClientOptions {
	rpcUrl: string
	networkPassphrase: string
	contractId: string
}

interface ClientConstructorOptions {
	contractId: string
	networkPassphrase: string
	rpcUrl: string
	allowHttp: boolean
}

/**
 * Caches one Client per (packageName, rpcUrl, networkPassphrase, contractId)
 * identity as a module-level singleton, so every route reuses the same
 * instance instead of rebuilding one per component/click. `publicKey` and
 * `signTransaction` are the only things that change per call (which
 * wallet/account is connected) — set those on `client.options` right before
 * use rather than baking them in here.
 */
export async function getContractClient<T>(
	packageName: string,
	loadClient: () => Promise<{
		Client: new (options: ClientConstructorOptions) => T
	}>,
	{ rpcUrl, networkPassphrase, contractId }: ContractClientOptions,
): Promise<T> {
	const key = `${packageName}|${rpcUrl}|${networkPassphrase}|${contractId}`
	const cached = cache.get(key)
	if (cached) return cached as T

	const { Client } = await loadClient()
	const client = new Client({
		contractId,
		networkPassphrase,
		rpcUrl,
		// Only trust plaintext RPC for a local dev network — anything else
		// should be going over https.
		allowHttp: isLocalRpc(rpcUrl),
	})
	cache.set(key, client)
	return client
}
