import { useQuery } from "@tanstack/react-query"
import { Link, useSearchParams } from "react-router"

import { type Route } from "./+types/wasms"
import styles from "./wasms.module.css"
import { Badge } from "~/components/badge"
import { QuerySearchInput } from "~/components/query-search-input"
import { getWasms } from "~/lib/api"
import { wasmsQueryOptions } from "~/lib/queries"
import { shouldRevalidateWhenPathChanges } from "~/lib/revalidation"
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

export const shouldRevalidate = shouldRevalidateWhenPathChanges

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
	const [searchParams] = useSearchParams()
	const urlQuery = searchParams.get("query") ?? ""

	const { data: wasms = [] } = useQuery({
		...wasmsQueryOptions({
			query: urlQuery,
		}),
		initialData: urlQuery === loaderData.query ? loaderData.wasms : undefined,
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
					<QuerySearchInput placeholder="Search WASMs by name…" />
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
