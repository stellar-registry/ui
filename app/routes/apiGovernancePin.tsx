// Same-origin replacement for a separate IPFS-pinning worker. Verifies a
// signed Stellar transaction (proof the caller went to the trouble of
// signing something real — an anti-spam gate, not a semantic check: it
// doesn't confirm the tx is a `create_proposal` call, or that the source
// account exists on-chain), independently recomputes the uploaded CAR's
// root CID, and forwards it to Filebase. Mirrors
// `Consulting-Manao/tansu`'s `dapp/workers/ipfs-delegation` worker, minus
// CORS (unnecessary — this runs on the same origin as the page that calls
// it) and Pinata secondary pinning (not needed yet; easy to add later).
//
// Requires the `GOVERNANCE_FILEBASE_TOKEN` secret, set with:
//   npx wrangler secret put GOVERNANCE_FILEBASE_TOKEN --env testnet
// Never stored in wrangler.jsonc, git, or the client bundle — see CLAUDE.md.

import { CarReader } from "@ipld/car"
import { Keypair, Networks, Transaction } from "@stellar/stellar-sdk"
import { type Route } from "./+types/apiGovernancePin"

interface PinRequest {
	cid?: string
	signedTxXdr?: string
	car?: string
}

function jsonResponse(body: unknown, status: number): Response {
	return new Response(JSON.stringify(body), {
		status,
		headers: { "Content-Type": "application/json" },
	})
}

function decodeBase64(base64: string): Uint8Array {
	return Uint8Array.from(atob(base64), (char) => char.charCodeAt(0))
}

function validateSignedTransaction(signedTxXdr: string): void {
	for (const passphrase of [Networks.TESTNET, Networks.PUBLIC]) {
		try {
			const tx = new Transaction(signedTxXdr, passphrase)
			if (!tx.signatures?.length || !tx.source) continue
			const sourceKeypair = Keypair.fromPublicKey(tx.source)
			const txHash = tx.hash()
			const verified = tx.signatures.some((signature) =>
				sourceKeypair.verify(txHash, signature.signature()),
			)
			if (verified && tx.operations?.length) return
		} catch {
			continue
		}
	}
	throw new Error("Transaction signature is invalid for the source account")
}

async function calculateCidFromCar(carBytes: Uint8Array): Promise<string> {
	const reader = await CarReader.fromBytes(carBytes)
	const [root] = await reader.getRoots()
	if (!root) throw new Error("CAR file has no declared root")
	return root.toString()
}

async function uploadToFilebase(
	carBytes: Uint8Array,
	cid: string,
	token: string,
): Promise<void> {
	const formData = new FormData()
	formData.append(
		"file",
		// Uint8Array's `buffer` is typed as ArrayBufferLike (it could in
		// principle be a SharedArrayBuffer), which BlobPart doesn't accept —
		// harmless here since `decodeBase64` always builds a fresh, non-shared
		// buffer.
		new Blob([carBytes as BlobPart], { type: "application/vnd.ipld.car" }),
		`${cid}.car`,
	)
	const res = await fetch("https://rpc.filebase.io/api/v0/dag/import", {
		method: "POST",
		headers: { Authorization: `Bearer ${token}` },
		body: formData,
	})
	if (!res.ok) throw new Error(`Filebase HTTP ${res.status}`)
}

export async function action({ request, context }: Route.ActionArgs) {
	if (request.method !== "POST") {
		return jsonResponse({ success: false, error: "Method not allowed" }, 405)
	}

	const token = context.cloudflare.env.GOVERNANCE_FILEBASE_TOKEN
	if (!token) {
		return jsonResponse(
			{
				success: false,
				error:
					"Governance IPFS pinning isn't configured (GOVERNANCE_FILEBASE_TOKEN).",
			},
			501,
		)
	}

	let body: PinRequest
	try {
		body = (await request.json()) as PinRequest
	} catch {
		return jsonResponse({ success: false, error: "Invalid JSON body" }, 400)
	}

	const { cid, signedTxXdr, car } = body
	if (!cid || !signedTxXdr || !car) {
		return jsonResponse(
			{
				success: false,
				error: "Missing required fields: cid, signedTxXdr, car",
			},
			400,
		)
	}

	try {
		validateSignedTransaction(signedTxXdr)
	} catch (e) {
		return jsonResponse(
			{
				success: false,
				error: e instanceof Error ? e.message : "Invalid signed transaction",
			},
			400,
		)
	}

	const carBytes = decodeBase64(car)
	if (carBytes.length === 0) {
		return jsonResponse({ success: false, error: "Invalid CAR body" }, 400)
	}

	let calculatedCid: string
	try {
		calculatedCid = await calculateCidFromCar(carBytes)
	} catch (e) {
		return jsonResponse(
			{
				success: false,
				error: e instanceof Error ? e.message : "Failed to read CAR",
			},
			400,
		)
	}

	if (calculatedCid !== cid) {
		return jsonResponse(
			{
				success: false,
				error: `CID mismatch: expected ${cid}, got ${calculatedCid}`,
			},
			400,
		)
	}

	try {
		await uploadToFilebase(carBytes, cid, token)
	} catch (e) {
		return jsonResponse(
			{
				success: false,
				error: e instanceof Error ? e.message : "Filebase upload failed",
				cid,
			},
			502,
		)
	}

	return jsonResponse({ success: true, cid }, 200)
}
