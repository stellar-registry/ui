import { useMutation } from "@tanstack/react-query"
import { type Network } from "@theahaco/contract-explorer"
import styles from "./wallet-button.module.css"
import {
	checkNetwork,
	connectWallet,
	openProfileModal,
	shortAddress,
	type WalletState,
} from "~/lib/wallet"

export type WalletButtonProps = {
	network: Network
	state: WalletState | undefined
	isPending: boolean
}

export function WalletButton({ network, state, isPending }: WalletButtonProps) {
	// Wrap the wallet connection functions inside Query's mutation hooks purely
	// for loading/error/success states. State is updated inside the wallet kit's
	// event listeners, not imperatively from these functions.
	// See ~/lib/wallet.ts
	const connect = useMutation({ mutationFn: () => connectWallet(network) })
	const profile = useMutation({ mutationFn: () => openProfileModal(network) })

	const match = state ? checkNetwork(network, state) : "disconnected"
	const busy = isPending || connect.isPending

	return (
		<>
			<div className={styles.bar}>
				{state?.address ? (
					<>
						<button
							className={`${styles.button} ${styles.address}`}
							onClick={() => profile.mutate()}
						>
							{shortAddress(state.address)}
						</button>
						<span className={styles.status}>
							Connected. Calls will be signed with this account.
						</span>
					</>
				) : (
					<>
						<button
							className={styles.button}
							onClick={() => connect.mutate()}
							disabled={busy}
						>
							{busy ? "Connecting…" : "Connect wallet"}
						</button>
						<span className={styles.status}>
							Read-only. Connect a wallet to submit transactions.
						</span>
					</>
				)}
			</div>

			{match === "mismatch" && (
				<p className={styles.warning}>
					Your wallet is on a different network than this site ({network.label}
					). Simulating calls still works, but signing will fail until you
					switch it to {network.label}.
				</p>
			)}

			{connect.isError && (
				<p className={styles.warning}>
					Could not connect: {(connect.error as Error).message}
				</p>
			)}
		</>
	)
}
