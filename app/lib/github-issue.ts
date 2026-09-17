// Mainnet has no Tansu gating (plain admin key), so governance there is a
// prefilled `stellar-registry/gov` issue instead of an on-chain proposal.
//
// Field ids below must match the `id:` of each input/textarea in
// `stellar-registry/gov/.github/ISSUE_TEMPLATE/add-contract-to-root-registry.yml`
// — nothing enforces that across repos, so keep them in sync by hand.

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
