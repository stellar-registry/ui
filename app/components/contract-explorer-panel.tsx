import {
	ContractExplorer,
	loadContractsFromNetwork,
	type Network,
} from "@theahaco/contract-explorer"
import { useEffect, useState } from "react"
import "~/lib/buffer-polyfill"
import styles from "./contract-explorer-panel.module.css"

// `Contracts` isn't exported by `@theahaco/contract-explorer`, so derive it
// from the loader's return type instead.
type Contracts = Awaited<ReturnType<typeof loadContractsFromNetwork>>

export type ContractExplorerPanelProps = {
	contractId: string
	contractName: string
	network: Network
}

function useIsDark() {
	const [isDark, setIsDark] = useState(true)

	useEffect(() => {
		const root = document.documentElement
		setIsDark(root.classList.contains("dark"))

		const observer = new MutationObserver(() =>
			setIsDark(root.classList.contains("dark")),
		)
		observer.observe(root, { attributes: true, attributeFilter: ["class"] })
		return () => observer.disconnect()
	}, [])

	return isDark
}

export function ContractExplorerPanel({
	contractId,
	contractName,
	network,
}: ContractExplorerPanelProps) {
	const [contracts, setContracts] = useState<Contracts | null>(null)
	const isDark = useIsDark()

	useEffect(() => {
		let cancelled = false

		async function load() {
			try {
				const loaded = await loadContractsFromNetwork(
					{ [contractName]: contractId },
					network,
				)
				if (!cancelled) setContracts(loaded)
			} catch (error) {
				console.error(error)
			}
		}
		void load()

		return () => {
			cancelled = true
		}
	}, [contractId, contractName, network])

	return (
		<div className={isDark ? "sds-theme-dark" : "sds-theme-light"}>
			{contracts ? (
				<ContractExplorer contracts={contracts} network={network} />
			) : (
				<p className={styles.loading}>Loading contract explorer…</p>
			)}
		</div>
	)
}
