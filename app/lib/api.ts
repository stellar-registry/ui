import {
	type Contract,
	type ContractDetail,
	type ListResponse,
	type Wasm,
	type WasmDetail,
} from "./types"

const API_BASE = import.meta.env.SSR
	? "https://registry-indexer.fly.dev"
	: "/api"

async function apiFetch<T>(path: string): Promise<T> {
	const res = await fetch(`${API_BASE}${path}`)
	if (!res.ok) throw new Error(`API error ${res.status}: ${res.statusText}`)
	return res.json() as Promise<T>
}

export async function getContracts(): Promise<Contract[]> {
	const data = await apiFetch<ListResponse<Contract>>("/contracts")
	return data.result
}

export async function getContract(
	contractName: string,
): Promise<ContractDetail> {
	return apiFetch<ContractDetail>(`/contracts/${contractName}`)
}

export async function getWasms(): Promise<Wasm[]> {
	const data = await apiFetch<ListResponse<Wasm>>("/wasms")
	return data.result
}

export async function getWasm(
	wasmName: string,
	version?: string,
): Promise<WasmDetail> {
	const path = version
		? `/wasms/${wasmName}/v/${version}`
		: `/wasms/${wasmName}`
	return apiFetch<WasmDetail>(path)
}

export async function checkHealth(): Promise<boolean> {
	const res = await fetch(`${API_BASE}/health`)
	return res.ok
}
