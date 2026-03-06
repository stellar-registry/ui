import { Link, useRouteLoaderData } from "react-router"

import { type Route } from "./+types/wasms.$wasm_name.versions"
import styles from "./wasms.$wasm_name.versions.module.css"
import { type loader as wasmLoader } from "~/routes/wasms.$wasm_name"

export function meta({ matches }: Route.MetaArgs) {
	const parent = matches.find((m) => m.id === "wasm")
	const wasmName = (parent?.data as Awaited<ReturnType<typeof wasmLoader>>)
		?.wasm?.wasm_name
	if (!wasmName) return [{ title: "WASM Versions — Stellar Registry" }]
	return [{ title: `${wasmName} versions — Stellar Registry` }]
}

export default function WasmVersions() {
	const { wasm } = useRouteLoaderData<typeof wasmLoader>("wasm")

	return (
		<div className={styles.list}>
			{wasm.versions.map((v) => (
				<Link
					key={v.version}
					to={`/wasms/${wasm.wasm_name}/v/${v.version}`}
					className={styles.row}
				>
					<div className={styles.rowMain}>
						<span className={styles.rowVersion}>{v.version}</span>
						{v.version === wasm.version && (
							<span className={styles.rowLatest}>latest</span>
						)}
					</div>
					<p className={styles.rowHash}>{v.wasm_hash}</p>
				</Link>
			))}
		</div>
	)
}
