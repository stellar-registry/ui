// Thin client-only wrapper around the generated `registry-client` bindings
// (see clients/registry-client/README.md). Dynamically imports both
// `registry-client` and its `@stellar/stellar-sdk` dependency so neither is
// ever pulled into the SSR bundle — this is only ever called from browser
// event handlers. Caching/allowHttp logic lives in ./contract-client, shared
// with tansu-client.ts and registry-manager-client.ts.

import { type Client as RegistryClient } from "registry-client"
import {
	type ContractClientOptions,
	getContractClient,
} from "./contract-client"

export function getRegistryClient(
	options: ContractClientOptions,
): Promise<RegistryClient> {
	return getContractClient(
		"registry-client",
		() => import("registry-client"),
		options,
	)
}
