import { useQuery } from "@tanstack/react-query"
import { useEffect, useState } from "react"
import { Link, useSearchParams } from "react-router"

import { type Route } from "./+types/wasms"
import styles from "./wasms.module.css"
import { Badge } from "~/components/badge"
import { Input } from "~/components/input"
import { useDebounced } from "~/hooks/useDebounce"
import { getWasms } from "~/lib/api"
import { wasmsQueryOptions } from "~/lib/queries"
import { type Wasm } from "~/lib/types"
import { getFullName } from "~/lib/util"

export function meta({}: Route.MetaArgs) {
	return [
		{ title: "WASMs — Stellar Registry" },
		{
			name: "description",
			content: "Browse published WASM modules on Stellar",
		},
	]
}

export async function loader({ request, context }: Route.LoaderArgs) {
	const query = new URL(request.url).searchParams.get("query") ?? ""
	const wasms = await getWasms(context.cloudflare.env.REGISTRY_API_URL, {
		query,
	})
	return { wasms, query }
}

function WasmRow({ wasm }: { wasm: Wasm }) {
	const fullName = getFullName(wasm)
	return (
		<Link to={`/wasms/${fullName}`} className={styles.row}>
			<div className={styles.rowMain}>
				<span className={styles.rowName}>{fullName}</span>
				<Badge variant="secondary">v{wasm.wasm_version}</Badge>
			</div>
			<p className={styles.rowSub}>Hash: {wasm.wasm_hash}</p>
		</Link>
	)
}

export default function WasmsIndex({ loaderData }: Route.ComponentProps) {
	const [searchParams, setSearchParams] = useSearchParams()
	const [query, setQuery] = useState(loaderData.query)
	const debouncedQuery = useDebounced(query, 300)

	useEffect(() => {
		setQuery(loaderData.query)
	}, [loaderData.query])

	useEffect(() => {
		const currentQuery = searchParams.get("query") ?? ""
		if (debouncedQuery === currentQuery) {
			return
		}

		const nextSearchParams = new URLSearchParams(searchParams)
		if (debouncedQuery) {
			nextSearchParams.set("query", debouncedQuery)
		} else {
			nextSearchParams.delete("query")
		}

		setSearchParams(nextSearchParams, { replace: true })
	}, [debouncedQuery, searchParams, setSearchParams])

	const { data: wasms = [] } = useQuery({
		...wasmsQueryOptions({
			query: debouncedQuery,
		}),
		initialData: loaderData.wasms,
	})

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
						placeholder="Search WASMs by name…"
						value={query}
						onChange={(e) => setQuery(e.target.value)}
					/>
				</div>

				{wasms.length === 0 ? (
					<p className={styles.emptyState}>No WASMs found.</p>
				) : (
					<div className={styles.list}>
						{wasms.map((wasm) => (
							<WasmRow key={wasm.wasm_hash} wasm={wasm} />
						))}
					</div>
				)}
			</main>
		</>
	)
}
