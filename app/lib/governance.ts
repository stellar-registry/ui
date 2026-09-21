// Governance proposal forms — field definitions and validation shared by
// every governance operation's form.
//
// `change-wasm-owner`/`change-contract-owner` are deliberately not here:
// closed as unnecessary (ui#55, ui#56) once wasm authorship gained a
// self-service transfer (`preauthorize_author_transfer`, contracts#34).

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

export function validateStellarAddress(allowedPrefixes: Array<"G" | "C">) {
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

export function validateName(value: string): string | undefined {
	if (!/^[a-z0-9][a-z0-9-]*(\/[a-z0-9][a-z0-9-]*)?$/.test(value)) {
		return "Use lowercase letters, numbers, and hyphens (optionally channel/name)"
	}
	return undefined
}

/** Root-registry names are bare: `publish_hash` only accepts a NormalizedName. */
function validateBareName(value: string): string | undefined {
	if (!/^[a-z0-9][a-z0-9-]*$/.test(value)) {
		return "Use lowercase letters, numbers, and hyphens (no channel prefix)"
	}
	return undefined
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

function validateUrl(value: string): string | undefined {
	return /^https?:\/\//.test(value) ? undefined : "Must start with https://"
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
	placeholder:
		"Who are you, and why should this be trusted in the root registry?",
}

export type GovernanceOperationId = "add-contract" | "add-wasm"

export interface GovernanceOperation {
	id: GovernanceOperationId
	path: string
	title: string
	description: string
	fields: GovernanceField[]
	/** Registry contract function this operation's outcome calls. */
	registryFn: "register_contract" | "publish_hash"
}

export const GOVERNANCE_OPERATIONS: GovernanceOperation[] = [
	{
		id: "add-contract",
		path: "/governance/add-contract",
		title: "Add contract to root registry",
		description: "Register a deployed contract instance in the root registry.",
		registryFn: "register_contract",
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
		id: "add-wasm",
		path: "/governance/add-wasm",
		title: "Add wasm to root registry",
		description:
			"Publish a wasm hash under a new name in the root registry. Only first-time names go through governance — an existing name's author publishes new versions themselves.",
		registryFn: "publish_hash",
		fields: [
			{
				name: "wasm_name",
				label: "Wasm name",
				type: "text",
				required: true,
				placeholder: "my-contract",
				validate: validateBareName,
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
				required: false,
				placeholder: "Defaults to your Stellar address",
				validate: validateStellarAddress(["G", "C"]),
			},
			{
				name: "source_repo",
				label: "Source repo URL",
				type: "text",
				required: false,
				placeholder: "https://github.com/org/repo",
				validate: validateUrl,
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
	values: Record<string, string>,
): Record<string, string> {
	const errors: Record<string, string> = {}

	for (const field of operation.fields) {
		const value = (values[field.name] ?? "").trim()

		if (field.required && !value) {
			errors[field.name] = `${field.label} is required`
			continue
		}
		if (value && field.validate) {
			const error = field.validate(value)
			if (error) errors[field.name] = error
		}
	}

	return errors
}
