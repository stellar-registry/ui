import { lazy, Suspense, useEffect, useState } from "react"
import { type ContractExplorerPanelProps } from "./contract-explorer-panel"
import styles from "./contract-explorer-panel.module.css"

/**
 * The explorer drags in @stellar/stellar-sdk and @stellar/stellar-xdr-json —
 * ~2 MB of JS that only matters on contract detail pages, and only for
 * contracts that have a Wasm. Splitting it into its own chunk keeps it off
 * the route's initial payload.
 */
const ContractExplorerPanel = lazy(() =>
	import("./contract-explorer-panel").then((m) => ({
		default: m.ContractExplorerPanel,
	})),
)

const LOADING = <p className={styles.loading}>Loading contract explorer…</p>

/**
 * Client-only boundary around ContractExplorerPanel.
 *
 * The panel fetches the contract spec from the network in an effect and the
 * SDK expects browser globals, so there is nothing meaningful to render on the
 * server. Gating on mount (rather than letting Suspense resolve during SSR)
 * keeps the chunk out of the server bundle too.
 */
export function ContractExplorerSection(props: ContractExplorerPanelProps) {
	const [mounted, setMounted] = useState(false)

	useEffect(() => setMounted(true), [])

	if (!mounted) return LOADING

	return (
		<Suspense fallback={LOADING}>
			<ContractExplorerPanel {...props} />
		</Suspense>
	)
}
