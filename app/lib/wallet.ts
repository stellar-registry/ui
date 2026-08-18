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
	}
	return StellarWalletsKit
}

/** Best-effort silent restore of a previously connected wallet's address. */
export async function restoreAddress(
	networkPassphrase: string,
): Promise<string | undefined> {
	const kit = await getKit(networkPassphrase)
	try {
		const { address } = await kit.getAddress()
		return address || undefined
	} catch {
		return undefined
	}
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
