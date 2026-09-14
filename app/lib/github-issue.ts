// Mainnet governance path: no on-chain proposal, no backend — the mainnet
// root registry's `manager` is a plain admin key (verified live via
// `stellar contract invoke`, 2026-09-14), not a Tansu-gated contract, so
// governance there is a human process against the `stellar-registry/gov`
// issue tracker (see gov#1 for the one real precedent so far). This builds a
// prefilled "New issue" link against a GitHub Issue Form there — the
// requester submits it themselves under their own GitHub identity, so there's
// nothing to host or hold credentials for.
//
// Field ids below (`contract_name`, `contract_address`, ...) must match the
// `id:` of each `input`/`textarea` in
// `stellar-registry/gov/.github/ISSUE_TEMPLATE/add-contract-to-root-registry.yml`
// — see that template for the corresponding side of this contract.

const GOV_REPO = "stellar-registry/gov"

export function addContractToRootIssueUrl({
	contractName,
	contractAddress,
	ownerAddress,
	requesterAddress,
	requesterGithub,
	justification,
}: {
	contractName: string
	contractAddress: string
	ownerAddress: string
	requesterAddress: string
	requesterGithub?: string
	justification: string
}): string {
	const command = [
		"stellar registry register-contract",
		`  --contract-name "${contractName}"`,
		`  --contract-address "${contractAddress}"`,
		`  --owner "${ownerAddress}"`,
		"  --network mainnet",
		"  --source <your-key>",
	].join(" \\\n")

	const params = new URLSearchParams({
		template: "add-contract-to-root-registry.yml",
		title: `Add contract to root registry: ${contractName}`,
		contract_name: contractName,
		contract_address: contractAddress,
		owner_address: ownerAddress,
		requester_address: requesterAddress,
		justification,
		// Issue Forms render a fenced code block field as-is, so the runnable
		// command goes straight into `command` rather than being re-embedded
		// by hand into a free-text body.
		command,
	})
	if (requesterGithub) params.set("requester_github", requesterGithub)

	return `https://github.com/${GOV_REPO}/issues/new?${params.toString()}`
}
