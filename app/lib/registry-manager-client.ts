// Thin client-only wrapper around the generated `registry-manager-client`
// bindings for `registry-tansu-manager` (see
// clients/registry-manager-client/README.md), mirroring `registry-client.ts`.
// Its only method this app calls is `trigger(proposal_id)` — the
// permissionless call that executes an Approved Tansu proposal's outcome (see
// `contracts/registry-tansu-manager/src/lib.rs`). Caching/allowHttp logic
// lives in ./contract-client.

import { type Client as RegistryManagerClient } from "registry-manager-client"
import {
	type ContractClientOptions,
	getContractClient,
} from "./contract-client"

export function getRegistryManagerClient(
	options: ContractClientOptions,
): Promise<RegistryManagerClient> {
	return getContractClient(
		"registry-manager-client",
		() => import("registry-manager-client"),
		options,
	)
}
