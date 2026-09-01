import { useMutation, useQuery } from "@tanstack/react-query"
import { useEffect, useState } from "react"
import { data, Outlet, isRouteErrorResponse } from "react-router"
import { type Route } from "./+types/wasmOverview"
import "~/lib/buffer-polyfill"
import styles from "./wasmOverview.module.css"
import { Badge } from "~/components/badge"
import { Button } from "~/components/button"
import {
	SidebarAlert,
	SidebarLink,
	SidebarPanel,
} from "~/components/detail-sidebar"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "~/components/dialog"
import { IconWasm } from "~/components/icon-wasm"
import { Input } from "~/components/input"
import { MetadataSection } from "~/components/metadata-section"
import { UsageSection } from "~/components/usage-section"
import { getWasm } from "~/lib/api"
import { getNetwork, registryContractId } from "~/lib/network"
import { deploySpecQueryOptions, registriesQueryOptions } from "~/lib/queries"
import { getRegistryClient } from "~/lib/registry-client"
import {
	type SupportedSpecType,
	isSupportedSpecType,
	parseArgValue,
	specTypeLabel,
} from "~/lib/scval"
import { type FunctionInput } from "~/lib/types"
import { getFullName, isLatestWasm } from "~/lib/util"
import {
	connectWallet,
	disconnectWallet,
	fetchLiveAddress,
	restoreAddress,
	signTransaction,
} from "~/lib/wallet"
import { useRootData } from "~/root"

type DeployResult = { contractId: string }

export async function loader({ params, context }: Route.LoaderArgs) {
	const { name, version, channel } = params
	try {
		const wasm = await getWasm(
			name,
			channel,
			version,
			context.cloudflare.env.REGISTRY_API_URL,
		)
		return { wasm, name, channel, version, fullName: getFullName(wasm) }
	} catch (e) {
		console.error(e)
		if (isRouteErrorResponse(e) && e.status === 500) {
			throw e
		}
		throw data("Wasm not found", { status: 404 })
	}
}

export function meta({ loaderData }: Route.MetaArgs) {
	if (!loaderData) return [{ title: "Wasm Not Found" }]
	return [{ title: `${loaderData.fullName} — Stellar Registry` }]
}

export function buildWasmUsageItems(
	wasmName: string,
	wasmVersion?: string,
	contractId?: string,
) {
	const fullName = wasmName.replaceAll("-", "_")
	const modName = fullName.split("/").at(-1)
	const importCode = `stellar_registry::import_contract_client!("${fullName}${wasmVersion ? `@v${wasmVersion}` : ""}");`
	const useClient = `
let addr = soroban_sdk::Address::from_str(
    &env,
    "${contractId || "[YOUR CONTRACT ID]"}",
);
let client = ${modName}::Client::new(&env, &addr);

// 🎉 That's it! Start calling ${modName}'s methods:
let result = client.method_name(&arg);
`
	return [
		{
			label: "Import Wasm",
			lang: "rust",
			code: importCode,
		},
		{
			label: "Instantiate Client",
			lang: "rust",
			code: useClient,
		},
	]
}

function truncateAddress(address: string): string {
	return `${address.slice(0, 4)}…${address.slice(-4)}`
}

function placeholderForType(type: SupportedSpecType) {
	switch (type) {
		case "address":
			return "G... or C..."
		case "bytes":
			return "hex, e.g. 1a2b3c…"
		case "string":
		case "symbol":
			return "value"
		default:
			return "0"
	}
}

function ConstructorField({
	input,
	value,
	onChange,
}: {
	input: FunctionInput
	value: string
	onChange: (value: string) => void
}) {
	const type = input.type as SupportedSpecType

	if (type === "bool") {
		return (
			<label className={styles.deployField}>
				<span>{input.name}</span>
				<input
					type="checkbox"
					checked={value === "true"}
					onChange={(e) => onChange(e.target.checked ? "true" : "false")}
				/>
			</label>
		)
	}

	return (
		<label className={styles.deployField}>
			<span>
				{input.name} <code className={styles.deployFieldType}>{type}</code>
			</span>
			<Input
				value={value}
				onChange={(e) => onChange(e.target.value)}
				placeholder={placeholderForType(type)}
				required
			/>
		</label>
	)
}

