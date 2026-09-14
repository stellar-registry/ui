// Builds the on-chain outcome call and off-chain (IPFS) content for a
// governance proposal, for operations that go through Tansu on testnet (see
// `app/lib/tansu.ts` for why only testnet).
//
// The on-chain shape (`OutcomeContract { address, execute_fn, args }`) is
// read by `registry-tansu-manager::trigger` once a proposal is Approved (see
// `contracts/registry-tansu-manager/src/lib.rs`) — it authorizes exactly that
// one `(address, execute_fn, args)` call and forwards to Tansu's `execute`.
// `args` there must be the *exact* raw `xdr.ScVal[]` the target function
// expects, so it's built from the registry contract's own spec
// (`registryClient.spec.funcArgsToScVals`) rather than hand-encoded — the
// same conversion `stellar contract invoke` itself would do, so a `--dry-run`
// of the equivalent CLI call is the way to sanity-check this against a real
// simulation before trusting it in a live proposal.
//
// `outcomes.json`/`proposal.md` (uploaded to IPFS, see `app/lib/ipfs.ts`) are
// purely descriptive — Tansu's own dapp reads them to render the proposal
// page — the manager never looks at IPFS content, only the on-chain
// `outcome_contracts`.

import { getRegistryClient } from "./registry-client"

export interface OutcomeContract {
	address: string
	execute_fn: string
	args: unknown[]
}

export async function buildRegisterContractOutcome({
	rpcUrl,
	networkPassphrase,
	registryContractId,
	contractName,
	contractAddress,
	owner,
}: {
	rpcUrl: string
	networkPassphrase: string
	registryContractId: string
	contractName: string
	contractAddress: string
	owner: string
}): Promise<OutcomeContract> {
	const registryClient = await getRegistryClient({
		rpcUrl,
		networkPassphrase,
		contractId: registryContractId,
	})
	const args = registryClient.spec.funcArgsToScVals("register_contract", {
		contract_name: contractName,
		contract_address: contractAddress,
		owner,
	})
	return { address: registryContractId, execute_fn: "register_contract", args }
}

export function buildProposalMarkdown({
	title,
	requesterAddress,
	requesterGithub,
	justification,
	summary,
}: {
	title: string
	requesterAddress: string
	requesterGithub?: string
	justification: string
	summary: string
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
