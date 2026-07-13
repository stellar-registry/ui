import { Buffer } from "buffer"

// @stellar/stellar-sdk (via @theahaco/contract-explorer) expects Node's
// `Buffer` global at runtime. Browsers don't provide it, but the Cloudflare
// Worker (SSR) already has it via `nodejs_compat`, so this only kicks in
// client-side.
if (typeof globalThis.Buffer === "undefined") {
	Object.assign(globalThis, { Buffer })
}
