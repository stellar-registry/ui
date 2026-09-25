import { type ContractValidation, type WasmMeta } from "./types"

export const SEP58_URL =
	"https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0058.md"

/**
 * One verifier's claim about a build. Kept per-verifier, never merged into an
 * overall status, so that verifiers who disagree are shown disagreeing.
 */
export interface VerifierResult {
	verifier: string
	verifierUrl: string
	status: "verified" | "none"
	source?: { href?: string; label: string }
	path?: string
	package?: string
}

/** `url` only if it's http(s) — meta and verifier fields are user-supplied. */
export function safeHref(url: string | null | undefined) {
	if (!url) return undefined
	try {
		const { protocol } = new URL(url)
		return protocol === "https:" || protocol === "http:" ? url : undefined
	} catch {
		return undefined
	}
}

export function verifiedSourceUrl(validation: ContractValidation) {
	return safeHref(
		[validation.repository, "tree", validation.commit, validation.path]
			.filter(Boolean)
			.join("/"),
	)
}

// Stellar Expert is the only verifier the indexer tracks so far.
export function verifierResults(
	validation: ContractValidation | null,
): VerifierResult[] {
	return [
		{
			verifier: "Stellar Expert",
			verifierUrl: "https://stellar.expert",
			status: validation ? "verified" : "none",
			...(validation && {
				source: {
					href: verifiedSourceUrl(validation),
					label: `${validation.repository.replace(/^https?:\/\//, "")}@${validation.commit.slice(0, 7)}`,
				},
				path: validation.path,
				package: validation.package,
			}),
		},
	]
}

export function hasSep58Meta(meta: WasmMeta | undefined) {
	return !!(
		meta &&
		(meta.bldimg ||
			meta.bldopt?.length ||
			meta.bldarg?.length ||
			meta.source_sha256 ||
			meta.source_uri)
	)
}

function shellQuote(arg: string) {
	return /^[\w@%+=:,./-]+$/.test(arg)
		? arg
		: `'${arg.replaceAll("'", `'\\''`)}'`
}

/** SEP-58 §1: the image's `stellar` entry point, then bldarg, then bldopt. */
export function sep58BuildCommand(meta: WasmMeta) {
	const args = meta.bldarg?.length ? meta.bldarg : ["contract", "build"]
	return ["stellar", ...args, ...(meta.bldopt ?? [])].map(shellQuote).join(" ")
}
