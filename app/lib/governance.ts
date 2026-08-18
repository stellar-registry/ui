// Governance proposal forms.
//
// Tansu doesn't yet have a UI for the specific proposals Stellar Registry
// needs, so these forms fill the gap for a handful of standard governance
// operations. Eventually a submission will open a GitHub issue that gets
// turned into a Tansu proposal — for now, submission is mocked (see
// `submitGovernanceProposal` below), so field names are chosen to match the
// real `stellar-registry-cli` args (`register_contract`,
// `update_contract_owner`, `publish`) that a real backend/issue template
// will eventually need.

export type GovernanceFieldType = "text" | "textarea"

export interface GovernanceField {
	name: string
	label: string
	type: GovernanceFieldType
	required: boolean
	placeholder?: string
	/** Returns an error message for an invalid non-empty value, or undefined if valid. */
	validate?: (value: string) => string | undefined
}

function validateStellarAddress(allowedPrefixes: Array<"G" | "C">) {
	return (value: string): string | undefined => {
		if (!allowedPrefixes.some((prefix) => value.startsWith(prefix))) {
			return `Must start with ${allowedPrefixes.join(" or ")}`
		}
		if (value.length !== 56) {
			return "Stellar addresses are 56 characters long"
		}
		return undefined
	}
}

function validateSemver(value: string): string | undefined {
	if (!/^\d+\.\d+\.\d+/.test(value)) {
		return "Use a semantic version, e.g. 1.0.0"
	}
	return undefined
}

function validateWasmHash(value: string): string | undefined {
	if (!/^[0-9a-fA-F]{64}$/.test(value)) {
		return "Should be a 64-character hex string"
	}
	return undefined
}

function validateName(value: string): string | undefined {
	if (!/^[a-z0-9][a-z0-9-]*(\/[a-z0-9][a-z0-9-]*)?$/.test(value)) {
		return "Use lowercase letters, numbers, and hyphens (optionally channel/name)"
	}
	return undefined
}

const requesterAddressField: GovernanceField = {
	name: "requester_address",
	label: "Your Stellar address",
	type: "text",
	required: true,
	placeholder: "GABCD…",
	validate: validateStellarAddress(["G"]),
}

const requesterGithubField: GovernanceField = {
	name: "requester_github",
	label: "Your GitHub username",
	type: "text",
	required: false,
	placeholder: "octocat",
}

const justificationField: GovernanceField = {
	name: "justification",
	label: "Justification / notes",
	type: "textarea",
	required: true,
	placeholder: "Explain why this change should be made, for reviewers.",
}

export type GovernanceOperationId =
	| "add-wasm"
	| "add-contract"
	| "new-subregistry"
	| "change-wasm-owner"
	| "change-contract-owner"

export interface GovernanceOperation {
	id: GovernanceOperationId
	path: string
	title: string
	description: string
	fields: GovernanceField[]
}

