import { type Contract, type Wasm, type WasmDetail } from "./types"

/** Prefix a Wasm or Contract name with its Channel, if it exists and isn't verified */
export function prefixName(name: string, channel?: string) {
	return channel && channel !== "main" ? `${channel}/${name}` : name
}

export function getFullName(wasmOrContract: Wasm | Contract) {
	const channel =
		"channel" in wasmOrContract ? wasmOrContract.channel : undefined
	const name =
		"contract_name" in wasmOrContract
			? wasmOrContract.contract_name
			: wasmOrContract.wasm_name
	return prefixName(name, channel)
}

export function isLatestWasm(wasm: WasmDetail) {
	return wasm.wasm_version === wasm.versions[0]?.wasm_version
}
