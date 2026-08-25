// Thin client-only wrapper around @creit.tech/stellar-wallets-kit's static
// API. Everything is dynamically imported so nothing from this module (or
// its polyfill-dependent deps) ever loads during SSR — it's only ever
// invoked from the deploy dialog's event handlers, in the browser.
//
// The kit persists its own connection state (selected wallet, last known
// address) under its own localStorage keys, so there's nothing for us to
// track here beyond which network passphrase it was last initialized with.

import { closeEvent, type Networks } from "@creit.tech/stellar-wallets-kit"

let initializedFor: string | undefined

// restoreAddress() is called from a `useEffect` that reruns on every deploy
// dialog open. kit.getAddress() itself is a cheap local read (it doesn't
// touch the connector modules), so caching it here is just a minor
// optimization to keep that read to one-per-network-session instead of
// one-per-open. Reset alongside `initializedFor` so switching networks still
// gets a fresh restore check.
let restoreAttempted: Promise<string | undefined> | undefined

async function getKit(networkPassphrase: string) {
	const [{ StellarWalletsKit }, { defaultModules }] = await Promise.all([
		import("@creit.tech/stellar-wallets-kit"),
		import("@creit.tech/stellar-wallets-kit/modules/utils"),
	])
	if (initializedFor !== networkPassphrase) {
		StellarWalletsKit.init({
			modules: defaultModules(),
			network: networkPassphrase as Networks,
		})
		initializedFor = networkPassphrase
		restoreAttempted = undefined
	}
	return StellarWalletsKit
}

/** Best-effort silent restore of a previously connected wallet's address. */
export async function restoreAddress(
	networkPassphrase: string,
): Promise<string | undefined> {
	const kit = await getKit(networkPassphrase)
	if (!restoreAttempted) {
		restoreAttempted = (async () => {
			try {
				const { address } = await kit.getAddress()
				return address || undefined
			} catch {
				return undefined
			}
		})()
	}
	return restoreAttempted
}

/** Opens the wallet picker and resolves once the user has connected one. */
export async function connectWallet(
	networkPassphrase: string,
): Promise<string> {
	const kit = await getKit(networkPassphrase)

	// The deploy dialog underneath is a modal Radix Dialog, which locks
	// `body` to `pointer-events: none` while open and grants `auto` back only
	// to the DOM nodes it tracks itself (see DialogContentModal in
	// @radix-ui/react-dialog). Stellar Wallets Kit's picker is appended
	// straight to <body>, outside Radix's tree, so by default it inherits
	// that "none" and every click on it falls through to whatever's rendered
	// underneath (e.g. an <input> in the deploy form) instead of registering.
	//
	// Rather than relax the lock for the whole page, give the kit a
	// container we own that stays interactive regardless of `body`'s state.
	// Passing `container` switches the kit out of its own full-screen "FIXED"
	// mode (see its `SwkApp` component), so we reproduce that positioning and
	// backdrop here, including wiring the backdrop click to the kit's own
	// `closeEvent` so "click outside to cancel" still works.
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
		const { address } = await kit.authModal({ container })
		return address
	} finally {
		container.remove()
	}
}

/**
 * Live read of the address currently active in the wallet extension itself
 * (not the kit's cached copy — see `restoreAddress`). The user can switch
 * accounts inside their wallet extension at any time without our UI knowing,
 * so call this right before an operation whose correctness depends on "who
 * is connected right now" — e.g. immediately before building/signing a
 * transaction — rather than trusting previously-cached state.
 */
export async function fetchLiveAddress(
	networkPassphrase: string,
): Promise<string> {
	const kit = await getKit(networkPassphrase)
	const { address } = await kit.fetchAddress()
	return address
}

/**
 * Disconnects the active wallet. Also resets our own restore memo so a
 * subsequent `restoreAddress` call does a fresh check instead of replaying a
 * stale promise — the kit itself already clears its persisted selection.
 */
export async function disconnectWallet(
	networkPassphrase: string,
): Promise<void> {
	const kit = await getKit(networkPassphrase)
	await kit.disconnect()
	restoreAttempted = undefined
}

export async function signTransaction(
	xdrString: string,
	address: string,
	networkPassphrase: string,
): Promise<string> {
	const kit = await getKit(networkPassphrase)
	const { signedTxXdr, signerAddress } = await kit.signTransaction(xdrString, {
		address,
		networkPassphrase,
	})
	// The kit forwards `address` to the wallet only as a hint — if the user
	// switched accounts in the extension, it may come back signed by a
	// different key than the one this transaction's auth was built for,
	// which the network will reject as txBadAuth. Catch that here instead.
	if (signerAddress && signerAddress !== address) {
		throw new Error(
			`Signed with a different account (${signerAddress}) than the one connected (${address}). Disconnect and reconnect your wallet, then try again.`,
		)
	}
	return signedTxXdr
}
