// Builds the on-chain outcome call and off-chain (IPFS) content for a
// governance proposal (testnet-only, see `app/lib/tansu.ts`).
//
// `OutcomeContract.args` must be the exact raw `xdr.ScVal[]` the target
// function expects — built from the registry contract's own spec
// (`funcArgsToScVals`) rather than hand-encoded, since that's what
// `registry-tansu-manager::trigger` authorizes and forwards verbatim.
//
// `outcomes.json`/`proposal.md` are purely descriptive (Tansu's dapp reads
// them to render the proposal page) — the manager only ever looks at the
// on-chain `outcome_contracts`, never IPFS content.

import { getRegistryClient } from "./registry-client"

export interface OutcomeContract {
	address: string
	execute_fn: string
	args: unknown[]
}

async function buildRegistryOutcome({
	rpcUrl,
	networkPassphrase,
	registryContractId,
	fn,
	args,
}: {
	rpcUrl: string
	networkPassphrase: string
	registryContractId: string
	fn: string
	args: Record<string, unknown>
}): Promise<OutcomeContract> {
	const registryClient = await getRegistryClient({
		rpcUrl,
		networkPassphrase,
		contractId: registryContractId,
	})
	return {
		address: registryContractId,
		execute_fn: fn,
		args: registryClient.spec.funcArgsToScVals(fn, args),
	}
}

interface RegistryOutcomeContext {
	rpcUrl: string
	networkPassphrase: string
	registryContractId: string
}

export function buildRegisterContractOutcome({
	contractName,
	contractAddress,
	owner,
	...context
}: RegistryOutcomeContext & {
	contractName: string
	contractAddress: string
	owner: string
}): Promise<OutcomeContract> {
	return buildRegistryOutcome({
		...context,
		fn: "register_contract",
		args: {
			contract_name: contractName,
			contract_address: contractAddress,
			owner,
		},
	})
}

export function buildPublishHashOutcome({
	wasmName,
	author,
	wasmHash,
	version,
	...context
}: RegistryOutcomeContext & {
	wasmName: string
	author: string
	/** 64-character hex. */
	wasmHash: string
	version: string
}): Promise<OutcomeContract> {
	return buildRegistryOutcome({
		...context,
		fn: "publish_hash",
		args: {
			wasm_name: wasmName,
			author,
			wasm_hash: Buffer.from(wasmHash, "hex"),
			version,
		},
	})
}

export function buildProposalMarkdown({
	title,
	requesterAddress,
	requesterGithub,
	justification,
	summary,
	details,
}: {
	title: string
	requesterAddress: string
	requesterGithub?: string
	justification: string
	summary: string
	details?: Array<[string, string]>
}): string {
	const lines = [
		`# ${title}`,
		"",
		summary,
		"",
		"## Requester",
		"",
		`- Stellar address: \`${requesterAddress}\``,
	]
	if (requesterGithub) lines.push(`- GitHub: @${requesterGithub}`)
	if (details?.length) {
		lines.push("", "## Details", "")
		for (const [label, value] of details) lines.push(`- ${label}: ${value}`)
	}
	lines.push("", "## Justification", "", justification, "")
	return lines.join("\n")
}

/**
 * `outcomes.json` per the tree format documented in Tansu's governance docs
 * (`website/docs/developers/governance.mdx` in Consulting-Manao/tansu) — used
 * only for the Tansu dapp's own display, so `args` here are base64 XDR for
 * human/debug legibility, not re-parsed by anything on-chain.
 */
export async function buildOutcomesJson({
	approved,
	rejectedDescription,
}: {
	approved: { description: string; outcome: OutcomeContract }
	rejectedDescription: string
}): Promise<string> {
	// Each element is already an `xdr.ScVal` (see `buildRegisterContractOutcome`)
	// — narrow just enough to call its own `toXDR`, rather than importing the
	// `xdr` namespace only to name that type.
	const args = approved.outcome.args.map((arg) =>
		(arg as { toXDR: (format: "base64") => string }).toXDR("base64"),
	)
	return JSON.stringify(
		{
			outcomes: {
				approved: {
					description: approved.description,
					execution: {
						type: "contract",
						contract: {
							address: approved.outcome.address,
							execute_fn: approved.outcome.execute_fn,
							args,
						},
					},
				},
				rejected: { description: rejectedDescription },
			},
		},
		null,
		2,
	)
}
