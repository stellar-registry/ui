// NOTE: this utility **NEEDS** to load these imports dynamically, these imports
// are type-only so they're erased at build. See `loadKit` for more info.
import {
	closeEvent,
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
let initializedFor: string | undefined

/**
 * Load and initialize the wallet kit.
 *
 * NOTE: it's imported dynamically for two reasons: it touches browser globals
 * at init so a static import would break SSR, and it is heavy enough that
 * pulling it into the root chunk would defeat the contract explorer's code
 * split. Callers are all browser-only paths (effects and click handlers).
 *
 * Reinitializes when the passphrase changes (e.g. navigating between a
 * testnet and mainnet deployment in the same session) rather than trusting
 * whatever network the kit was first loaded with.
 */
export function loadKit(network: Network): Promise<Kit> {
	if (kitPromise && initializedFor === network.passphrase) return kitPromise

	initializedFor = network.passphrase
	kitPromise = (async () => {
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

/**
 * Best-effort silent restore of a previously connected wallet's address.
 * Thin wrapper around `getWalletState` for callers (like the one-shot deploy
 * dialog) that only care about the address, not the full wallet state.
 */
export async function restoreAddress(
	network: Network,
): Promise<string | undefined> {
	return (await getWalletState(network)).address
}

/**
 * Live read of the address currently active in the wallet extension itself
 * (not the kit's cached copy — see `getWalletState`). The user can switch
 * accounts inside their wallet extension at any time without our UI knowing,
 * so call this right before an operation whose correctness depends on "who
 * is connected right now" — e.g. immediately before building/signing a
 * transaction — rather than trusting previously-cached state.
 */
export async function fetchLiveAddress(network: Network): Promise<string> {
	const kit = await loadKit(network)
	const { address } = await kit.fetchAddress()
	return address
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

/**
 * Render the kit's modal (wallet picker or profile) into a container we own
 * that stays interactive regardless of an ancestor modal's state.
 *
 * The connect button is sometimes rendered inside a Radix Dialog (e.g. the
 * wasm deploy dialog), which locks `body` to `pointer-events: none` while
 * open and grants `auto` back only to the DOM nodes it tracks itself (see
 * DialogContentModal in @radix-ui/react-dialog). Stellar Wallets Kit's modal
 * is appended straight to <body>, outside Radix's tree, so by default it
 * inherits that "none" and every click on it falls through to whatever's
 * rendered underneath (e.g. an <input> in the deploy form) instead of
 * registering.
 *
 * Rather than relax the lock for the whole page, give the kit a container we
 * own that stays interactive. Passing `container` switches the kit out of
 * its own full-screen "FIXED" mode (see its `SwkApp` component), so we
 * reproduce that positioning and backdrop here, including wiring the
 * backdrop click to the kit's own `closeEvent` so "click outside to cancel"
 * still works. Harmless when there's no enclosing Dialog.
 */
async function withOwnedContainer<T>(
	open: (container: HTMLElement) => Promise<T>,
): Promise<T> {
	const container = document.createElement("div")
	Object.assign(container.style, {
		position: "fixed",
		inset: "0",
		zIndex: "999",
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		pointerEvents: "auto",
		backgroundColor: "rgb(0 0 0 / 0.5)",
	})
	container.addEventListener("click", (e) => {
		if (e.target === container) closeEvent.next()
	})
	document.body.appendChild(container)

	try {
		return await open(container)
	} finally {
		container.remove()
	}
}

/** Open the wallet-selection modal. Resolves once a wallet is connected. */
export async function connectWallet(network: Network): Promise<string> {
	const kit = await loadKit(network)
	const { address } = await withOwnedContainer((container) =>
		kit.authModal({ container }),
	)
	return address
}

/** Open the profile modal, which shows the account and disconnect button. */
export async function openProfileModal(network: Network) {
	const kit = await loadKit(network)
	return withOwnedContainer((container) => kit.profileModal({ container }))
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
 * Sign a transaction with the currently connected wallet.
 *
 * The kit forwards `address` to the wallet only as a hint — if the user
 * switched accounts in the extension, it may come back signed by a
 * different key than the one this transaction's auth was built for, which
 * the network will reject as txBadAuth. Catch that here instead.
 */
export async function signTransaction(
	xdr: string,
	address: string,
	network: Network,
): Promise<string> {
	const kit = await loadKit(network)
	const { signedTxXdr, signerAddress } = await kit.signTransaction(xdr, {
		address,
		networkPassphrase: network.passphrase,
	})
	if (signerAddress && signerAddress !== address) {
		throw new Error(
			`Signed with a different account (${signerAddress}) than the one connected (${address}). Disconnect and reconnect your wallet, then try again.`,
		)
	}
	return signedTxXdr
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