function DeployWasmDialog({
	fullName,
	wasmName,
	channel,
	wasmVersion,
	wasmHash,
}: {
	/** Channel-prefixed, for display only (e.g. dialog title). */
	fullName: string
	/** Bare name — the only form the Registry contract's NormalizedName accepts. */
	wasmName: string
	channel?: string
	wasmVersion?: string
	wasmHash: string
}) {
	const { network, rpcUrl, stellarExpertUrl } = useRootData()
	const stellarNetwork = getNetwork(network)
	const passphrase = stellarNetwork.passphrase

	const [open, setOpen] = useState(false)
	const [address, setAddress] = useState<string>()
	const [connecting, setConnecting] = useState(false)
	const [disconnecting, setDisconnecting] = useState(false)
	const [connectError, setConnectError] = useState<string>()
	const [values, setValues] = useState<Record<string, string>>({})
	const [result, setResult] = useState<DeployResult>()
	const [copied, setCopied] = useState(false)

	const {
		data: spec,
		isLoading: specLoading,
		isError: specError,
	} = useQuery({ ...deploySpecQueryOptions(wasmHash), enabled: open })

	// `deploy_unnamed` only deploys wasms published on whatever contract it's
	// called on — a channeled wasm (e.g. "oz") lives on its own subregistry
	// contract, not the root registry, so we have to resolve which one.
	const isRootChannel = !channel || channel === "root"
	const { data: registries, isLoading: registriesLoading } = useQuery({
		...registriesQueryOptions(),
		enabled: open && !isRootChannel,
	})
	const targetContractId = isRootChannel
		? registryContractId(network)
		: registries?.find((r) => r.channel === channel)?.contract_id
	const isResolvingTarget = !isRootChannel && registriesLoading
	const targetUnresolved =
		!isRootChannel && !registriesLoading && !targetContractId

	useEffect(() => {
		if (!open) return
		void restoreAddress(stellarNetwork).then((restored) => {
			if (restored) setAddress(restored)
		})
	}, [open, stellarNetwork])

	useEffect(() => {
		if (!copied) return
		const id = setTimeout(() => setCopied(false), 2000)
		return () => clearTimeout(id)
	}, [copied])

	const inputs = spec?.__constructor?.inputs ?? []
	const unsupported = inputs.filter((input) => !isSupportedSpecType(input.type))
	const isBlocked = unsupported.length > 0
	const hasArgs = inputs.length > 0 && !isBlocked

	const deployMutation = useMutation({
		mutationFn: async () => {
			if (!address) throw new Error("Connect a wallet first.")
			if (!targetContractId) {
				throw new Error(
					`Couldn't resolve the "${channel}" subregistry's contract.`,
				)
			}

			// The user can switch accounts in their wallet extension without our
			// UI knowing — re-verify against its live state right before we build
			// a transaction whose auth is pinned to `address`, rather than risk a
			// mismatched signature reaching the network as a bare txBadAuth.
			const liveAddress = await fetchLiveAddress(stellarNetwork)
			if (liveAddress !== address) {
				setAddress(liveAddress)
				throw new Error(
					"Your connected wallet account changed. Click Deploy again to continue with the new account.",
				)
			}

			const { nativeToScVal } = await import("@stellar/stellar-sdk")
			const client = await getRegistryClient({
				rpcUrl,
				networkPassphrase: passphrase,
				contractId: targetContractId,
			})
			// registry-client's ClientOptions expects the Freighter-shaped signer
			// (xdr, opts) => Promise<{ signedTxXdr }>; wallet.ts's signTransaction is
			// the simpler (xdr) => Promise<string> shape used throughout the deploy
			// dialog, so adapt it here rather than changing that call site.
			client.options.publicKey = address
			client.options.signTransaction = async (xdr) => ({
				signedTxXdr: await signTransaction(xdr, address, stellarNetwork),
			})

			// `init` is `Option<Array<any>>` on the generated client — an already
			// -built ScVal per arg, not a native value. deploy_unnamed just
			// forwards it as an opaque Vec<Val> to whatever wasm is being
			// deployed, so (unlike a typed contract.Client.deploy call) the
			// registry contract's own spec has no idea what types that wasm's
			// constructor expects; only `spec.__constructor.inputs` (fetched
			// above) knows that, so we still have to convert each arg by hand.
			const init = hasArgs
				? inputs.map((input) => {
						const type = input.type as SupportedSpecType
						const value = parseArgValue(type, values[input.name] ?? "")
						// "bool" isn't a valid nativeToScVal type hint — a JS boolean
						// converts to scvBool unambiguously without one.
						return type === "bool"
							? nativeToScVal(value)
							: nativeToScVal(value, { type })
					})
				: undefined

			const salt = crypto.getRandomValues(new Uint8Array(32))

			let tx
			try {
				tx = await client.deploy_unnamed({
					wasm_name: wasmName,
					version: wasmVersion,
					init,
					salt: Buffer.from(salt),
					deployer: address,
				})
			} catch (e) {
				throw new Error(
					`Failed to prepare the deploy transaction: ${e instanceof Error ? e.message : String(e)}`,
				)
			}

			let sent
			try {
				sent = await tx.signAndSend()
			} catch (e) {
				const message = e instanceof Error ? e.message : String(e)
				// txBadAuth almost always means the connected wallet's account
				// changed (in the extension, out of band) between building and
				// submitting the transaction — surface that instead of the raw
				// RPC failure JSON.
				if (message.includes("txBadAuth")) {
					throw new Error(
						"The network rejected the transaction's signature (txBadAuth) — this usually means the connected wallet account changed. Disconnect and reconnect your wallet, then try deploying again.",
					)
				}
				throw new Error(`Failed to send the deploy transaction: ${message}`)
			}
			// `result` is a Rust-style Result<Address, Error> — unwrap() throws
			// the contract's own error message (e.g. "NoSuchWasmPublished") on
			// failure.
			const { result } = sent
			return { contractId: result.unwrap() } satisfies DeployResult
		},
		onSuccess: setResult,
	})

	async function handleConnect() {
		setConnecting(true)
		setConnectError(undefined)
		try {
			setAddress(await connectWallet(stellarNetwork))
		} catch (e) {
			const message = e instanceof Error ? e.message : String(e)
			// The user closing the wallet picker isn't a real error.
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
			setConnectError(undefined)
			deployMutation.reset()
			setDisconnecting(false)
		}
	}

	function handleOpenChange(next: boolean) {
		setOpen(next)
		if (!next) {
			setValues({})
			setResult(undefined)
			setConnectError(undefined)
			deployMutation.reset()
		}
	}

	function copyContractId() {
		if (!result) return
		void navigator.clipboard
			.writeText(result.contractId)
			.then(() => setCopied(true))
	}

	const showFooter =
		!result &&
		!isBlocked &&
		!specLoading &&
		!specError &&
		!isResolvingTarget &&
		!targetUnresolved
	const canSubmit =
		!hasArgs || inputs.every((input) => (values[input.name] ?? "") !== "")

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogTrigger asChild>
				<Button variant="outline">Deploy a contract using this Wasm</Button>
			</DialogTrigger>
			<DialogContent
				// Stellar Wallets Kit renders its wallet picker as its own overlay
				// appended straight to <body>, outside this dialog's DOM subtree.
				// Radix treats a pointerdown there as "outside" this dialog and
				// would otherwise close it mid-click (before the wallet picker's
				// own click handler ever fires) — so this dialog only closes via
				// its explicit close button or Escape.
				onPointerDownOutside={(e) => e.preventDefault()}
				onInteractOutside={(e) => e.preventDefault()}
			>
				<DialogHeader>
					<DialogTitle>Deploy {fullName}</DialogTitle>
					<DialogDescription>
						Calls <code>deploy_unnamed</code> on the Registry contract to deploy
						a new instance of this Wasm.
					</DialogDescription>
				</DialogHeader>

				{result ? (
					<div className={styles.deploySuccess}>
						<p>Deployed successfully.</p>
						<div className={styles.deployContractId}>
							<code>{result.contractId}</code>
							<Button variant="ghost" size="sm" onClick={copyContractId}>
								{copied ? "Copied!" : "Copy"}
							</Button>
						</div>
						<a
							href={`${stellarExpertUrl}/contract/${result.contractId}`}
							target="_blank"
							rel="noopener noreferrer"
						>
							View on Stellar Expert →
						</a>
					</div>
				) : specLoading ? (
					<p>Loading deploy info…</p>
				) : specError ? (
					<p className={styles.deployError}>
						Couldn&apos;t load deploy info for this Wasm. Try again later.
					</p>
				) : isResolvingTarget ? (
					<p>Resolving the &quot;{channel}&quot; subregistry…</p>
				) : targetUnresolved ? (
					<p className={styles.deployError}>
						Couldn&apos;t resolve the &quot;{channel}&quot; subregistry&apos;s
						contract. Try again later.
					</p>
				) : isBlocked ? (
					<p className={styles.deployError}>
						This Wasm&apos;s constructor takes argument type
						{unsupported.length > 1 ? "s" : ""} the deploy UI doesn&apos;t
						support yet:{" "}
						{unsupported
							.map((input) => `${input.name} (${specTypeLabel(input.type)})`)
							.join(", ")}
						.
					</p>
				) : (
					<>
						{hasArgs && (
							<div className={styles.deployFields}>
								{inputs.map((input) => (
									<ConstructorField
										key={input.name}
										input={input}
										value={values[input.name] ?? ""}
										onChange={(value) =>
											setValues((prev) => ({ ...prev, [input.name]: value }))
										}
									/>
								))}
							</div>
						)}
						{deployMutation.isError && (
							<p className={styles.deployError}>
								{deployMutation.error instanceof Error
									? deployMutation.error.message
									: "Deploy failed."}
							</p>
						)}
						{connectError && (
							<p className={styles.deployError}>{connectError}</p>
						)}
					</>
				)}

				{showFooter && (
					<DialogFooter>
						{address ? (
							<>
								<span className={styles.deployConnectedAs}>
									<code>{truncateAddress(address)}</code>
								</span>
								<Button
									variant="ghost"
									size="sm"
									onClick={() => void handleDisconnect()}
									disabled={deployMutation.isPending || disconnecting}
								>
									Disconnect
								</Button>
								<Button
									onClick={() => deployMutation.mutate()}
									disabled={deployMutation.isPending || !canSubmit}
								>
									{deployMutation.isPending ? "Deploying…" : "Deploy"}
								</Button>
							</>
						) : (
							<Button
								onClick={() => void handleConnect()}
								disabled={connecting}
							>
								{connecting ? "Connecting…" : "Connect Wallet"}
							</Button>
						)}
					</DialogFooter>
				)}
			</DialogContent>
		</Dialog>
	)
}

