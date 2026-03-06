import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { Link } from "react-router"

import { type Route } from "./+types/wasms._index"
import styles from "./wasms._index.module.css"
import { Badge } from "~/components/badge"
import { Input } from "~/components/input"
import { getWasms } from "~/lib/api"
import { wasmsQueryOptions } from "~/lib/queries"
import { type Wasm } from "~/lib/types"

export function meta({}: Route.MetaArgs) {
	return [
		{ title: "WASMs — Stellar Contract Registry" },
		{
			name: "description",
			content: "Browse published WASM modules on Stellar",
		},
	]
}

export async function loader() {
	const wasms = await getWasms()
	return { wasms }
}

function WasmRow({ wasm }: { wasm: Wasm }) {
	return (
		<Link to={`/wasms/${wasm.wasm_name}`} className={styles.row}>
			<div className={styles.rowMain}>
				<span className={styles.rowName}>{wasm.wasm_name}</span>
				<Badge variant="secondary">v{wasm.version}</Badge>
			</div>
			<p className={styles.rowSub}>{wasm.author}</p>
		</Link>
	)
}

export default function WasmsIndex({ loaderData }: Route.ComponentProps) {
	const { data: wasms = [] } = useQuery({
		...wasmsQueryOptions(),
		initialData: loaderData.wasms,
	})

	const [query, setQuery] = useState("")

	const filtered = query
		? wasms.filter(
				(w) =>
					w.wasm_name.toLowerCase().includes(query.toLowerCase()) ||
					w.author.toLowerCase().includes(query.toLowerCase()),
			)
		: wasms

	return (
		<>
			<section className={styles.pageHeader}>
				<div className={styles.pageHeaderInner}>
					<h1 className={styles.pageTitle}>WASMs</h1>
					<p className={styles.pageSub}>
						Published WebAssembly modules available on the Stellar network.
					</p>
				</div>
			</section>

			<main className={styles.main}>
				<div className={styles.toolbar}>
					<Input
						placeholder="Search by name or author…"
						value={query}
						onChange={(e) => setQuery(e.target.value)}
					/>
				</div>

				{filtered.length === 0 ? (
					<p className={styles.emptyState}>No WASMs found.</p>
				) : (
					<div className={styles.list}>
						{filtered.map((wasm) => (
							<WasmRow key={wasm.wasm_hash} wasm={wasm} />
						))}
					</div>
				)}
			</main>
		</>
	)
}
