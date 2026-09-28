import { useMutation } from "@tanstack/react-query"
import { useEffect, useState } from "react"
import styles from "./governance-proposal-form.module.css"
import { Button } from "~/components/button"
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "~/components/card"
import { GovernanceFields } from "~/components/governance-fields"
import { Input } from "~/components/input"
import {
	type GovernanceOperation,
	validateGovernanceFields,
} from "~/lib/governance"
import {
	type OutcomeContract,
	buildOutcomesJson,
	buildProposalMarkdown,
} from "~/lib/governance-proposal"
import { packDirectory, uploadProposalDirectory } from "~/lib/ipfs"
import { getNetwork } from "~/lib/network"
import { getRegistryManagerClient } from "~/lib/registry-manager-client"
import {
	MIN_VOTING_PERIOD_HOURS,
	PROPOSAL_COLLATERAL_XLM,
	REGISTRY_MANAGER_CONTRACT_ID,
	TANSU_CONTRACT_ID,
	projectKeyBytes,
	tansuGovernanceUrl,
} from "~/lib/tansu"
import { getTansuClient } from "~/lib/tansu-client"
import {
	connectWallet,
	disconnectWallet,
	fetchLiveAddress,
	restoreAddress,
	shortAddress,
	signTransaction,
} from "~/lib/wallet"
import { useRootData } from "~/root"

/** Testnet's default proposal live period (issue #51: "2-day default"). */
const VOTING_PERIOD_HOURS = MIN_VOTING_PERIOD_HOURS * 2

type SubmitResult = { proposalId: number }

/** What an operation contributes to a proposal; everything else is shared. */
export interface ProposalDraft {
	title: string
	summary: string
	outcome: OutcomeContract
	/** Extra `label: value` lines for proposal.md (e.g. a source repo). */
	details?: Array<[string, string]>
}

export interface ProposalContext {
	network: string
	rpcUrl: string
	passphrase: string
}

/** Mainnet: the prefilled `stellar-registry/gov` issue URL for these values. */
export type BuildIssueUrl = (values: Record<string, string>) => string

export type BuildProposal = (
	values: Record<string, string>,
	address: string,
	context: ProposalContext,
) => Promise<ProposalDraft>

/**
 * The Tansu testnet flow: build the on-chain outcome + off-chain proposal
 * content, sign the create_proposal transaction, upload it (and the CAR it
 * gates) to `/api/governance/pin`, then send it. See
 * `app/lib/governance-proposal.ts` and `app/lib/ipfs.ts` for why the pieces
 * are ordered this way.
 */
