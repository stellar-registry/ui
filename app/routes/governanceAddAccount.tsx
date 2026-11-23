import { type Route } from "./+types/governanceAddAccount"
import {
	type BuildIssueUrl,
	type BuildProposal,
	type ProposalContext,
	GovernanceOperationPage,
} from "~/components/governance-proposal-form"
import { getAccount, getAccountPreauths } from "~/lib/api"
import { addAccountToRootIssueUrl } from "~/lib/github-issue"
import { getGovernanceOperation } from "~/lib/governance"
import { buildRegisterAccountOutcome } from "~/lib/governance-proposal"
import { getNetwork, registryContractId } from "~/lib/network"
import { getRegistryClient } from "~/lib/registry-client"
import { signTransaction } from "~/lib/wallet"

const operation = getGovernanceOperation("add-account")!

export function meta({}: Route.MetaArgs) {
	return [{ title: `${operation.title} — Stellar Registry` }]
}

// Like the add-contract form: only catches names the indexer already knows.
async function assertAccountNameAvailable(accountName: string): Promise<void> {
	try {
		await getAccount(accountName)
	} catch {
		return
	}
	throw new Error(
		`"${accountName}" is already registered in the root registry — pick a different name.`,
	)
}

async function hasLivePreauth(
	accountName: string,
	accountAddress: string,
	owner: string,
): Promise<boolean> {
	try {
		const preauths = await getAccountPreauths({
			channel: "root",
			name: accountName,
			address: accountAddress,
			owner,
		})
		return preauths.some((p) => p.expired !== true)
	} catch {
		return false
	}
}

/**
 * The Tansu manager executes `register_account`, so it can't collect the named
 * account's signature; the account consents in advance instead.
 */
async function preauthorize(
	accountName: string,
	accountAddress: string,
	owner: string,
	{ network, rpcUrl, passphrase }: ProposalContext,
): Promise<void> {
	const client = await getRegistryClient({
		rpcUrl,
		networkPassphrase: passphrase,
		contractId: registryContractId(network),
	})
	client.options.publicKey = accountAddress
	client.options.signTransaction = async (xdr) => ({
		signedTxXdr: await signTransaction(
			xdr,
			accountAddress,
			getNetwork(network),
		),
	})
	try {
		const tx = await client.preauthorize_account({
			account_name: accountName,
			account_address: accountAddress,
			owner,
		})
		const sent = await tx.signAndSend()
		sent.result.unwrap()
	} catch (e) {
		throw new Error(
			`Couldn't preauthorize "${accountName}" for your account: ${e instanceof Error ? e.message : String(e)}`,
		)
	}
}

const buildProposal: BuildProposal = async (values, address, context) => {
	const accountName = values.account_name ?? ""
	const accountAddress = values.account_address || address
	const owner = values.owner_address || address
	await assertAccountNameAvailable(accountName)

	if (!(await hasLivePreauth(accountName, accountAddress, owner))) {
		if (accountAddress !== address) {
			throw new Error(
				`${accountAddress} must consent first: have it run \`stellar registry account preauthorize --account-name ${accountName} --account-address ${accountAddress} --owner ${owner} --network testnet\`, or connect it here instead.`,
			)
		}
		await preauthorize(accountName, accountAddress, owner, context)
	}

	const outcome = await buildRegisterAccountOutcome({
		rpcUrl: context.rpcUrl,
		networkPassphrase: context.passphrase,
		registryContractId: registryContractId(context.network),
		accountName,
		accountAddress,
		owner,
	})
	return {
		title: `Add named account to root registry: ${accountName}`,
		summary: `Registers \`${accountAddress}\` as \`${accountName}\` in the Stellar Registry root registry, owned by \`${owner}\`. The account has preauthorized this name and owner; the preauthorization expires after about 7 days, so the proposal must be finalized before then.`,
		outcome,
	}
}

const buildIssueUrl: BuildIssueUrl = (values) => {
	const requester = values.requester_address || ""
	return addAccountToRootIssueUrl({
		accountName: values.account_name ?? "",
		accountAddress: values.account_address || requester,
		ownerAddress: values.owner_address || requester,
		requesterAddress: requester,
		requesterGithub: values.requester_github || undefined,
		justification: values.justification ?? "",
	})
}

export default function GovernanceAddAccount() {
	return (
		<GovernanceOperationPage
			operation={operation}
			buildProposal={buildProposal}
			buildIssueUrl={buildIssueUrl}
		/>
	)
}
