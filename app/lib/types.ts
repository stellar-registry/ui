export interface ListResponse<T> {
	result: T[]
	next: string | null
}

// ── WASMs ─────────────────────────────────────────────

export interface Wasm {
	channel: string
	author: string
	wasm_version: string
	wasm_name: string
	wasm_hash: string
}

export function isWasm(data: unknown): data is Wasm {
	return (
		typeof data === "object" &&
		data !== null &&
		"wasm_name" in data &&
		typeof data.wasm_name === "string" &&
		"wasm_version" in data &&
		typeof data.wasm_version === "string" &&
		"wasm_hash" in data &&
		typeof data.wasm_hash === "string" &&
		"author" in data &&
		typeof data.author === "string"
	)
}

export type WasmVersion = Omit<Wasm, "channel">

export interface WasmMeta {
	rsver: string
	rssdkver: string
	// Both observed `null` in production (not every build sets these).
	rssdk_spec_shaking: string | null
	cliver: string
	source_repo: string
	binver: string | null
}

export interface WasmDetail extends Wasm {
	id: string
	transaction_hash: string
	ledger_sequence: number
	created_at: string
	versions: WasmVersion[]
	meta?: WasmMeta
}

export function isWasmDetail(data: unknown): data is WasmDetail {
	return (
		typeof data === "object" &&
		data !== null &&
		isWasm(data) &&
		"id" in data &&
		typeof data.id === "string" &&
		"transaction_hash" in data &&
		typeof data.transaction_hash === "string" &&
		"ledger_sequence" in data &&
		typeof data.ledger_sequence === "number" &&
		"created_at" in data &&
		typeof data.created_at === "string" &&
		"versions" in data &&
		Array.isArray(data.versions) &&
		data.versions.every(isWasm)
	)
}

export type WasmOutletContext = {
	wasm: WasmDetail
	name: string
	fullName: string // name prefixed with channel, if it exists
	channel?: string
	version?: string
}

export function isWasmOutletContext(data: unknown): data is WasmOutletContext {
	return (
		typeof data === "object" &&
		data !== null &&
		"wasm" in data &&
		isWasmDetail(data.wasm) &&
		"name" in data &&
		"fullName" in data
	)
}

// ── Contracts ─────────────────────────────────────────

export interface Contract {
	channel?: string
	contract_id: string
	contract_name: string
	deployer?: string
	wasm_version?: string
	wasm_name?: string
	wasm_channel?: string
	is_stellar_asset_contract: boolean
}

interface ContractVersion {
	wasm_name: string
	wasm_version: string
	wasm_channel?: string
	version_index: number
	kind: string
}

// Stellar Expert's per-contract "verified build" attestation, fetched and
// cached once per contract_id by the indexer (see stellar-registry/indexer's
// verify-build webhook) rather than on every request — see
// stellar-registry/ui#57 for why this moved server-side.
export interface ContractValidation {
	status: string
	repository: string
	commit: string
	// Only present when the verified build is a subdirectory of the
	// repository (a monorepo)
	path?: string
	package: string
}

export interface ContractDetail extends Contract {
	id: string
	transaction_hash: string
	ledger_sequence: number
	created_at: string
	versions: ContractVersion[]
	verified: ContractValidation | null
}

export interface SearchParams {
	query?: string
}

// ── Registries ────────────────────────────────────────
//
// A "registry" here is the root registry itself (channel "root") or one of
// its subregistries (e.g. "oz", "unverified") — each is its own deployed
// Registry contract instance. Deploying a wasm requires calling
// `deploy_unnamed` on the (sub)registry that actually published it, not
// necessarily the root.

export interface Registry {
	contract_id: string
	channel: string
	ledger_sequence: number
	created_at: string
}

// ── Deploy spec ───────────────────────────────────────
//
// GET /wasms/{wasm_hash}/deploy-spec returns the wasm's `__constructor`
// function spec, if it has one. Types are serialized straight from XDR
// `ScSpecTypeDef`: primitives are bare strings ("address", "u32", "i128", …);
// composites are single-key objects ("vec"/"map"/"option"/"tuple"/"udt").
// `udt` only carries a type *name* — the endpoint can't tell us a custom
// struct/enum's fields, so those (and every other composite) are treated as
// unsupported by the deploy form.

export type PrimitiveSpecType =
	| "u32"
	| "i32"
	| "u64"
	| "i64"
	| "u128"
	| "i128"
	| "u256"
	| "i256"
	| "bool"
	| "void"
	| "bytes"
	| "string"
	| "symbol"
	| "address"
	| "timepoint"
	| "duration"

export type ScSpecTypeDef =
	| PrimitiveSpecType
	| { bytes_n: { n: number } }
	| { option: { value_type: ScSpecTypeDef } }
	| { result: { ok_type: ScSpecTypeDef; error_type: ScSpecTypeDef } }
	| { vec: { element_type: ScSpecTypeDef } }
	| { map: { key_type: ScSpecTypeDef; value_type: ScSpecTypeDef } }
	| { tuple: { value_types: ScSpecTypeDef[] } }
	| { udt: { name: string } }

export interface FunctionInput {
	doc: string
	name: string
	type: ScSpecTypeDef
}

export interface FunctionSpec {
	doc?: string
	inputs: FunctionInput[]
}

export interface DeploySpec {
	__constructor?: FunctionSpec
}
