import { useState } from "react"
import { Link } from "react-router"
import { type Route } from "./+types/_index"
import styles from "./_index.module.css"
import { Badge } from "~/components/badge"
import { Input } from "~/components/input"
import { getContracts } from "~/lib/api"
import { type Contract } from "~/lib/types"

export function meta({}: Route.MetaArgs) {
	return [
		{ title: "Stellar Contract Registry" },
		{ name: "description", content: "Browse deployed Stellar smart contracts" },
	]
}

export async function loader() {
	const contracts = await getContracts()
	return { contracts }
}

function ContractRow({ contract }: { contract: Contract }) {
	return (
		<Link
			to={`/contracts/${contract.wasm_hash}`}
			className={styles.contractRow}
		>
			<div className={styles.contractRowMain}>
				<span className={styles.contractName}>{contract.wasm_name}</span>
				<Badge variant="secondary">{contract.version}</Badge>
			</div>
			<p className={styles.contractAuthor}>{contract.author}</p>
		</Link>
	)
}

export default function Index({ loaderData }: Route.ComponentProps) {
	const { contracts } = loaderData
	const [query, setQuery] = useState("")

	const filtered = query
		? contracts.filter(
				(c) =>
					c.wasm_name.toLowerCase().includes(query.toLowerCase()) ||
					c.author.toLowerCase().includes(query.toLowerCase()),
			)
		: contracts

	return (
		<>
			<section className={styles.hero}>
				<div className={styles.heroInner}>
					<div className={styles.heroMark}>✦</div>
					<h1 className={styles.heroHeading}>Stellar Registry</h1>
					<p className={styles.heroSub}>
						Browse and discover deployed smart contracts on the Stellar network.
					</p>
					<div className={styles.heroSearch}>
						<Input
							placeholder="Search by name or author address…"
							value={query}
							onChange={(e) => setQuery(e.target.value)}
						/>
					</div>
				</div>
			</section>

			<main className={styles.main}>
				{filtered.length === 0 ? (
					<p className={styles.emptyState}>No contracts found.</p>
				) : (
					<div className={styles.list}>
						{filtered.map((contract) => (
							<ContractRow key={contract.wasm_hash} contract={contract} />
						))}
					</div>
				)}
			</main>
		</>
	)
}