function useSubmitProposalMutation({
	operation,
	buildProposal,
	network,
	rpcUrl,
	stellarNetwork,
	address,
	setAddress,
	values,
	setFieldErrors,
}: {
	operation: GovernanceOperation
	buildProposal: BuildProposal
	network: string
	rpcUrl: string
	stellarNetwork: ReturnType<typeof getNetwork>
	address: string | undefined
	setAddress: (address: string) => void
	values: Record<string, string>
	setFieldErrors: (errors: Record<string, string>) => void
}) {
	const passphrase = stellarNetwork.passphrase

	return useMutation({
		mutationFn: async (): Promise<SubmitResult> => {
			const errors = validateGovernanceFields(operation, values)
			if (Object.keys(errors).length > 0) {
				setFieldErrors(errors)
				throw new Error("Fix the highlighted fields and try again.")
			}
			setFieldErrors({})

			if (!address) throw new Error("Connect a wallet first.")
			const liveAddress = await fetchLiveAddress(stellarNetwork)
			if (liveAddress !== address) {
				setAddress(liveAddress)
				throw new Error(
					"Your connected wallet account changed. Click submit again to continue with the new account.",
				)
			}

			const { title, summary, outcome, details } = await buildProposal(
				values,
				address,
				{ network, rpcUrl, passphrase },
			)
			const proposalMarkdown = buildProposalMarkdown({
				title,
				requesterAddress: values.requester_address ?? "",
				requesterGithub: values.requester_github || undefined,
				justification: values.justification ?? "",
				summary,
				details,
			})
			const outcomesJson = await buildOutcomesJson({
				approved: {
					description: summary,
					outcome,
				},
				rejectedDescription:
					"No changes are made to the registry if this proposal is rejected.",
			})
			const packed = await packDirectory({
				"proposal.md": proposalMarkdown,
				"outcomes.json": outcomesJson,
			})

			const tansuClient = await getTansuClient({
				rpcUrl,
				networkPassphrase: passphrase,
				contractId: TANSU_CONTRACT_ID,
			})
			tansuClient.options.publicKey = address
			tansuClient.options.signTransaction = async (xdr) => ({
				signedTxXdr: await signTransaction(xdr, address, stellarNetwork),
			})

			const votingEndsAt = BigInt(
				Math.floor(Date.now() / 1000) + VOTING_PERIOD_HOURS * 3600,
			)

			let tx
			try {
				tx = await tansuClient.create_proposal({
					proposer: address,
					project_key: projectKeyBytes(),
					title,
					ipfs: packed.cid,
					voting_ends_at: votingEndsAt,
					public_voting: true,
					token_contract: undefined,
					// registry-tansu-manager's `trigger` requires exactly one
					// outcome_contracts entry (see contracts/registry-tansu-manager),
					// so only the approved-branch outcome is set.
					outcome_contracts: [outcome],
				})
			} catch (e) {
				throw new Error(
					`Failed to prepare the proposal transaction: ${e instanceof Error ? e.message : String(e)}`,
				)
			}

			await tx.sign({ signTransaction: tansuClient.options.signTransaction })
			if (!tx.signed) {
				throw new Error("Signing the proposal transaction didn't complete.")
			}
			const signedTxXdr = tx.signed.toEnvelope().toXDR("base64")

			await uploadProposalDirectory({ packed, signedTxXdr })

			let sent
			try {
				sent = await tx.send()
			} catch (e) {
				const message = e instanceof Error ? e.message : String(e)
				if (message.includes("txBadAuth")) {
					throw new Error(
						"The network rejected the transaction's signature (txBadAuth) — this usually means the connected wallet account changed. Disconnect and reconnect your wallet, then try again.",
					)
				}
				throw new Error(`Failed to send the proposal transaction: ${message}`)
			}

			return { proposalId: sent.result }
		},
	})
}

function TestnetProposalForm({
	operation,
	buildProposal,
}: {
	operation: GovernanceOperation
	buildProposal: BuildProposal
}) {
	const { network, rpcUrl } = useRootData()
	const stellarNetwork = getNetwork(network)

	const [address, setAddress] = useState<string>()
	const [connecting, setConnecting] = useState(false)
	const [disconnecting, setDisconnecting] = useState(false)
	const [connectError, setConnectError] = useState<string>()
	const [values, setValues] = useState<Record<string, string>>({})
	const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

	useEffect(() => {
		void restoreAddress(stellarNetwork).then((restored) => {
			if (restored) setAddress(restored)
		})
	}, [stellarNetwork])

	// The proposer is always the connected wallet — keep the field in sync
	// rather than letting it be typed, so it can't drift from who actually
	// signs the transaction.
	useEffect(() => {
		setValues((prev) => ({ ...prev, requester_address: address ?? "" }))
	}, [address])

	async function handleConnect() {
		setConnecting(true)
		setConnectError(undefined)
		try {
			setAddress(await connectWallet(stellarNetwork))
		} catch (e) {
			const message = e instanceof Error ? e.message : String(e)
			if (!message.includes("closed the modal")) setConnectError(message)
		} finally {
			setConnecting(false)
		}
	}

	async function handleDisconnect() {
		setDisconnecting(true)
		try {
			await disconnectWallet(stellarNetwork)
		} finally {
			setAddress(undefined)
			submitMutation.reset()
			setDisconnecting(false)
		}
	}

	const submitMutation = useSubmitProposalMutation({
		operation,
		buildProposal,
		network,
		rpcUrl,
		stellarNetwork,
		address,
		setAddress,
		values,
		setFieldErrors,
	})

	function handleChange(name: string, value: string) {
		setValues((prev) => ({ ...prev, [name]: value }))
	}

	if (submitMutation.isSuccess) {
		const result = submitMutation.data
		return (
			<Card>
				<CardHeader>
					<CardTitle>Proposal submitted</CardTitle>
					<CardDescription>
						Proposal #{result.proposalId} is now live for a{" "}
						{VOTING_PERIOD_HOURS}
						-hour vote.
					</CardDescription>
				</CardHeader>
				<CardContent className={styles.success}>
					<a
						href={tansuGovernanceUrl(result.proposalId)}
						target="_blank"
						rel="noopener noreferrer"
					>
						View and vote on testnet.tansu.dev →
					</a>
					<ProposalFinalizePanel defaultProposalId={result.proposalId} />
				</CardContent>
			</Card>
		)
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>{operation.title}</CardTitle>
				<CardDescription>
					{operation.description} Creates a Tansu proposal — voting runs for ~
					{VOTING_PERIOD_HOURS} hours and requires a {PROPOSAL_COLLATERAL_XLM}
					-XLM collateral from your wallet (refunded once the proposal is
					finalized).
				</CardDescription>
			</CardHeader>
			<CardContent>
				<GovernanceFields
					operation={operation}
					values={values}
					errors={fieldErrors}
					disabled={submitMutation.isPending}
					readOnlyFields={["requester_address"]}
					onChange={handleChange}
				/>
				{submitMutation.isError && (
					<p className={styles.error}>
						{submitMutation.error instanceof Error
							? submitMutation.error.message
							: "Submission failed."}
					</p>
				)}
				{connectError && <p className={styles.error}>{connectError}</p>}
			</CardContent>
			<CardFooter className={styles.footer}>
				{address ? (
					<>
						<span className={styles.connected}>
							<code>{shortAddress(address)}</code>
						</span>
						<Button
							variant="ghost"
							size="sm"
							onClick={() => void handleDisconnect()}
							disabled={submitMutation.isPending || disconnecting}
						>
							Disconnect
						</Button>
						<Button
							onClick={() => submitMutation.mutate()}
							disabled={submitMutation.isPending}
						>
							{submitMutation.isPending ? "Submitting…" : "Submit proposal"}
						</Button>
					</>
				) : (
					<Button onClick={() => void handleConnect()} disabled={connecting}>
						{connecting ? "Connecting…" : "Connect Wallet"}
					</Button>
				)}
			</CardFooter>
		</Card>
	)
}

