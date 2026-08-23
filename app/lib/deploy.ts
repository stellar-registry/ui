// Builds, simulates, signs, and submits the `deploy_unnamed` invocation
// against the Registry contract, via the generated `registry-client`
// bindings (see clients/registry-client — regenerate with
// `npm run generate:registry-client`). Client-only — dynamically imports
// @stellar/stellar-sdk and registry-client so neither is ever pulled into
// the SSR bundle.
//
// See stellar-registry/contracts registry::contract::deploy_unnamed:
//   fn deploy_unnamed(wasm_name, version, init, salt, deployer) -> Address
// (deployer.require_auth() only, so any connected wallet can call it.)

import { type SupportedSpecType, parseArgValue } from "./scval"

export type ConstructorArg = {
	name: string
	type: SupportedSpecType
	rawValue: string
}

export type DeployResult = { contractId: string }

export async function deployFromWasm({
	rpcUrl,
	networkPassphrase,
	registryContractId,
	wasmName,
	wasmVersion,
	constructorArgs,
	deployerAddress,
	signTransaction,
}: {
	rpcUrl: string
	networkPassphrase: string
	registryContractId: string
	wasmName: string
	wasmVersion?: string
	/** undefined = no constructor to call (init passed as void) */
	constructorArgs: ConstructorArg[] | undefined
	deployerAddress: string
	signTransaction: (xdr: string) => Promise<string>
}): Promise<DeployResult> {
	const [{ nativeToScVal }, { Client: RegistryClient }] = await Promise.all([
		import("@stellar/stellar-sdk"),
		import("registry-client"),
	])

	const salt = crypto.getRandomValues(new Uint8Array(32))

	const init = constructorArgs
		? constructorArgs.map((arg) => {
				const value = parseArgValue(arg.type, arg.rawValue)
				// "bool" isn't a valid nativeToScVal type hint — a JS boolean
				// converts to scvBool unambiguously without one.
				return arg.type === "bool"
					? nativeToScVal(value)
					: nativeToScVal(value, { type: arg.type })
			})
		: undefined

	const registry = new RegistryClient({
		contractId: registryContractId,
		networkPassphrase,
		rpcUrl,
		allowHttp: true,
		publicKey: deployerAddress,
		// registry-client's ClientOptions expects the Freighter-shaped signer
		// (xdr, opts) => Promise<{ signedTxXdr }>; wallet.ts's signTransaction is
		// the simpler (xdr) => Promise<string> shape used throughout the deploy
		// dialog, so adapt it here rather than changing that call site.
		signTransaction: async (xdr) => ({
			signedTxXdr: await signTransaction(xdr),
		}),
	})

	let tx
	try {
		tx = await registry.deploy_unnamed({
			wasm_name: wasmName,
			version: wasmVersion,
			init,
			salt: Buffer.from(salt),
			deployer: deployerAddress,
		})
	} catch (e) {
		throw new Error(
			`Failed to prepare the deploy transaction: ${e instanceof Error ? e.message : String(e)}`,
		)
	}

	let sent
	try {
		sent = await tx.signAndSend()
	} catch (e) {
		const message = e instanceof Error ? e.message : String(e)
		// txBadAuth almost always means the connected wallet's account changed
		// (in the extension, out of band) between building and submitting the
		// transaction — surface that instead of the raw RPC failure JSON.
		if (message.includes("txBadAuth")) {
			throw new Error(
				"The network rejected the transaction's signature (txBadAuth) — this usually means the connected wallet account changed. Disconnect and reconnect your wallet, then try deploying again.",
			)
		}
		throw new Error(`Failed to send the deploy transaction: ${message}`)
	}
	// `result` is a Rust-style Result<Address, Error> — unwrap() throws the
	// contract's own error message (e.g. "NoSuchWasmPublished") on failure.
	const { result } = sent
	return { contractId: result.unwrap() }
}
