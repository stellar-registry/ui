import { useQuery } from "@tanstack/react-query"
import { data, useRouteLoaderData } from "react-router"

import { type Route } from "./+types/contractDetails"
import styles from "./contractDetails.module.css"
import { Badge } from "~/components/badge"
import {
	DetailField,
	DetailFields,
	FieldLink,
	FieldValue,
} from "~/components/detail-field"
import {
	SidebarAlert,
	SidebarLink,
	SidebarPanel,
} from "~/components/detail-sidebar"
import { getContract } from "~/lib/api"
import { contractQueryOptions } from "~/lib/queries"
import { type loader as rootLoader } from "~/root"

export async function loader({ params, context }: Route.LoaderArgs) {
	try {
		const contract = await getContract(
			params.name,
			context.cloudflare.env.REGISTRY_API_URL,
		)
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
	const { network, stellarExpertURL } =
		useRouteLoaderData<typeof rootLoader>("root")

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
				<DetailFields>
					<DetailField label="Contract ID">
						<FieldLink
							href={`${stellarExpertURL}/contract/${detail.contract_id}`}
							external
						>
							{detail.contract_id}
						</FieldLink>
					</DetailField>

					<DetailField label="Deployer">
						<FieldLink
							href={`${stellarExpertURL}/account/${detail.deployer}`}
							external
						>
							{detail.deployer}
						</FieldLink>
					</DetailField>

					<DetailField label="WASM">
						<FieldLink href={`/wasms/${detail.wasm_name}`}>
							{detail.wasm_name}@v{detail.version}
						</FieldLink>
					</DetailField>

					<DetailField label="Deployed">
						<FieldValue>{createdAt}</FieldValue>
					</DetailField>

					<DetailField label="Ledger">
						<FieldValue>{detail.ledger_sequence.toLocaleString()}</FieldValue>
					</DetailField>

					<DetailField label="Transaction">
						<FieldLink
							href={`${stellarExpertURL}/tx/${detail.transaction_hash}`}
							external
						>
							{detail.transaction_hash}
						</FieldLink>
					</DetailField>
				</DetailFields>

				<aside className={styles.sidebar}>
					{network === "testnet" && (
						<SidebarAlert
							href="https://rgstry.xyz"
							linkText="Switch to Mainnet →"
						>
							Testnet data — this contract may not exist on mainnet.
						</SidebarAlert>
					)}
					<SidebarPanel>
						<SidebarLink
							href={`${stellarExpertURL}/contract/${detail.contract_id}`}
							external
						>
							View on Stellar Expert
						</SidebarLink>
						<SidebarLink href={`/wasms/${detail.wasm_name}`}>
							View WASM
						</SidebarLink>
						<SidebarLink
							href={`${stellarExpertURL}/account/${detail.deployer}`}
							external
						>
							View Deployer
						</SidebarLink>
					</SidebarPanel>
				</aside>
			</div>
		</main>
	)
}
