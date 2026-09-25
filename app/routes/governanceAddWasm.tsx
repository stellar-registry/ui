import { type Route } from "./+types/governanceAddWasm"
import {
	type BuildIssueUrl,
	type BuildProposal,
	GovernanceOperationPage,
} from "~/components/governance-proposal-form"
import { getWasm } from "~/lib/api"
import { addWasmToRootIssueUrl } from "~/lib/github-issue"
import { getGovernanceOperation } from "~/lib/governance"
import { buildPublishHashOutcome } from "~/lib/governance-proposal"
import { registryContractId } from "~/lib/network"

const operation = getGovernanceOperation("add-wasm")!

export function meta({}: Route.MetaArgs) {
	return [{ title: `${operation.title} — Stellar Registry` }]
}

// Test if a Wasm name already exists, and throw an error we can surface if so
// Note: If the Wasm exists but hasn't been indexed, this won't work, but is helpful
//       to catch obvious duplicates early.
async function assertWasmNameAvailable(wasmName: string): Promise<void> {
	try {
		await getWasm(wasmName)
	} catch {
		return
	}
	throw new Error(
		`"${wasmName}" already has a published version — the existing author publishes new versions themselves, not through governance.`,
	)
}

const buildProposal: BuildProposal = async (
	values,
	address,
	{ network, rpcUrl, passphrase },
) => {
	const wasmName = values.wasm_name ?? ""
	await assertWasmNameAvailable(wasmName)
	const author = values.author_address || address
	const outcome = await buildPublishHashOutcome({
		rpcUrl,
		networkPassphrase: passphrase,
		registryContractId: registryContractId(network),
		wasmName,
		author,
		wasmHash: values.wasm_hash ?? "",
		version: values.wasm_version ?? "",
	})
	return {
		title: `Add wasm to root registry: ${wasmName}`,
		summary: `Publishes wasm hash \`${values.wasm_hash}\` as \`${wasmName}@${values.wasm_version}\` in the Stellar Registry root registry, authored by \`${author}\`.`,
		outcome,
		details: values.source_repo ? [["Source repo", values.source_repo]] : [],
	}
}

const buildIssueUrl: BuildIssueUrl = (values) =>
	addWasmToRootIssueUrl({
		wasmName: values.wasm_name ?? "",
		wasmVersion: values.wasm_version ?? "",
		wasmHash: values.wasm_hash ?? "",
		authorAddress: values.author_address || values.requester_address || "",
		sourceRepo: values.source_repo || undefined,
		requesterAddress: values.requester_address ?? "",
		requesterGithub: values.requester_github || undefined,
		justification: values.justification ?? "",
	})

export default function GovernanceAddWasm() {
	return (
		<GovernanceOperationPage
			operation={operation}
			buildProposal={buildProposal}
			buildIssueUrl={buildIssueUrl}
		/>
	)
}
