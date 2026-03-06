import { queryOptions } from "@tanstack/react-query"
import {
	checkHealth,
	getContract,
	getContracts,
	getWasm,
	getWasms,
} from "./api"

const STALE_TIME = 60_000

export const contractsQueryOptions = () =>
	queryOptions({
		queryKey: ["contracts"],
		queryFn: getContracts,
		staleTime: STALE_TIME,
	})

export const contractQueryOptions = (contractName: string) =>
	queryOptions({
		queryKey: ["contracts", contractName],
		queryFn: () => getContract(contractName),
		staleTime: STALE_TIME,
	})

export const wasmsQueryOptions = () =>
	queryOptions({
		queryKey: ["wasms"],
		queryFn: getWasms,
		staleTime: STALE_TIME,
	})

export const wasmQueryOptions = (wasmName: string, version?: string) =>
	queryOptions({
		queryKey: ["wasms", wasmName, version],
		queryFn: () => getWasm(wasmName, version),
		staleTime: STALE_TIME,
	})

export const healthQueryOptions = () =>
	queryOptions({
		queryKey: ["health"],
		queryFn: checkHealth,
		staleTime: 30_000,
	})
