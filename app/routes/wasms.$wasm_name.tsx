import { useQuery } from "@tanstack/react-query"
import { data, useRouteLoaderData } from "react-router"

import { type Route } from "./+types/wasms.$wasm_name"
import styles from "./wasms.$wasm_name.module.css"
import { Badge } from "~/components/badge"
import { getWasm } from "~/lib/api"
import { wasmQueryOptions } from "~/lib/queries"
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

export default function WasmDetail({ loaderData }: Route.ComponentProps) {
	const { wasm } = loaderData
	const { stellarExpertURL } = useRouteLoaderData<typeof rootLoader>("root")

	const { data: detail } = useQuery({
		...wasmQueryOptions(wasm.wasm_name),
		initialData: wasm,
	})

	const createdAt = new Date(detail.created_at).toLocaleString()

	return (
		<main className={styles.main}>
			<div className={styles.titleRow}>
				<h1 className={styles.title}>{detail.wasm_name}</h1>
				<Badge variant="secondary">{detail.version}</Badge>
			</div>

			<div className={styles.layout}>
				<div className={styles.fields}>
					<div className={styles.field}>
						<p className={styles.fieldLabel}>WASM Hash</p>
						<a
							href={`${stellarExpertURL}/contract/${detail.wasm_hash}`}
							target="_blank"
							rel="noopener noreferrer"
							className={styles.fieldLink}
						>
							{detail.wasm_hash}
						</a>
					</div>

					<div className={styles.field}>
						<p className={styles.fieldLabel}>Author</p>
						<a
							href={`${stellarExpertURL}/account/${detail.author}`}
							target="_blank"
							rel="noopener noreferrer"
							className={styles.fieldLink}
						>
							{detail.author}
						</a>
					</div>

					<div className={styles.field}>
						<p className={styles.fieldLabel}>Version</p>
						<p className={styles.fieldValue}>{detail.version}</p>
					</div>

					<div className={styles.field}>
						<p className={styles.fieldLabel}>Published</p>
						<p className={styles.fieldValue}>{createdAt}</p>
					</div>

					<div className={styles.field}>
						<p className={styles.fieldLabel}>Ledger</p>
						<p className={styles.fieldValue}>
							{detail.ledger_sequence.toLocaleString()}
						</p>
					</div>

					<div className={styles.field}>
						<p className={styles.fieldLabel}>Transaction</p>
						<a
							href={`${stellarExpertURL}/tx/${detail.transaction_hash}`}
							target="_blank"
							rel="noopener noreferrer"
							className={styles.fieldLink}
						>
							{detail.transaction_hash}
						</a>
					</div>
				</div>

				<aside className={styles.sidebar}>
					<div className={styles.sidebarPanel}>
						<a
							href={`${stellarExpertURL}/contract/${detail.wasm_hash}`}
							target="_blank"
							rel="noopener noreferrer"
							className={styles.sidebarLink}
						>
							<span>View on Stellar Expert</span>
							<span className={styles.sidebarLinkArrow}>↗</span>
						</a>
						<a
							href={`${stellarExpertURL}/account/${detail.author}`}
							target="_blank"
							rel="noopener noreferrer"
							className={styles.sidebarLink}
						>
							<span>View Author</span>
							<span className={styles.sidebarLinkArrow}>↗</span>
						</a>
					</div>
				</aside>
			</div>
		</main>
	)
}