export default function WasmOverview({ loaderData }: Route.ComponentProps) {
	const { wasm, fullName, version } = loaderData
	const { network, stellarExpertUrl } = useRootData()
	const displayVersion = version ?? wasm.wasm_version

	return (
		<main className={styles.main}>
			<div className={styles.titleRow}>
				<h1 className={styles.title}>
					<IconWasm />
					{fullName}
				</h1>
				<Badge variant="secondary">{displayVersion}</Badge>
			</div>

			<div className={styles.layout}>
				<Outlet context={loaderData} />

				<aside className={styles.sidebar}>
					{network === "testnet" && (
						<SidebarAlert
							href="https://stellar.rgstry.xyz"
							linkText="Switch to Mainnet →"
						>
							Testnet data — this Wasm may not exist on mainnet.
						</SidebarAlert>
					)}
					<SidebarPanel>
						{version && !isLatestWasm(wasm) && (
							<SidebarLink href={`/wasms/${fullName}`} data-highlight>
								View Latest Version
							</SidebarLink>
						)}
						<SidebarLink href={`/wasms/${fullName}/versions`}>
							All Versions
						</SidebarLink>
						{wasm.meta?.source_repo && (
							<SidebarLink href={wasm.meta.source_repo} external>
								Source Repository
							</SidebarLink>
						)}
						<SidebarLink
							href={`${stellarExpertUrl}/account/${wasm.author}`}
							external
						>
							View Author
						</SidebarLink>
					</SidebarPanel>
				</aside>
			</div>
			<UsageSection
				items={buildWasmUsageItems(fullName, wasm.wasm_version)}
				description="Use the registered name of this Wasm to create a module for it and start calling its methods."
				footer={
					<p>
						The macro downloads this Wasm at build time and generates a
						type-safe Rust client. Your editor's autocomplete should show all
						available methods as well as their argument and return types.
					</p>
				}
			/>
			<DeployWasmDialog
				fullName={fullName}
				wasmName={wasm.wasm_name}
				channel={wasm.channel}
				wasmVersion={wasm.wasm_version}
				wasmHash={wasm.wasm_hash}
			/>
			{wasm.meta?.source_repo && (
				<MetadataSection sourceRepoUrl={wasm.meta.source_repo} />
			)}
		</main>
	)
}
