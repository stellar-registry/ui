import { useQuery } from "@tanstack/react-query"
import { data, useRouteLoaderData } from "react-router"

import { type Route } from "./+types/contracts.$contract_name"
import styles from "./contracts.$contract_name.module.css"
import { Badge } from "~/components/badge"
import { getContract } from "~/lib/api"
import { contractQueryOptions } from "~/lib/queries"
import { type loader as rootLoader } from "~/root"

export async function loader({ params }: Route.LoaderArgs) {
	try {
		const contract = await getContract(params.contract_name)
		return { contract }
	} catch {
		throw data("Contract not found", { status: 404 })
	}
}

export function meta({ data: loaderData }: Route.MetaArgs) {
	if (!loaderData) return [{ title: "Contract Not Found" }]
	return [
		{
			title: `${loaderData.contract.contract_name} — Stellar Registry`,
		},
	]
}

export default function ContractDetail({ loaderData }: Route.ComponentProps) {
	const { contract } = loaderData
	const { stellarExpertURL } = useRouteLoaderData<typeof rootLoader>("root")

	const { data: detail } = useQuery({
		...contractQueryOptions(contract.contract_name),
		initialData: contract,
	})

	const createdAt = new Date(detail.created_at).toLocaleString()

	return (
		<main className={styles.main}>
			<div className={styles.titleRow}>
				<h1 className={styles.title}>{detail.contract_name}</h1>
				<Badge variant="secondary">{detail.version}</Badge>
			</div>

			<div className={styles.layout}>
				<div className={styles.fields}>
					<div className={styles.field}>
						<p className={styles.fieldLabel}>Contract ID</p>
						<a
							href={`${stellarExpertURL}/contract/${detail.contract_id}`}
							target="_blank"
							rel="noopener noreferrer"
							className={styles.fieldLink}
						>
							{detail.contract_id}
						</a>
					</div>

					<div className={styles.field}>
						<p className={styles.fieldLabel}>Deployer</p>
						<a
							href={`${stellarExpertURL}/account/${detail.deployer}`}
							target="_blank"
							rel="noopener noreferrer"
							className={styles.fieldLink}
						>
							{detail.deployer}
						</a>
					</div>

					<div className={styles.field}>
						<p className={styles.fieldLabel}>WASM</p>
						<a href={`/wasms/${detail.wasm_name}`} className={styles.fieldLink}>
							{detail.wasm_name}@v{detail.version}
						</a>
					</div>

					<div className={styles.field}>
						<p className={styles.fieldLabel}>Deployed</p>
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
							href={`${stellarExpertURL}/contract/${detail.contract_id}`}
							target="_blank"
							rel="noopener noreferrer"
							className={styles.sidebarLink}
						>
							<span>View on Stellar Expert</span>
							<span className={styles.sidebarLinkArrow}>↗</span>
						</a>
						<a
							href={`/wasms/${detail.wasm_name}`}
							className={styles.sidebarLink}
						>
							<span>View WASM</span>
							<span className={styles.sidebarLinkArrow}>→</span>
						</a>
						<a
							href={`${stellarExpertURL}/account/${detail.deployer}`}
							target="_blank"
							rel="noopener noreferrer"
							className={styles.sidebarLink}
						>
							<span>View Deployer</span>
							<span className={styles.sidebarLinkArrow}>↗</span>
						</a>
					</div>
				</aside>
			</div>
		</main>
	)
}
