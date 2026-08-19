// Thin client-only wrapper around @creit.tech/stellar-wallets-kit's static
// API. Everything is dynamically imported so nothing from this module (or
// its polyfill-dependent deps) ever loads during SSR — it's only ever
// invoked from the deploy dialog's event handlers, in the browser.
//
// The kit persists its own connection state (selected wallet, last known
// address) under its own localStorage keys, so there's nothing for us to
// track here beyond which network passphrase it was last initialized with.

import { type Networks } from "@creit.tech/stellar-wallets-kit"

let initializedFor: string | undefined

// restoreAddress() is called from a `useEffect` that reruns on every deploy
// dialog open, but the underlying kit.getAddress() probes every configured
// wallet-connector module and at least one of them leaks a `close` listener
// per call (see MaxListenersExceededWarning reports on repeated opens).
// Caching the in-flight/resolved probe per kit lifetime keeps that call to
// one-per-network-session instead of one-per-open. Reset alongside
// `initializedFor` so switching networks still gets a fresh restore check.
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
	const { address } = await kit.authModal()
	return address
}

export async function signTransaction(
	xdrString: string,
	address: string,
	networkPassphrase: string,
): Promise<string> {
	const kit = await getKit(networkPassphrase)
	const { signedTxXdr } = await kit.signTransaction(xdrString, {
		address,
		networkPassphrase,
	})
	return signedTxXdr
}
