// Thin client-only wrapper around the generated `tansu-client` bindings (see
// clients/tansu-client/README.md), mirroring `registry-client.ts`. Dynamically
// imports both `tansu-client` and its `@stellar/stellar-sdk` dependency so
// neither is ever pulled into the SSR bundle — this is only ever called from
// browser event handlers. Caching/allowHttp logic lives in ./contract-client.

import { type Client as TansuClient } from "tansu-client"
import {
	type ContractClientOptions,
	getContractClient,
} from "./contract-client"

export function getTansuClient(
	options: ContractClientOptions,
): Promise<TansuClient> {
	return getContractClient(
		"tansu-client",
		() => import("tansu-client"),
		options,
	)
}
