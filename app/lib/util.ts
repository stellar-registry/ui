import { type Contract, type Wasm, type WasmDetail } from "./types"

export function fullName(wasmOrContract: Wasm | Contract) {
	const channel =
		"channel" in wasmOrContract ? wasmOrContract.channel : undefined
	const name =
		"contract_name" in wasmOrContract
			? wasmOrContract.contract_name
			: wasmOrContract.wasm_name
	return channel && channel !== "main" ? `${channel}/${name}` : name
}

export function isLatestWasm(wasm: WasmDetail) {
	return wasm.wasm_version === wasm.versions[0]?.wasm_version
}
