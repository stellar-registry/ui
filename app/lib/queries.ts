import { keepPreviousData, queryOptions } from "@tanstack/react-query"
import { type Network } from "@theahaco/contract-explorer"
import {
	getContract,
	getContracts,
	getWasm,
	getWasmMeta,
	getWasms,
} from "./api"
import { type SearchParams } from "./types"
import { getWalletState } from "./wallet"

const STALE_TIME = 60_000

export const contractsQueryKey = (params: SearchParams) => [
	"contracts",
	params.query ?? "",
]

export const contractsQueryOptions = (params: SearchParams) =>
	queryOptions({
		queryKey: contractsQueryKey(params),
		queryFn: () => getContracts(undefined, params),
		staleTime: STALE_TIME,
		placeholderData: keepPreviousData,
	})

export const contractQueryKey = (contractName: string, channel?: string) => [
	"contract",
	channel,
	contractName,
]

export const contractQueryOptions = (contractName: string, channel?: string) =>
	queryOptions({
		queryKey: contractQueryKey(contractName, channel),
		queryFn: () => getContract(contractName, channel),
		staleTime: STALE_TIME,
	})

export const wasmsQueryKey = (params: SearchParams) => [
	"wasms",
	params.query ?? "",
]

export const wasmsQueryOptions = (params: SearchParams) =>
	queryOptions({
		queryKey: wasmsQueryKey(params),
		queryFn: () => getWasms(undefined, params),
		staleTime: STALE_TIME,
		placeholderData: keepPreviousData,
	})

export const wasmQueryKey = (wasmName: string, version?: string) => [
	"wasm",
	wasmName,
	version,
]

export const wasmQueryOptions = (wasmName: string, version?: string) =>
	queryOptions({
		queryKey: wasmQueryKey(wasmName, version),
		queryFn: () => getWasm(wasmName, version),
		staleTime: STALE_TIME,
	})

export const wasmMetaQueryKey = (repoUrl: string) => ["wasmMeta", repoUrl]

export const wasmMetaQueryOptions = (repoUrl: string) =>
	queryOptions({
		queryKey: wasmMetaQueryKey(repoUrl),
		staleTime: STALE_TIME,
		queryFn: () => getWasmMeta(repoUrl),
	})

export const WALLET_QUERY_KEY = ["wallet"]

/**
 * Connected wallet address and network.
 *
 * Unlike the registry endpoints above this is push-based, not polled: the
 * `queryFn` only establishes the initial value (and, by initializing the kit,
 * restores a persisted session), after which the kit's own events write
 * through `setQueryData`. Hence `staleTime: Infinity`. There is nothing to
 * refetch, and a background refetch would pop the wallet's UI.
 *
 * NOTE: only ever subscribed to from the contract explorer, so the wallet kit
 * stays out of every other route's bundle.
 */
export const walletQueryOptions = (network: Network) =>
	queryOptions({
		queryKey: WALLET_QUERY_KEY,
		queryFn: () => getWalletState(network),
		staleTime: Infinity,
		gcTime: Infinity,
		retry: false,
	})
