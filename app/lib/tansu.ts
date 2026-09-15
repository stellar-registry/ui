// Tansu (https://tansu.dev) governance constants.
//
// Only testnet is wired to Tansu today — the live testnet root registry's
// `manager` is already the deployed `registry-tansu-manager` contract, which
// gates root-registry writes (register_contract, deploy, publish) behind a
// Tansu DAO vote. Mainnet's `manager` is still a plain admin key (no DAO
// gating), so mainnet governance goes through a GitHub issue instead — see
// `app/lib/github-issue.ts`. There is nothing to configure here for mainnet.
//
// Verified live via `stellar contract invoke` on 2026-09-14:
//   - Root registry (testnet CAAXJETKPYAATU4HVVQUTE2FFBULNFGZNEOC3MS635U5K3GZLAY2HI4M)
//     .manager() -> CB4CNQJVA4PUQDHGTHNLAICM2A6TBBJBMU5YG6E3XTMWUISHJTC5BJ5Q
//   - That manager's .tansu() -> CBXKUSLQPVF35FYURR5C42BPYA5UOVDXX2ELKIM2CAJMCI6HXG2BHGZA
//   - That manager's .project_key() -> 7b5c4d66469990e3a33ad17af41a49cca33a930e2d63e67f3c3331923294e39e

/** The live Tansu DAO contract on testnet. */
export const TANSU_CONTRACT_ID =
	"CBXKUSLQPVF35FYURR5C42BPYA5UOVDXX2ELKIM2CAJMCI6HXG2BHGZA"

/**
 * The `registry-tansu-manager` contract installed as the testnet root
 * registry's `manager`. Its `trigger(proposal_id)` is what actually executes
 * an approved proposal's outcome on the registry — see
 * `contracts/registry-tansu-manager/src/lib.rs`.
 */
export const REGISTRY_MANAGER_CONTRACT_ID =
	"CB4CNQJVA4PUQDHGTHNLAICM2A6TBBJBMU5YG6E3XTMWUISHJTC5BJ5Q"

/** Tansu project key for the "stellarregistry" project, as hex. */
export const PROJECT_KEY_HEX =
	"7b5c4d66469990e3a33ad17af41a49cca33a930e2d63e67f3c3331923294e39e"

export function projectKeyBytes(): Buffer {
	// Tansu's project_key is a BytesN<32> — `Buffer.from` silently truncates an
	// odd-length hex string instead of throwing (this constant lost a trailing
	// character once already, producing a well-formed-looking 31-byte key that
	// matched no project and failed on-chain with InvalidKey), so check the
	// length explicitly rather than trust the literal.
	const bytes = Buffer.from(PROJECT_KEY_HEX, "hex")
	if (bytes.length !== 32) {
		throw new Error(
			`PROJECT_KEY_HEX must decode to 32 bytes, got ${bytes.length}`,
		)
	}
	return bytes
}

/**
 * `PROPOSAL_COLLATERAL` in `Consulting-Manao/tansu`'s `contract_dao.rs`
 * (`5 * 10_000_000` stroops). Flat per-proposal collateral, refunded to the
 * proposer when the proposal is executed/finalized. There is no on-chain
 * getter for this — it's a contract constant, so this can drift if Tansu
 * changes it; shown to the user as an estimate, not relied on for anything
 * that touches signing.
 */
export const PROPOSAL_COLLATERAL_XLM = 5

/** Tansu enforces a minimum voting window of 24 hours (`MIN_VOTING_PERIOD`). */
export const MIN_VOTING_PERIOD_HOURS = 24

export const TANSU_PROJECT_NAME = "stellarregistry"

export function tansuGovernanceUrl(proposalId?: number): string {
	const base = `https://testnet.tansu.dev/governance/?name=${TANSU_PROJECT_NAME}`
	return proposalId === undefined ? base : `${base}&proposal_id=${proposalId}`
}
