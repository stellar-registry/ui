import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { Link } from "react-router"

import { type Route } from "./+types/contracts._index"
import styles from "./contracts._index.module.css"
import { Badge } from "~/components/badge"
import { Input } from "~/components/input"
import { getContracts } from "~/lib/api"
import { contractsQueryOptions } from "~/lib/queries"
import { type Contract } from "~/lib/types"

export function meta({}: Route.MetaArgs) {
	return [
		{ title: "Contracts — Stellar Registry" },
		{ name: "description", content: "Browse deployed Stellar smart contracts" },
	]
}

export async function loader({ request }: Route.LoaderArgs) {
	const q = new URL(request.url).searchParams.get("q") ?? ""
	const contracts = await getContracts()
	return { contracts, q }
}

function ContractRow({ contract }: { contract: Contract }) {
	return (
		<Link to={`/contracts/${contract.contract_name}`} className={styles.row}>
			<div className={styles.rowMain}>
				<span className={styles.rowName}>{contract.contract_name}</span>
				<Badge variant="secondary">
					{contract.wasm_name}@v{contract.version}
				</Badge>
			</div>
			<p className={styles.rowSub}>{contract.contract_id}</p>
		</Link>
	)
}

export default function ContractsIndex({ loaderData }: Route.ComponentProps) {
	const { data: contracts = [] } = useQuery({
		...contractsQueryOptions(),
		initialData: loaderData.contracts,
	})

	const [query, setQuery] = useState(loaderData.q)

	const filtered = query
		? contracts.filter(
				(c) =>
					c.contract_name.toLowerCase().includes(query.toLowerCase()) ||
					c.wasm_name.toLowerCase().includes(query.toLowerCase()) ||
					c.deployer.toLowerCase().includes(query.toLowerCase()),
			)
		: contracts

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
					<Input
						placeholder="Search contracts by name or WASM…"
						value={query}
						onChange={(e) => setQuery(e.target.value)}
					/>
				</div>

				{filtered.length === 0 ? (
					<p className={styles.emptyState}>No contracts found.</p>
				) : (
					<div className={styles.list}>
						{filtered.map((contract) => (
							<ContractRow key={contract.contract_id} contract={contract} />
						))}
					</div>
				)}
			</main>
		</>
	)
}
