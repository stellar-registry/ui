import { data, Outlet, useParams, useRouteLoaderData } from "react-router"

import { type Route } from "./+types/wasms.$wasm_name"
import styles from "./wasms.$wasm_name.module.css"
import { Badge } from "~/components/badge"
import {
	SidebarAlert,
	SidebarLink,
	SidebarPanel,
} from "~/components/detail-sidebar"
import { getWasm } from "~/lib/api"
import { type loader as rootLoader } from "~/root"

export async function loader({ params }: Route.LoaderArgs) {
	try {
		const wasm = await getWasm(params.wasm_name)
		return { wasm }
	} catch {
		throw data("WASM not found", { status: 404 })
	}
}

export function meta({ data: loaderData }: Route.MetaArgs) {
	if (!loaderData) return [{ title: "WASM Not Found" }]
	return [{ title: `${loaderData.wasm.wasm_name} — Stellar Registry` }]
}

export default function WasmLayout({ loaderData }: Route.ComponentProps) {
	const { wasm } = loaderData
	const { network, stellarExpertURL } =
		useRouteLoaderData<typeof rootLoader>("root")
	const params = useParams()
	const displayVersion = params.version ?? wasm.version

	return (
		<main className={styles.main}>
			<div className={styles.titleRow}>
				<h1 className={styles.title}>{wasm.wasm_name}</h1>
				<Badge variant="secondary">{displayVersion}</Badge>
			</div>

			<div className={styles.layout}>
				<Outlet />

				<aside className={styles.sidebar}>
					{network === "testnet" && (
						<SidebarAlert
							href="https://rgstry.xyz"
							linkText="Switch to Mainnet →"
						>
							Testnet data — this WASM may not exist on mainnet.
						</SidebarAlert>
					)}
					<SidebarPanel>
						<SidebarLink href={`/wasms/${wasm.wasm_name}/versions`}>
							All Versions
						</SidebarLink>
						{params.version && (
							<SidebarLink href={`/wasms/${wasm.wasm_name}`}>
								View Latest
							</SidebarLink>
						)}
						<SidebarLink
							href={`${stellarExpertURL}/contract/${wasm.wasm_hash}`}
							external
						>
							View on Stellar Expert
						</SidebarLink>
						<SidebarLink
							href={`${stellarExpertURL}/account/${wasm.author}`}
							external
						>
							View Author
						</SidebarLink>
					</SidebarPanel>
				</aside>
			</div>
		</main>
	)
}
