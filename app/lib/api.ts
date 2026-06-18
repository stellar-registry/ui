import { data } from "react-router"
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

type InternalServerError = {
	error?: string
	request_id?: string
}

function isInternalServerError(value: unknown): value is InternalServerError {
	if (typeof value !== "object" || value === null) return false
	if ("error" in value && typeof value.error !== "string") return false
	if ("request_id" in value && typeof value.request_id !== "string")
		return false
	return true
}

async function apiFetch<T>(path: string, apiUrl?: string): Promise<T> {
	// Server-side: use the runtime API URL passed from load context (Cloudflare env).
	// Client-side: route through the /api proxy so all browser requests are same-origin.
	const apiBase = import.meta.env.SSR ? apiUrl : "/api"
	const res = await fetch(`${apiBase}${API_VERSION}${path}`)
	if (!res.ok) {
		const raw = await res.json().catch(() => undefined)
		const payload = isInternalServerError(raw) ? raw : undefined

		throw data(
			{
				error: payload?.error ?? res.statusText ?? "Request failed",
				request_id: res.status === 500 ? payload?.request_id : undefined,
			},
			{ status: res.status, statusText: res.statusText || "Error" },
		)
	}
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
