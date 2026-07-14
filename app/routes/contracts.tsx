import { useQuery } from "@tanstack/react-query"
import { Link, useSearchParams } from "react-router"

import { type Route } from "./+types/contracts"
import styles from "./contracts.module.css"
import { Badge } from "~/components/badge"
import { QuerySearchInput } from "~/components/query-search-input"
import { getContracts } from "~/lib/api"
import { contractsQueryOptions } from "~/lib/queries"
import { shouldRevalidateWhenPathChanges } from "~/lib/revalidation"
import { type Contract } from "~/lib/types"
import { getFullName, prefixName } from "~/lib/util"

export function meta({}: Route.MetaArgs) {
	return [
		{ title: "Contracts — Stellar Registry" },
		{ name: "description", content: "Browse deployed Stellar smart contracts" },
	]
}

export async function loader({ request, context }: Route.LoaderArgs) {
	const query = new URL(request.url).searchParams.get("query") ?? ""
	const contracts = await getContracts(
		context.cloudflare.env.REGISTRY_API_URL,
		{
			query,
		},
	)
	return { contracts, query }
}

export const shouldRevalidate = shouldRevalidateWhenPathChanges

function ContractRow({ contract }: { contract: Contract }) {
	const fullName = getFullName(contract)
	return (
		<Link to={`/contracts/${fullName}`} className={styles.row}>
			<div className={styles.rowMain}>
				<span className={styles.rowName}>{fullName}</span>

				{contract.wasm_name && (
					<Badge variant="secondary">
						{prefixName(contract.wasm_name, contract.wasm_channel)}@
						{contract.wasm_version}
					</Badge>
				)}
			</div>
			<p className={styles.rowSub}>Contract ID: {contract.contract_id}</p>
		</Link>
	)
}

export default function ContractsIndex({ loaderData }: Route.ComponentProps) {
	const [searchParams] = useSearchParams()
	const query = searchParams.get("query") ?? ""

	const { data: contracts = [] } = useQuery({
		...contractsQueryOptions({ query }),
		initialData: query === loaderData.query ? loaderData.contracts : undefined,
	})

	return (
		<>
			<section className={styles.pageHeader}>
				<div className={styles.pageHeaderInner}>
					<h1 className={styles.pageTitle}>Contracts</h1>
					<p className={styles.pageSub}>
						Deployed contract instances on the Stellar network.
					</p>
				</div>
			</section>

			<main className={styles.main}>
				<div className={styles.toolbar}>
					<QuerySearchInput placeholder="Search contracts by name or WASM…" />
				</div>

				{contracts.length === 0 ? (
					<p className={styles.emptyState}>No contracts found.</p>
				) : (
					<div className={styles.list}>
						{contracts.map((contract) => (
							<ContractRow key={contract.contract_id} contract={contract} />
						))}
					</div>
				)}
			</main>
		</>
	)
}
