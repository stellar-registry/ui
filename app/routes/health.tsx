import { useQuery } from "@tanstack/react-query"

import { type Route } from "./+types/health"
import styles from "./health.module.css"
import { checkHealth } from "~/lib/api"
import { healthQueryOptions } from "~/lib/queries"

export function meta({}: Route.MetaArgs) {
	return [{ title: "Health — Stellar Contract Registry" }]
}

export async function loader() {
	const ok = await checkHealth()
	return { ok }
}

export default function Health({ loaderData }: Route.ComponentProps) {
	const { data: ok } = useQuery({
		...healthQueryOptions(),
		initialData: loaderData.ok,
		refetchInterval: 30_000,
	})

	return (
		<main className={styles.main}>
			<h1 className={styles.title}>Health</h1>
			<div className={styles.status}>
				<span
					className={`${styles.indicator} ${ok ? styles.up : styles.down}`}
				/>
				<span className={styles.label}>
					Registry API is <strong>{ok ? "operational" : "unavailable"}</strong>
				</span>
			</div>
			<p className={styles.endpoint}>
				<span className={styles.endpointLabel}>Endpoint</span>
				<code>https://registry-indexer.fly.dev</code>
			</p>
		</main>
	)
}
