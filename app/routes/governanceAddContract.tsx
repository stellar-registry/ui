import {
	type BuildIssueUrl,
	type BuildProposal,
	GovernanceOperationPage,
} from "~/components/governance-proposal-form"
import { getContract } from "~/lib/api"
import { addContractToRootIssueUrl } from "~/lib/github-issue"
import { getGovernanceOperation } from "~/lib/governance"
import { buildRegisterContractOutcome } from "~/lib/governance-proposal"
import { registryContractId } from "~/lib/network"

const operation = getGovernanceOperation("add-contract")!

/**
 * Nothing simulates the actual register_contract call before a proposal goes
 * to a multi-day Tansu vote (see build*Outcome — they only encode args), so
 * this is the only thing standing between submitting and finding out at
 * trigger() time that the name's taken. Fails open: any indexer hiccup means
 * "couldn't confirm it exists," not "block the submission" — the on-chain
 * check at trigger() is still the real, authoritative one either way.
 */
async function assertContractNameAvailable(
	contractName: string,
): Promise<void> {
	try {
		await getContract(contractName)
	} catch {
		return
	}
	throw new Error(
		`"${contractName}" is already registered in the root registry — pick a different name.`,
	)
}

const buildProposal: BuildProposal = async (
	values,
	address,
	{ network, rpcUrl, passphrase },
) => {
	const contractName = values.contract_name ?? ""
	await assertContractNameAvailable(contractName)
	const ownerAddress = values.owner_address || address
	const outcome = await buildRegisterContractOutcome({
		rpcUrl,
		networkPassphrase: passphrase,
		registryContractId: registryContractId(network),
		contractName,
		contractAddress: values.contract_address ?? "",
		owner: ownerAddress,
	})
	return {
		title: `Add contract to root registry: ${contractName}`,
		summary: `Registers \`${values.contract_address}\` as \`${contractName}\` in the Stellar Registry root registry, owned by \`${ownerAddress}\`.`,
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
