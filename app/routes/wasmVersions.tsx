import { Link, useOutletContext } from "react-router"

import { type Route } from "./+types/wasmVersions"
import styles from "./wasmVersions.module.css"
import { type WasmOutletContext, isWasmOutletContext } from "~/lib/types"

export function meta({ matches }: Route.MetaArgs) {
	const parent = matches.find(
		(m) => m?.id === "wasm" || m?.id === "wasmChannel",
	)
	const parentData = isWasmOutletContext(parent?.loaderData)
		? parent.loaderData
		: undefined
	if (!parentData) return [{ title: "WASM Versions — Stellar Registry" }]
	return [{ title: `${parentData.wasm.wasm_name} versions — Stellar Registry` }]
}

export default function WasmVersions() {
	const { wasm, fullName } = useOutletContext<WasmOutletContext>()

	return (
		<div className={styles.list}>
			{wasm.versions.map((v) => (
				<Link
					key={v.wasm_version}
					to={`/wasms/${fullName}/v/${v.wasm_version}`}
					className={styles.row}
				>
					<div className={styles.rowMain}>
						<span className={styles.rowVersion}>{v.wasm_version}</span>
						{v.wasm_version === wasm.wasm_version && (
							<span className={styles.rowLatest}>latest</span>
						)}
					</div>
					<p className={styles.rowHash}>{v.wasm_hash}</p>
				</Link>
			))}
		</div>
	)
}
