import { useQuery, useQueryClient } from "@tanstack/react-query"
import {
	ContractExplorer,
	loadContractsFromNetwork,
	type Network,
} from "@theahaco/contract-explorer"
import { useEffect, useMemo, useState } from "react"
import "~/lib/buffer-polyfill"
import styles from "./contract-explorer-panel.module.css"
import { WalletButton } from "./wallet-button"
import { WALLET_QUERY_KEY, walletQueryOptions } from "~/lib/queries"
import { makeSignTransaction, subscribeToWallet } from "~/lib/wallet"

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

/**
 * Wallet state, read once and then kept current by the kit's own events.
 *
 * The query establishes the initial value (and restores a persisted session);
 * this effect is the single writer that pushes later changes into the cache.
 * `subscribeToWallet` dedupes the underlying kit listeners itself, so a second
 * mount is harmless.
 */
function useWallet(network: Network) {
	const queryClient = useQueryClient()
	const { data, isPending } = useQuery(walletQueryOptions(network))

	useEffect(
		() =>
			subscribeToWallet(network, (state) =>
				queryClient.setQueryData(WALLET_QUERY_KEY, state),
			),
		[network, queryClient],
	)

	return { wallet: data, isPending }
}

export function ContractExplorerPanel({
	contractId,
	contractName,
	network,
}: ContractExplorerPanelProps) {
	const [contracts, setContracts] = useState<Contracts | null>(null)
	const isDark = useIsDark()
	const { wallet, isPending } = useWallet(network)

	// Rebuild only when the network changes so the explorer isn't handed a new
	// function on every wallet update, causing re-renders
	const signTransaction = useMemo(() => makeSignTransaction(network), [network])

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
			<WalletButton network={network} state={wallet} isPending={isPending} />

			{contracts ? (
				<ContractExplorer
					contracts={contracts}
					network={network}
					address={wallet?.address}
					signTransaction={signTransaction}
				/>
			) : (
				<p className={styles.loading}>Loading contract explorer…</p>
			)}
		</div>
	)
}
