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

const MAX_NAME_LENGTH = 64

// Mirrors contracts/registry/src/name/normalized.rs's `is_keyword` list —
// canonicalizing to any of these fails on-chain with InvalidName. ('static and
// the redundant post-lowercasing "Self" entry are omitted: neither can ever
// match a name our own shape check below already allows.)
const RESERVED_NAMES = new Set([
	"as",
	"break",
	"const",
	"continue",
	"crate",
	"else",
	"enum",
	"extern",
	"false",
	"fn",
	"for",
	"if",
	"impl",
	"in",
	"let",
	"loop",
	"match",
	"mod",
	"move",
	"mut",
	"pub",
	"ref",
	"return",
	"self",
	"static",
	"struct",
	"super",
	"trait",
	"true",
	"type",
	"unsafe",
	"use",
	"where",
	"while",
	"async",
	"await",
	"dyn",
	"abstract",
	"become",
	"box",
	"do",
	"final",
	"macro",
	"override",
	"priv",
	"typeof",
	"unsized",
	"virtual",
	"yield",
	"try",
	"gen",
	"macro_rules",
	"union",
	"nul",
])

/**
 * One `NormalizedName` segment — mirrors
 * contracts/registry/src/name/normalized.rs's length/shape/keyword checks
 * exactly, so a name that passes here can't fail on-chain with InvalidName
 * after a multi-day Tansu vote.
 */
function validateNameSegment(value: string): string | undefined {
	if (value.length > MAX_NAME_LENGTH) {
		return `Must be ${MAX_NAME_LENGTH} characters or fewer`
	}
	if (!/^[a-z][a-z0-9-]*$/.test(value)) {
		return "Use lowercase letters, numbers, and hyphens, starting with a letter"
	}
	if (RESERVED_NAMES.has(value)) {
		return `"${value}" is a reserved name`
	}
	return undefined
}

export function validateName(value: string): string | undefined {
	const segments = value.split("/")
	if (segments.length > 2) {
		return "Use lowercase letters, numbers, and hyphens (optionally channel/name)"
	}
	for (const segment of segments) {
		const error = validateNameSegment(segment)
		if (error) return error
	}
	return undefined
}

/** Root-registry names are bare: `publish_hash` only accepts a NormalizedName. */
function validateBareName(value: string): string | undefined {
	return validateNameSegment(value)
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

export type GovernanceOperationId =
	"add-contract" | "add-wasm" | "new-subregistry"

export interface GovernanceOperation {
	id: GovernanceOperationId
	path: string
	title: string
	/** Short blurb for the governance landing page's list of operations. */
	summary: string
	/** Longer, form-page-only context — may repeat/expand on `summary`. */
	description: string
	fields: GovernanceField[]
	/** Registry contract function this operation's outcome calls. */
	registryFn: "register_contract" | "publish_hash" | "deploy"
}

export const GOVERNANCE_OPERATIONS: GovernanceOperation[] = [
	{
		id: "add-contract",
		path: "/governance/add-contract",
		title: "Add contract to root registry",
		summary: "Register a deployed contract instance in the root registry.",
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
		summary: "Publish a wasm hash under a new name in the root registry.",
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
	{
		id: "new-subregistry",
		path: "/governance/new-subregistry",
		title: "Create a new subregistry",
		summary: "Deploy a new named channel for grouping related Wasms and contracts.",
		description:
			"Deploy a new named channel for grouping related Wasms and contracts. The admin/manager address governs it going forward.",
		registryFn: "deploy",
		fields: [
			{
				name: "channel_name",
				label: "Channel name",
				type: "text",
				required: true,
				placeholder: "my-org",
				validate: validateBareName,
			},
			{
				name: "admin_address",
				label: "Admin / manager address",
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
