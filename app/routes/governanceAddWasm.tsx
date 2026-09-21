import {
	type BuildIssueUrl,
	type BuildProposal,
	GovernanceOperationPage,
} from "~/components/governance-proposal-form"
import { addWasmToRootIssueUrl } from "~/lib/github-issue"
import { getGovernanceOperation } from "~/lib/governance"
import { buildPublishHashOutcome } from "~/lib/governance-proposal"
import { registryContractId } from "~/lib/network"

const operation = getGovernanceOperation("add-wasm")!

const buildProposal: BuildProposal = async (
	values,
	address,
	{ network, rpcUrl, passphrase },
) => {
	const author = values.author_address || address
	const outcome = await buildPublishHashOutcome({
		rpcUrl,
		networkPassphrase: passphrase,
		registryContractId: registryContractId(network),
		wasmName: values.wasm_name ?? "",
		author,
		wasmHash: values.wasm_hash ?? "",
		version: values.wasm_version ?? "",
	})
	return {
		title: `Add wasm to root registry: ${values.wasm_name ?? ""}`,
		summary: `Publishes wasm hash \`${values.wasm_hash}\` as \`${values.wasm_name}@${values.wasm_version}\` in the Stellar Registry root registry, authored by \`${author}\`.`,
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