export const GOVERNANCE_OPERATIONS: GovernanceOperation[] = [
	{
		id: "add-wasm",
		path: "/governance/add-wasm",
		title: "Add wasm to root registry",
		description:
			"Promote an already-published Wasm into the root (verified) registry.",
		fields: [
			{
				name: "wasm_name",
				label: "Wasm name",
				type: "text",
				required: true,
				placeholder: "my-contract",
				validate: validateName,
			},
			{
				name: "wasm_version",
				label: "Version",
				type: "text",
				required: true,
				placeholder: "1.0.0",
				validate: validateSemver,
			},
			{
				name: "wasm_hash",
				label: "Wasm hash",
				type: "text",
				required: true,
				placeholder: "64-character hex hash",
				validate: validateWasmHash,
			},
			{
				name: "author_address",
				label: "Author address",
				type: "text",
				required: true,
				placeholder: "GABCD… or CABCD…",
				validate: validateStellarAddress(["G", "C"]),
			},
			{
				name: "source_repo",
				label: "Source repo URL",
				type: "text",
				required: false,
				placeholder: "https://github.com/org/repo",
			},
			requesterAddressField,
			requesterGithubField,
			justificationField,
		],
	},
	{
		id: "add-contract",
		path: "/governance/add-contract",
		title: "Add contract to root registry",
		description: "Register a deployed contract instance in the root registry.",
		fields: [
			{
				name: "contract_name",
				label: "Contract name",
				type: "text",
				required: true,
				placeholder: "my-contract",
				validate: validateName,
			},
			{
				name: "contract_address",
				label: "Contract address",
				type: "text",
				required: true,
				placeholder: "CABCD…",
				validate: validateStellarAddress(["C"]),
			},
			{
				name: "owner_address",
				label: "Owner address",
				type: "text",
				required: false,
				placeholder: "Defaults to your Stellar address",
				validate: validateStellarAddress(["G", "C"]),
			},
			requesterAddressField,
			requesterGithubField,
			justificationField,
		],
	},
	{
		id: "new-subregistry",
		path: "/governance/new-subregistry",
		title: "Create a new subregistry",
		description:
			"Create a new named channel for grouping related Wasms and contracts.",
		fields: [
			{
				name: "channel_name",
				label: "Subregistry / channel name",
				type: "text",
				required: true,
				placeholder: "my-team",
				validate: validateName,
			},
			{
				name: "owner_address",
				label: "Owner / admin address",
				type: "text",
				required: true,
				placeholder: "GABCD… or CABCD…",
				validate: validateStellarAddress(["G", "C"]),
			},
			requesterAddressField,
			requesterGithubField,
			justificationField,
		],
	},
	{
		id: "change-wasm-owner",
		path: "/governance/change-wasm-owner",
		title: "Change wasm owner",
		description: "Transfer ownership of a published Wasm to a new address.",
		fields: [
			{
				name: "wasm_name",
				label: "Wasm name",
				type: "text",
				required: true,
				placeholder: "channel/my-contract",
				validate: validateName,
			},
			{
				name: "new_owner",
				label: "New owner address",
				type: "text",
				required: true,
				placeholder: "GABCD… or CABCD…",
				validate: validateStellarAddress(["G", "C"]),
			},
			requesterAddressField,
			requesterGithubField,
			justificationField,
		],
	},
	{
		id: "change-contract-owner",
		path: "/governance/change-contract-owner",
		title: "Change contract owner",
		description:
			"Transfer ownership of a registered contract to a new address.",
		fields: [
			{
				name: "contract_name",
				label: "Contract name",
				type: "text",
				required: true,
				placeholder: "channel/my-contract",
				validate: validateName,
			},
			{
				name: "new_owner",
				label: "New owner address",
				type: "text",
				required: true,
				placeholder: "GABCD… or CABCD…",
				validate: validateStellarAddress(["G", "C"]),
			},
			requesterAddressField,
			requesterGithubField,
			justificationField,
		],
	},
]

export function getGovernanceOperation(
	id: string,
): GovernanceOperation | undefined {
	return GOVERNANCE_OPERATIONS.find((operation) => operation.id === id)
}

export function validateGovernanceFields(
	operation: GovernanceOperation,
	formData: FormData,
): { values: Record<string, string>; errors: Record<string, string> } {
	const values: Record<string, string> = {}
	const errors: Record<string, string> = {}

	for (const field of operation.fields) {
		const raw = formData.get(field.name)
		const value = typeof raw === "string" ? raw.trim() : ""
		values[field.name] = value

		if (field.required && !value) {
			errors[field.name] = `${field.label} is required`
			continue
		}
		if (value && field.validate) {
			const error = field.validate(value)
			if (error) errors[field.name] = error
		}
	}

	return { values, errors }
}

export interface GovernanceSubmissionResult {
	trackingId: string
	summary: string
}

export type GovernanceActionData =
	| { ok: true; result: GovernanceSubmissionResult }
	| { ok: false; errors: Record<string, string> }

/**
 * MOCK — there is no real backend yet. Once the real flow exists (opening a
 * GitHub issue that becomes a Tansu proposal), replace this with the actual
 * call. For now this just simulates latency and fabricates a result so the
 * form UX (pending/success states) can be built and tested.
 */
export async function submitGovernanceProposal(
	operation: GovernanceOperationId,
	values: Record<string, string>,
): Promise<GovernanceSubmissionResult> {
	await new Promise((resolve) => setTimeout(resolve, 400))
	void values
	return {
		trackingId: `MOCK-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
		summary:
			`This "${operation}" proposal was captured locally — nothing was ` +
			"actually submitted. This form will open a GitHub issue once that " +
			"integration exists.",
	}
}
