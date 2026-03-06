export interface ListResponse<T> {
	result: T[]
	next: string | null
}

// ── WASMs ─────────────────────────────────────────────

export interface Wasm {
	author: string
	version: string
	wasm_name: string
	wasm_hash: string
}

export interface WasmDetail extends Wasm {
	id: string
	transaction_hash: string
	ledger_sequence: number
	created_at: string
}

// ── Contracts ─────────────────────────────────────────

export interface Contract {
	contract_id: string
	contract_name: string
	deployer: string
	version: string
	wasm_name: string
}

export interface ContractDetail extends Contract {
	id: string
	transaction_hash: string
	ledger_sequence: number
	created_at: string
}
