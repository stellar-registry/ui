import { data, Outlet } from "react-router"
import { type Route } from "./+types/wasmOverview"
import styles from "./wasmOverview.module.css"
import { Badge } from "~/components/badge"
import {
	SidebarAlert,
	SidebarLink,
	SidebarPanel,
} from "~/components/detail-sidebar"
import { UsageSection } from "~/components/usage-section"
import { getWasm } from "~/lib/api"
import { getFullName, isLatestWasm } from "~/lib/util"
import { useRootData } from "~/root"

export async function loader({ request, params, context }: Route.LoaderArgs) {
	const { name, version } = params
	// Derive the channel from URL segments between /wasms/ and name.
	// e.g. /wasms/registry → channel=undefined
	// and  /wasms/unverified/registry → channel="unverified"
	const pathname = new URL(request.url).pathname
	const channel = pathname.match(/^\/wasms\/(unverified)\//)?.[1]
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
		throw data("WASM not found", { status: 404 })
	}
}

export function meta({ loaderData }: Route.MetaArgs) {
	if (!loaderData) return [{ title: "WASM Not Found" }]
	return [{ title: `${loaderData.fullName} — Stellar Registry` }]
}

export function buildWasmUsageItems(
	wasmName: string,
	wasmVersion: string,
	pinned: boolean,
) {
	const modName = wasmName.replaceAll("-", "_")
	const importCode = pinned
		? `stellar_registry::import_contract_client!("${modName}@${wasmVersion}");`
		: `stellar_registry::import_contract_client!(${modName});`
	const useClient = `
let client = ${modName}::Client::new(&env, &contract_address);

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
						<SidebarLink
							href={`${stellarExpertUrl}/contract/${wasm.wasm_hash}`}
							external
						>
							View on Stellar Expert
						</SidebarLink>
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
				items={buildWasmUsageItems(fullName, wasm.wasm_version, !!version)}
				description="Use the registered name of this Wasm to create a module for it and start calling its methods."
				footer={
					<p>
						The macro downloads this Wasm at build time and generates a
						type-safe Rust client. Your editor's autocomplete should show all
						available methods as well as their argument and return types.
					</p>
				}
			/>
		</main>
	)
}
