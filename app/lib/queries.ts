import { keepPreviousData, queryOptions } from "@tanstack/react-query"
import {
	getContract,
	getContracts,
	getWasm,
	getWasmMeta,
	getWasms,
} from "./api"
import { type SearchParams } from "./types"

const STALE_TIME = 60_000

export const contractsQueryOptions = () =>
	queryOptions({
		queryKey: ["contracts"],
		queryFn: () => getContracts(),
		staleTime: STALE_TIME,
	})

export const contractQueryOptions = (contractName: string, channel?: string) =>
	queryOptions({
		queryKey: ["contracts", channel, contractName],
		queryFn: () => getContract(contractName, channel),
		staleTime: STALE_TIME,
	})

export const wasmsQueryOptions = (params: SearchParams) =>
	queryOptions({
		queryKey: ["wasms", params.query ?? ""],
		queryFn: () => getWasms(undefined, params),
		staleTime: STALE_TIME,
		placeholderData: keepPreviousData,
	})

export const wasmQueryOptions = (wasmName: string, version?: string) =>
	queryOptions({
		queryKey: ["wasms", wasmName, version],
		queryFn: () => getWasm(wasmName, version),
		staleTime: STALE_TIME,
	})

export const wasmMetaQueryOptions = (repoUrl: string) =>
	queryOptions({
		queryKey: ["wasm-meta", repoUrl],
		staleTime: STALE_TIME,
		queryFn: () => getWasmMeta(repoUrl),
	})
