// Mainnet has no Tansu gating (plain admin key), so governance there is a
// prefilled `stellar-registry/gov` issue instead of an on-chain proposal.
//
// Template filenames and field ids below must match
// `stellar-registry/gov/.github/ISSUE_TEMPLATE/*.yml` — nothing enforces that
// across repos, and GitHub silently falls back to a blank issue (losing every
// prefilled field) if a template name doesn't match, so keep them in sync by
// hand.

const GOV_REPO = "stellar-registry/gov"
const ADD_CONTRACT_TEMPLATE = "add-contract-to-root-registry.yml"
const ADD_WASM_TEMPLATE = "add-wasm-to-root-registry.yml"

function issueUrl(
	template: string,
	title: string,
	fields: Record<string, string | undefined>,
): string {
	const params = new URLSearchParams({ template, title })
	for (const [name, value] of Object.entries(fields)) {
		if (value) params.set(name, value)
	}
	return `https://github.com/${GOV_REPO}/issues/new?${params.toString()}`
}

/**
 * Issue Forms render a `render: shell` textarea as a code block, so the
 * runnable command goes straight into the `command` field.
 */
function shellCommand(command: string, args: Array<[string, string]>): string {
	return [
		command,
		...args.map(([flag, value]) => `  ${flag} "${value}"`),
		"  --network mainnet",
		"  --source <your-key>",
	].join(" \\\n")
}

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
	return issueUrl(
		ADD_CONTRACT_TEMPLATE,
		`Add contract to root registry: ${contractName}`,
		{
			contract_name: contractName,
			contract_address: contractAddress,
			owner_address: ownerAddress,
			requester_address: requesterAddress,
			requester_github: requesterGithub,
			justification,
			command: shellCommand("stellar registry register-contract", [
				["--contract-name", contractName],
				["--contract-address", contractAddress],
				["--owner", ownerAddress],
			]),
		},
	)
}

export function addWasmToRootIssueUrl({
	wasmName,
	wasmVersion,
	wasmHash,
	authorAddress,
	sourceRepo,
	requesterAddress,
	requesterGithub,
	justification,
}: {
	wasmName: string
	wasmVersion: string
	wasmHash: string
	authorAddress: string
	sourceRepo?: string
	requesterAddress: string
	requesterGithub?: string
	justification: string
}): string {
	return issueUrl(ADD_WASM_TEMPLATE, `Add wasm to root registry: ${wasmName}`, {
		wasm_name: wasmName,
		wasm_version: wasmVersion,
		wasm_hash: wasmHash,
		author_address: authorAddress,
		source_repo: sourceRepo,
		requester_address: requesterAddress,
		requester_github: requesterGithub,
		justification,
		command: shellCommand("stellar registry publish-hash", [
			["--wasm-name", wasmName],
			["--wasm-hash", wasmHash],
			["--version", wasmVersion],
			["--author", authorAddress],
		]),
	})
}
