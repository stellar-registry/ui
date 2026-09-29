import { type Route } from "./+types/governanceNewSubregistry"
import {
	type BuildIssueUrl,
	type BuildProposal,
	GovernanceOperationPage,
} from "~/components/governance-proposal-form"
import { newSubregistryIssueUrl } from "~/lib/github-issue"
import { getGovernanceOperation } from "~/lib/governance"
import { buildNewSubregistryOutcome } from "~/lib/governance-proposal"
import { registryContractId } from "~/lib/network"

const operation = getGovernanceOperation("new-subregistry")!

export function meta({}: Route.MetaArgs) {
	return [{ title: `${operation.title} — Stellar Registry` }]
}

const buildProposal: BuildProposal = async (
	values,
	address,
	{ network, rpcUrl, passphrase },
) => {
	const admin = values.admin_address || address
	const outcome = await buildNewSubregistryOutcome({
		rpcUrl,
		networkPassphrase: passphrase,
		registryContractId: registryContractId(network),
		channelName: values.channel_name ?? "",
		admin,
	})
	return {
		title: `Create a new subregistry: ${values.channel_name ?? ""}`,
		summary: `Deploys a new \`${values.channel_name}\` subregistry, administered and managed by \`${admin}\`.`,
		outcome,
	}
}

const buildIssueUrl: BuildIssueUrl = (values) =>
	newSubregistryIssueUrl({
		channelName: values.channel_name ?? "",
		adminAddress: values.admin_address || values.requester_address || "",
		requesterAddress: values.requester_address ?? "",
		requesterGithub: values.requester_github || undefined,
		justification: values.justification ?? "",
	})

export default function GovernanceNewSubregistry() {
	return (
		<GovernanceOperationPage
			operation={operation}
			buildProposal={buildProposal}
			buildIssueUrl={buildIssueUrl}
		/>
	)
}
