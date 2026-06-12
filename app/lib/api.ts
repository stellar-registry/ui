import { fetchGithubMetadata, parseGithubSourceRepo } from "./github"
import {
	type Contract,
	type ContractDetail,
	type ListResponse,
	type Wasm,
	type WasmDetail,
} from "./types"
import { prefixName } from "./util"

const API_VERSION = "/v1"

async function apiFetch<T>(path: string, apiUrl?: string): Promise<T> {
	// Server-side: use the runtime API URL passed from load context (Cloudflare env).
	// Client-side: route through the /api proxy so all browser requests are same-origin.
	const apiBase = import.meta.env.SSR ? apiUrl : "/api"
	const res = await fetch(`${apiBase}${API_VERSION}${path}`)
	if (!res.ok) throw new Error(`API error ${res.status}: ${res.statusText}`)
	return res.json() as Promise<T>
}

export async function getContracts(apiUrl?: string): Promise<Contract[]> {
	const data = await apiFetch<ListResponse<Contract>>("/contracts", apiUrl)
	return data.result
}

export async function getContract(
	name: string,
	channel?: string,
	apiUrl?: string,
): Promise<ContractDetail> {
	return apiFetch<ContractDetail>(
		`/contracts/${prefixName(name, channel)}`,
		apiUrl,
	)
}

export async function getWasms(apiUrl?: string): Promise<Wasm[]> {
	const data = await apiFetch<ListResponse<Wasm>>("/wasms", apiUrl)
	return data.result
}

export async function getWasm(
	name: string,
	channel?: string,
	version?: string,
	apiUrl?: string,
): Promise<WasmDetail> {
	const path = version
		? `/wasms/${prefixName(name, channel)}/v/${version}`
		: `/wasms/${prefixName(name, channel)}`
	return apiFetch<WasmDetail>(path, apiUrl)
}

export async function checkHealth(): Promise<boolean> {
	try {
		// NOTE: don't use `apiFetch` helper, only check response don't parse empty content
		await fetch(`/api/health`)
		return true
	} catch {
		return false
	}
}

export function getWasmMeta(sourceRepoUrl: string) {
	return fetchGithubMetadata(parseGithubSourceRepo(sourceRepoUrl))
}
