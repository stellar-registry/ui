import { useMutation, useQuery } from "@tanstack/react-query"
import { useEffect, useState } from "react"
import { data, Outlet, isRouteErrorResponse } from "react-router"
import { type Route } from "./+types/wasmOverview"
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
import { Input } from "~/components/input"
import { MetadataSection } from "~/components/metadata-section"
import { UsageSection } from "~/components/usage-section"
import { getWasm } from "~/lib/api"
import { type DeployResult, deployFromWasm } from "~/lib/deploy"
import { networkPassphrase, registryContractId } from "~/lib/network"
import { deploySpecQueryOptions, registriesQueryOptions } from "~/lib/queries"
import {
	type SupportedSpecType,
	isSupportedSpecType,
	specTypeLabel,
} from "~/lib/scval"
import { type FunctionInput } from "~/lib/types"
import { getFullName, isLatestWasm } from "~/lib/util"
import { connectWallet, restoreAddress, signTransaction } from "~/lib/wallet"
import { useRootData } from "~/root"

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
		throw data("WASM not found", { status: 404 })
	}
}

export function meta({ loaderData }: Route.MetaArgs) {
	if (!loaderData) return [{ title: "WASM Not Found" }]
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
	const passphrase = networkPassphrase(network)

	const [open, setOpen] = useState(false)
	const [address, setAddress] = useState<string>()
	const [connecting, setConnecting] = useState(false)
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
		void restoreAddress(passphrase).then((restored) => {
			if (restored) setAddress(restored)
		})
	}, [open, passphrase])

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
			return deployFromWasm({
				rpcUrl,
				networkPassphrase: passphrase,
				registryContractId: targetContractId,
				wasmName,
				wasmVersion,
				constructorArgs: hasArgs
					? inputs.map((input) => ({
							name: input.name,
							type: input.type as SupportedSpecType,
							rawValue: values[input.name] ?? "",
						}))
					: undefined,
				deployerAddress: address,
				signTransaction: (xdr) => signTransaction(xdr, address, passphrase),
			})
		},
		onSuccess: setResult,
	})

	async function handleConnect() {
		setConnecting(true)
		setConnectError(undefined)
		try {
			setAddress(await connectWallet(passphrase))
		} catch (e) {
			const message = e instanceof Error ? e.message : String(e)
			// The user closing the wallet picker isn't a real error.
			if (!message.includes("closed the modal")) setConnectError(message)
		} finally {
			setConnecting(false)
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
							<Button
								onClick={() => deployMutation.mutate()}
								disabled={deployMutation.isPending || !canSubmit}
							>
								{deployMutation.isPending ? "Deploying…" : "Deploy"}
							</Button>
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
				<h1 className={styles.title}>{fullName}</h1>
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
							Testnet data — this WASM may not exist on mainnet.
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
