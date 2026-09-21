// Tansu (https://tansu.dev) governance constants.
//
// Only testnet is wired to Tansu — mainnet's root registry `manager` is
// still a plain admin key (no DAO gating), so mainnet governance goes
// through a GitHub issue instead (see `app/lib/github-issue.ts`).
//
// IDs below verified live via `stellar contract invoke` on 2026-09-14.

// Imported explicitly: the browser has no global Buffer until a generated client
// module loads and polyfills it.
import { Buffer } from "buffer"

/** The live Tansu DAO contract on testnet. */
export const TANSU_CONTRACT_ID =
	"CBXKUSLQPVF35FYURR5C42BPYA5UOVDXX2ELKIM2CAJMCI6HXG2BHGZA"

/**
 * The testnet root registry's `manager`. `trigger(proposal_id)` executes an
 * Approved proposal's outcome — see `contracts/registry-tansu-manager`.
 */
export const REGISTRY_MANAGER_CONTRACT_ID =
	"CB4CNQJVA4PUQDHGTHNLAICM2A6TBBJBMU5YG6E3XTMWUISHJTC5BJ5Q"

/** Tansu project key for the "stellarregistry" project, as hex. */
export const PROJECT_KEY_HEX =
	"7b5c4d66469990e3a33ad17af41a49cca33a930e2d63e67f3c3331923294e39e"

export function projectKeyBytes(): Buffer {
	// `Buffer.from` silently truncates an odd-length hex string instead of
	// throwing — this constant already lost a trailing char once, producing a
	// wrong-but-valid-looking 31-byte key that failed on-chain with InvalidKey.
	const bytes = Buffer.from(PROJECT_KEY_HEX, "hex")
	if (bytes.length !== 32) {
		throw new Error(
			`PROJECT_KEY_HEX must decode to 32 bytes, got ${bytes.length}`,
		)
	}
	return bytes
}

/**
 * Tansu's `PROPOSAL_COLLATERAL` — a contract constant with no on-chain
 * getter, so this can drift. Shown as an estimate only, never relied on
 * for signing.
 */
export const PROPOSAL_COLLATERAL_XLM = 5

/** Tansu enforces a minimum voting window of 24 hours (`MIN_VOTING_PERIOD`). */
export const MIN_VOTING_PERIOD_HOURS = 24

export const TANSU_PROJECT_NAME = "stellarregistry"

export function tansuGovernanceUrl(proposalId?: number): string {
	const base = `https://testnet.tansu.dev/governance/?name=${TANSU_PROJECT_NAME}`
	return proposalId === undefined ? base : `${base}&proposal_id=${proposalId}`
}
