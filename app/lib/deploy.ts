// Builds, simulates, signs, and submits the `deploy_unnamed` invocation
// against the Registry contract. Client-only — dynamically imports
// @stellar/stellar-sdk so it's never pulled into the SSR bundle.
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

const POLL_INTERVAL_MS = 1500
const POLL_TIMEOUT_MS = 30_000

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
	const {
		rpc,
		TransactionBuilder,
		Operation,
		BASE_FEE,
		nativeToScVal,
		scValToNative,
		xdr,
	} = await import("@stellar/stellar-sdk")

	const server = new rpc.Server(rpcUrl)

	const salt = crypto.getRandomValues(new Uint8Array(32))

	const initArg = constructorArgs
		? xdr.ScVal.scvVec(
				constructorArgs.map((arg) => {
					const value = parseArgValue(arg.type, arg.rawValue)
					// "bool" isn't a valid nativeToScVal type hint — a JS boolean
					// converts to scvBool unambiguously without one.
					return arg.type === "bool"
						? nativeToScVal(value)
						: nativeToScVal(value, { type: arg.type })
				}),
			)
		: xdr.ScVal.scvVoid()

	const args = [
		nativeToScVal(wasmName, { type: "string" }),
		wasmVersion
			? nativeToScVal(wasmVersion, { type: "string" })
			: xdr.ScVal.scvVoid(),
		initArg,
		nativeToScVal(salt, { type: "bytes" }),
		nativeToScVal(deployerAddress, { type: "address" }),
	]

	const account = await server.getAccount(deployerAddress)
	const tx = new TransactionBuilder(account, {
		fee: BASE_FEE,
		networkPassphrase,
	})
		.addOperation(
			Operation.invokeContractFunction({
				contract: registryContractId,
				function: "deploy_unnamed",
				args,
			}),
		)
		.setTimeout(60)
		.build()

	const prepared = await server.prepareTransaction(tx)
	const signedXdr = await signTransaction(prepared.toXDR())
	const signedTx = TransactionBuilder.fromXDR(signedXdr, networkPassphrase)

	const sent = await server.sendTransaction(signedTx)
	if (sent.status !== "PENDING") {
		throw new Error(`Failed to submit transaction: ${sent.status}`)
	}

	const deadline = Date.now() + POLL_TIMEOUT_MS
	while (Date.now() < deadline) {
		const result = await server.getTransaction(sent.hash)
		if (result.status === "SUCCESS") {
			if (!result.returnValue) {
				throw new Error("Deploy succeeded but returned no contract address.")
			}
			return { contractId: scValToNative(result.returnValue) as string }
		}
		if (result.status === "FAILED") {
			throw new Error("Deploy transaction failed on-chain.")
		}
		await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS))
	}

	throw new Error(
		"Timed out waiting for the deploy transaction to confirm. Check the transaction hash on stellar.expert.",
	)
}
