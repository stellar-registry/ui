// NOTE: this utility **NEEDS** to load these imports dynamically, these imports
// are type-only so they're erased at build. See `loadKit` for more info.
import {
	type Networks,
	type StellarWalletsKit,
} from "@creit.tech/stellar-wallets-kit"
import { type Network } from "@theahaco/contract-explorer"

/**
 * State of connected wallet, including address and its reported network
 */
export type WalletState = {
	address: string | undefined
	// `undefined` for wallet's that don't support `getNetwork`
	networkPassphrase: string | undefined
}

export const DISCONNECTED: WalletState = {
	address: undefined,
	networkPassphrase: undefined,
}

type Kit = typeof StellarWalletsKit
let kitPromise: Promise<Kit> | null = null

/**
 * Load and initialize the wallet kit.
 *
 * NOTE: it's imported dynamically for two reasons: it touches browser globals
 * at init so a static import would break SSR, and it is heavy enough that
 * pulling it into the root chunk would defeat the contract explorer's code
 * split. Callers are all browser-only paths (effects and click handlers).
 */
export function loadKit(network: Network): Promise<Kit> {
	kitPromise ??= (async () => {
		const [{ StellarWalletsKit }, { defaultModules }] = await Promise.all([
			import("@creit.tech/stellar-wallets-kit"),
			import("@creit.tech/stellar-wallets-kit/modules/utils"),
		])
		StellarWalletsKit.init({
			network: network.passphrase as Networks,
			// Currently on testnet and mainnet, so all modules supported
			modules: defaultModules(),
		})
		return StellarWalletsKit
	})()
	return kitPromise
}

/** Ask the wallet which network it is on; `undefined` when it can't say. */
async function safeGetNetwork(kit: Kit): Promise<string | undefined> {
	try {
		const { networkPassphrase } = await kit.getNetwork()
		return networkPassphrase
	} catch {
		return undefined
	}
}

/**
 * Get the current wallet state, initializing the kit if needed.
 *
 * Doubles as session restore: initializing the kit is what reads back a
 * previously persisted connection, so a returning user resolves straight to a
 * connected state. `getAddress` throws when nothing is connected, which is the
 * ordinary "not connected yet" case rather than an error worth surfacing.
 */
export async function getWalletState(network: Network): Promise<WalletState> {
	const kit = await loadKit(network)

	let address: string | undefined
	try {
		address = (await kit.getAddress()).address
	} catch {
		return DISCONNECTED
	}

	if (!address) return DISCONNECTED

	const networkPassphrase = await safeGetNetwork(kit)

	return { address, networkPassphrase }
}

const listeners = new Set<(state: WalletState) => void>()
let kitSubscribed = false

/**
 * Attach the kit's event listeners exactly once, no matter how many components
 * subscribe. The kit is a module-level singleton, so a second set of listeners
 * would fan every event out twice.
 */
async function ensureKitSubscription(network: Network) {
	if (kitSubscribed) return
	kitSubscribed = true

	const { KitEventType } = await import("@creit.tech/stellar-wallets-kit")
	const kit = await loadKit(network)

	const emit = (state: WalletState) => {
		for (const listener of listeners) listener(state)
	}

	kit.on(KitEventType.STATE_UPDATED, (event) => {
		// NOTE: `event.payload.networkPassphrase` is the network the *app*
		// configured, not the one the wallet is on. Ignore it and ask the wallet.
		const { address } = event.payload
		if (!address) {
			emit(DISCONNECTED)
			return
		}

		void safeGetNetwork(kit).then((networkPassphrase) =>
			emit({ address, networkPassphrase }),
		)
	})

	kit.on(KitEventType.DISCONNECT, () => emit(DISCONNECTED))
}

/**
 * Subscribe to wallet changes: connect, disconnect, and account switches.
 *
 * Returns its unsubscribe synchronously so it drops straight into an effect,
 * while the underlying kit wiring is set up in the background.
 *
 * NOTE: this does not detect the user switching networks *inside* their wallet
 * (extensions emit no event for it), and polling `getNetwork` to catch it is
 * more work than it is worth. The network is re-read on connect and
 * before signing, which is when a mismatch actually matters.
 */
export function subscribeToWallet(
	network: Network,
	callback: (state: WalletState) => void,
): () => void {
	listeners.add(callback)
	void ensureKitSubscription(network)
	return () => {
		listeners.delete(callback)
	}
}

/** Open the wallet-selection modal. Resolves once a wallet is connected. */
export async function connectWallet(network: Network) {
	return (await loadKit(network)).authModal()
}

/** Open the profile modal, which shows the account and disconnect button. */
export async function openProfileModal(network: Network) {
	return (await loadKit(network)).profileModal()
}

/** Disconnect the active wallet. The kit clears its own persisted state. */
export async function disconnectWallet(network: Network) {
	return (await loadKit(network)).disconnect()
}

export type NetworkMatch = "disconnected" | "mismatch" | "ok" | "unverified"

/**
 * Compare the network this deployment is pinned to against the one the wallet
 * reports. A connected wallet that reports nothing is `unverified`, not a
 * mismatch. Most wallets don't expose their network.
 */
export function checkNetwork(
	network: Network,
	state: WalletState,
): NetworkMatch {
	if (!state.address) return "disconnected"
	if (!state.networkPassphrase) return "unverified"
	return state.networkPassphrase === network.passphrase ? "ok" : "mismatch"
}

/**
 * Build `signTransaction` required by Contract Explorer calls
 *
 * NOTE: Deliberately not cached alongside the wallet state: it resolves
 * the kit at call time so it always signs with whatever wallet is
 * connected to **right now**.
 *
 * Re-checks the wallet's network first. Simulation succeeds regardless of
 * network, so a wallet on the wrong one only fails at signing, where the
 * underlying error is opaque enough to look like a failure on our end.
 */
export function makeSignTransaction(network: Network) {
	return async (
		xdr: string,
		opts?: { networkPassphrase?: string; address?: string; path?: string },
	) => {
		const kit = await loadKit(network)
		const walletNetwork = await safeGetNetwork(kit)

		// Only throw this error if we *know* the walletNetwork and there's a mismatch
		if (walletNetwork && walletNetwork !== network.passphrase) {
			throw new Error(
				`Your wallet is on a different network. Switch it to ${network.label} and try again.`,
			)
		}

		return kit.signTransaction(xdr, {
			networkPassphrase: network.passphrase,
			...opts,
		})
	}
}

/** Shorten an address for display: first 4 and last 4 characters. */
export const shortAddress = (address: string): string =>
	`${address.slice(0, 4)}…${address.slice(-4)}`