function useProposalStatusMutation({
	rpcUrl,
	passphrase,
}: {
	rpcUrl: string
	passphrase: string
}) {
	return useMutation({
		mutationFn: async (proposalId: string) => {
			const id = Number(proposalId)
			if (!Number.isInteger(id)) throw new Error("Enter a valid proposal id.")
			const tansuClient = await getTansuClient({
				rpcUrl,
				networkPassphrase: passphrase,
				contractId: TANSU_CONTRACT_ID,
			})
			const { result: proposal } = await tansuClient.get_proposal({
				project_key: projectKeyBytes(),
				proposal_id: id,
			})
			return proposal.status.tag
		},
	})
}

function useTriggerProposalMutation({
	rpcUrl,
	stellarNetwork,
	address,
}: {
	rpcUrl: string
	stellarNetwork: ReturnType<typeof getNetwork>
	address: string | undefined
}) {
	const passphrase = stellarNetwork.passphrase

	return useMutation({
		mutationFn: async (proposalId: string) => {
			const id = Number(proposalId)
			if (!Number.isInteger(id)) throw new Error("Enter a valid proposal id.")
			if (!address) throw new Error("Connect a wallet first.")

			const managerClient = await getRegistryManagerClient({
				rpcUrl,
				networkPassphrase: passphrase,
				contractId: REGISTRY_MANAGER_CONTRACT_ID,
			})
			managerClient.options.publicKey = address
			managerClient.options.signTransaction = async (xdr) => ({
				signedTxXdr: await signTransaction(xdr, address, stellarNetwork),
			})

			const tx = await managerClient.trigger({ proposal_id: id })
			const sent = await tx.signAndSend()
			sent.result.unwrap()
			const txHash =
				sent.getTransactionResponse?.txHash ??
				sent.sendTransactionResponse?.hash
			if (!txHash) {
				throw new Error(
					"Finalized, but couldn't determine the transaction hash.",
				)
			}
			return { txHash }
		},
	})
}

/**
 * Closes the acceptance-criteria loop: `trigger` is permissionless (anyone
 * can call it once a proposal is Approved — see
 * contracts/registry-tansu-manager), so once voting ends, whoever's here can
 * finalize it and link the resulting transaction.
 */
