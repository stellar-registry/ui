// Packs governance proposal content into an IPFS CAR and hands it to a
// pinning worker, mirroring Consulting-Manao/tansu's own
// `dapp/src/utils/ipfsFunctions.ts` (`packFilesToCar` / `uploadToIpfsProxy`)
// so the resulting directory CID is exactly what Tansu's own dapp expects
// when it later reads `proposal.md`/`outcomes.json` back off IPFS.
//
// The worker itself (`GOVERNANCE_IPFS_WORKER_URL`) is not yet deployed. Tansu
// runs an equivalent worker (`dapp/workers/ipfs-delegation`) that verifies a
// signed Stellar transaction before uploading a CAR to Filebase; the plan is
// to ask whether Registry can call that directly before standing up a clone.
// Until a URL is configured, `uploadProposalDirectory` throws rather than
// silently no-op'ing.

export interface PackedDirectory {
	cid: string
	carBase64: string
}

/** Encode a flat set of files (name -> text content) as a UnixFS directory CAR. */
export async function packDirectory(
	files: Record<string, string>,
): Promise<PackedDirectory> {
	const { createDirectoryEncoderStream, CAREncoderStream } =
		await import("ipfs-car")

	const fileObjects = Object.entries(files).map(
		([name, content]) => new File([content], name),
	)

	const blocks: { cid: unknown }[] = []
	let rootCid: string | undefined
	await createDirectoryEncoderStream(fileObjects).pipeTo(
		new WritableStream({
			write(block) {
				blocks.push(block)
				rootCid = String(block.cid)
			},
		}),
	)
	if (!rootCid || blocks.length === 0) {
		throw new Error("Failed to encode proposal content to IPFS CAR")
	}

	const lastCid = blocks[blocks.length - 1]!.cid
	const carEncoder = new CAREncoderStream([lastCid as never])
	const chunks: Uint8Array[] = []
	let cursor = 0
	await new ReadableStream({
		pull(controller) {
			if (cursor < blocks.length) {
				controller.enqueue(blocks[cursor++])
			} else {
				controller.close()
			}
		},
	})
		.pipeThrough(carEncoder)
		.pipeTo(
			new WritableStream({
				write(chunk) {
					chunks.push(new Uint8Array(chunk as ArrayBufferLike))
				},
			}),
		)

	const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0)
	const car = new Uint8Array(totalLength)
	let offset = 0
	for (const chunk of chunks) {
		car.set(chunk, offset)
		offset += chunk.length
	}

	let binary = ""
	for (let i = 0; i < car.length; i += 8192) {
		binary += String.fromCharCode(...car.subarray(i, i + 8192))
	}

	return { cid: rootCid, carBase64: btoa(binary) }
}

/**
 * Upload a packed CAR to the pinning worker, gated by a signed transaction
 * (see the module doc above). Returns once the worker confirms the CID it
 * pinned matches the one computed locally.
 */
export async function uploadProposalDirectory({
	workerUrl,
	packed,
	signedTxXdr,
}: {
	workerUrl: string | undefined
	packed: PackedDirectory
	signedTxXdr: string
}): Promise<string> {
	if (!workerUrl) {
		throw new Error(
			"Governance IPFS pinning isn't configured yet (GOVERNANCE_IPFS_WORKER_URL).",
		)
	}

	const response = await fetch(workerUrl, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			cid: packed.cid,
			signedTxXdr,
			car: packed.carBase64,
		}),
	})

	const result = (await response.json().catch(() => ({}))) as {
		success?: boolean
		cid?: string
		error?: string
	}

	if (!response.ok || !result.success) {
		throw new Error(result.error ?? `IPFS upload failed (${response.status})`)
	}
	if (result.cid !== packed.cid) {
		throw new Error(
			`IPFS pinning worker returned a different CID than expected (expected ${packed.cid}, got ${result.cid})`,
		)
	}
	return result.cid
}
