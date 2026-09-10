import { data, Outlet, isRouteErrorResponse } from "react-router"
import { type Route } from "./+types/wasmOverview"
import "~/lib/buffer-polyfill"
import styles from "./wasmOverview.module.css"
import { Badge } from "~/components/badge"
import { DeployWasmDialog } from "~/components/deployWasmDialog"
import {
	SidebarAlert,
	SidebarLink,
	SidebarItem,
	SidebarPanel,
} from "~/components/detail-sidebar"
import { IconWasm } from "~/components/icon-wasm"
import { MetadataSection } from "~/components/metadata-section"
import { UsageSection } from "~/components/usage-section"
import { getWasm } from "~/lib/api"
import { getFullName, isLatestWasm } from "~/lib/util"
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
		throw data("Wasm not found", { status: 404 })
	}
}

export function meta({ loaderData }: Route.MetaArgs) {
	if (!loaderData) return [{ title: "Wasm Not Found" }]
	return [{ title: `${loaderData.fullName} — Stellar Registry` }]
}

export function buildWasmUsageItems(wasmName: string, wasmVersion?: string) {
	const fullName = wasmName.replaceAll("-", "_")
	const modName = fullName.split("/").at(-1)
	const importCode = `stellar_registry::import_contract_client!("${fullName}${wasmVersion ? `@v${wasmVersion}` : ""}");`
	const useClient = `
let addr = soroban_sdk::Address::from_str(
    &env,
    "[YOUR CONTRACT ID]",
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

export default function WasmOverview({ loaderData }: Route.ComponentProps) {
	const { wasm, fullName, version } = loaderData
	const { network, stellarExpertUrl } = useRootData()
	const displayVersion = version ?? wasm.wasm_version
	const validation = wasm.verified
	const verifiedSourceUrl = validation
		? [validation.repository, "tree", validation.commit, validation.path]
				.filter(Boolean)
				.join("/")
		: undefined

	return (
		<main className={styles.main}>
			<div className={styles.titleRow}>
				<h1 className={styles.title}>
					<IconWasm />
					{fullName}
				</h1>
				<Badge variant="secondary">{displayVersion}</Badge>
				{validation && <Badge variant="secondary">Verified Build</Badge>}
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
						{verifiedSourceUrl && (
							<SidebarLink href={verifiedSourceUrl} external>
								View Verified Source
							</SidebarLink>
						)}
						<SidebarLink
							href={`${stellarExpertUrl}/account/${wasm.author}`}
							external
						>
							View Author
						</SidebarLink>
						<SidebarItem icon="…">
							<DeployWasmDialog
								fullName={fullName}
								wasmName={wasm.wasm_name}
								channel={wasm.channel}
								wasmVersion={wasm.wasm_version}
								wasmHash={wasm.wasm_hash}
							/>
						</SidebarItem>
					</SidebarPanel>
				</aside>
			</div>
			<UsageSection
				items={buildWasmUsageItems(fullName, wasm.wasm_version)}
				description="Use the registered name of this Wasm to create a module for it and start calling its methods."
				footer={
					<>
						<p style={{ marginBottom: "1em" }}>
							The macro downloads this Wasm at build time and generates a
							type-safe Rust client. Your editor's autocomplete should show all
							available methods as well as their argument and return types.
						</p>
						<p className="videoWrapper">
							<iframe
								src="https://www.youtube-nocookie.com/embed/xAlWmJOdMSQ?si=n2yYDkKbyqTAhiNP&start=345"
								title="Stellar Registry Full Walk-Through"
								allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
								referrerPolicy="strict-origin-when-cross-origin"
								allowFullScreen
							></iframe>
						</p>
					</>
				}
			/>
			{wasm.meta?.source_repo && (
				<MetadataSection sourceRepoUrl={wasm.meta.source_repo} />
			)}
		</main>
	)
}