function ProposalFinalizePanel({
	defaultProposalId,
}: {
	defaultProposalId: number
}) {
	const { network, rpcUrl } = useRootData()
	const stellarNetwork = getNetwork(network)
	const passphrase = stellarNetwork.passphrase

	const [proposalId, setProposalId] = useState(String(defaultProposalId))
	const [address, setAddress] = useState<string>()

	useEffect(() => {
		void restoreAddress(stellarNetwork).then((restored) => {
			if (restored) setAddress(restored)
		})
	}, [stellarNetwork])

	const statusMutation = useProposalStatusMutation({ rpcUrl, passphrase })
	const triggerMutation = useTriggerProposalMutation({
		rpcUrl,
		stellarNetwork,
		address,
	})

	async function handleConnect() {
		try {
			setAddress(await connectWallet(stellarNetwork))
		} catch {
			// User closed the wallet picker — nothing to surface.
		}
	}

	return (
		<div className={styles.finalize}>
			<p className={styles.status}>
				Once the vote concludes and the proposal is Approved, anyone can
				finalize it on-chain — it doesn't have to be you.
			</p>
			<div className={styles.finalizeRow}>
				<Input
					value={proposalId}
					onChange={(e) => setProposalId(e.target.value)}
					placeholder="Proposal id"
				/>
				<Button
					variant="outline"
					onClick={() => statusMutation.mutate(proposalId)}
					disabled={statusMutation.isPending}
				>
					{statusMutation.isPending ? "Checking…" : "Check status"}
				</Button>
			</div>
			{statusMutation.data && (
				<p className={styles.status}>Status: {statusMutation.data}</p>
			)}
			{statusMutation.data === "Approved" &&
				(address ? (
					<Button
						onClick={() => triggerMutation.mutate(proposalId)}
						disabled={triggerMutation.isPending}
					>
						{triggerMutation.isPending ? "Finalizing…" : "Finalize (trigger)"}
					</Button>
				) : (
					<Button onClick={() => void handleConnect()}>Connect Wallet</Button>
				))}
			{triggerMutation.isSuccess && (
				<p className={styles.status}>
					Finalized. Transaction hash:{" "}
					<code>{triggerMutation.data.txHash}</code>
				</p>
			)}
			{triggerMutation.isError && (
				<p className={styles.error}>
					{triggerMutation.error instanceof Error
						? triggerMutation.error.message
						: "Finalize failed."}
				</p>
			)}
		</div>
	)
}

function MainnetIssueForm({
	operation,
	buildIssueUrl,
}: {
	operation: GovernanceOperation
	buildIssueUrl: BuildIssueUrl
}) {
	const [values, setValues] = useState<Record<string, string>>({})
	const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

	function handleChange(name: string, value: string) {
		setValues((prev) => ({ ...prev, [name]: value }))
	}

	function handleContinue() {
		const errors = validateGovernanceFields(operation, values)
		setFieldErrors(errors)
		if (Object.keys(errors).length > 0) return

		const url = buildIssueUrl(values)
		window.open(url, "_blank", "noopener,noreferrer")
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>{operation.title}</CardTitle>
				<CardDescription>
					{operation.description} Mainnet has no on-chain DAO gating yet, so
					this opens a prefilled issue in <code>stellar-registry/gov</code> for
					review instead of a Tansu vote.
				</CardDescription>
			</CardHeader>
			<CardContent>
				<GovernanceFields
					operation={operation}
					values={values}
					errors={fieldErrors}
					onChange={handleChange}
				/>
			</CardContent>
			<CardFooter className={styles.footer}>
				<Button onClick={handleContinue}>Continue to GitHub →</Button>
			</CardFooter>
		</Card>
	)
}

export function GovernanceOperationPage({
	operation,
	buildProposal,
	buildIssueUrl,
}: {
	operation: GovernanceOperation
	buildProposal: BuildProposal
	buildIssueUrl: BuildIssueUrl
}) {
	const { network } = useRootData()
	return (
		<main className={styles.page}>
			<div>
				<h1>{operation.title}</h1>
				<p className={styles.networkBanner}>
					{network === "mainnet"
						? "Mainnet: this opens a GitHub issue for review — nothing is submitted on-chain from here."
						: "Testnet: this creates a Tansu DAO proposal, signed with your connected wallet."}
				</p>
			</div>
			{network === "mainnet" ? (
				<MainnetIssueForm operation={operation} buildIssueUrl={buildIssueUrl} />
			) : (
				<TestnetProposalForm
					operation={operation}
					buildProposal={buildProposal}
				/>
			)}
		</main>
	)
}
