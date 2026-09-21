import {
	type BuildIssueUrl,
	type BuildProposal,
	GovernanceOperationPage,
} from "~/components/governance-proposal-form"
import { addContractToRootIssueUrl } from "~/lib/github-issue"
import { getGovernanceOperation } from "~/lib/governance"
import { buildRegisterContractOutcome } from "~/lib/governance-proposal"
import { registryContractId } from "~/lib/network"

const operation = getGovernanceOperation("add-contract")!

const buildProposal: BuildProposal = async (
	values,
	address,
	{ network, rpcUrl, passphrase },
) => {
	const ownerAddress = values.owner_address || address
	const outcome = await buildRegisterContractOutcome({
		rpcUrl,
		networkPassphrase: passphrase,
		registryContractId: registryContractId(network),
		contractName: values.contract_name ?? "",
		contractAddress: values.contract_address ?? "",
		owner: ownerAddress,
	})
	return {
		title: `Add contract to root registry: ${values.contract_name ?? ""}`,
		summary: `Registers \`${values.contract_address}\` as \`${values.contract_name}\` in the Stellar Registry root registry, owned by \`${ownerAddress}\`.`,
		outcome,
	}
}

const buildIssueUrl: BuildIssueUrl = (values) =>
	addContractToRootIssueUrl({
		contractName: values.contract_name ?? "",
		contractAddress: values.contract_address ?? "",
		ownerAddress: values.owner_address || values.requester_address || "",
		requesterAddress: values.requester_address ?? "",
		requesterGithub: values.requester_github || undefined,
		justification: values.justification ?? "",
	})

export default function GovernanceAddContract() {
	return (
		<GovernanceOperationPage
			operation={operation}
			buildProposal={buildProposal}
			buildIssueUrl={buildIssueUrl}
		/>
	)
}
