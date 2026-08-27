import { type ScSpecTypeDef } from "./types"

// The handful of ScSpecTypeDef primitives the deploy form can render a
// simple input for and encode with `nativeToScVal(value, { type })`.
// Composite types (vec/map/option/result/tuple/bytes_n/udt) — and the rare
// void/timepoint/duration primitives — aren't safe to guess an encoding for,
// so the deploy dialog refuses to build a form for them.
const SUPPORTED_TYPES = [
	"u32",
	"i32",
	"u64",
	"i64",
	"u128",
	"i128",
	"u256",
	"i256",
	"bool",
	"bytes",
	"string",
	"symbol",
	"address",
] as const

export type SupportedSpecType = (typeof SUPPORTED_TYPES)[number]

export function isSupportedSpecType(
	type: ScSpecTypeDef,
): type is SupportedSpecType {
	return (
		typeof type === "string" &&
		(SUPPORTED_TYPES as readonly string[]).includes(type)
	)
}

/** A short, human label for an ScSpecTypeDef, for error/help text. */
export function specTypeLabel(type: ScSpecTypeDef): string {
	if (typeof type === "string") return type
	const [key] = Object.keys(type)
	return key ?? "unknown"
}

const INTEGER_TYPES = new Set([
	"u32",
	"i32",
	"u64",
	"i64",
	"u128",
	"i128",
	"u256",
	"i256",
])

/**
 * Convert a raw form field string into the value `nativeToScVal` expects for
 * a given supported primitive type. Only ever called from client-side deploy
 * code (see the deploy dialog's mutationFn in app/routes/wasmOverview.tsx) —
 * relies on the `Buffer` global the vite node-polyfills plugin installs for
 * the browser bundle.
 */
export function parseArgValue(type: SupportedSpecType, raw: string): unknown {
	if (type === "bool") return raw === "true"
	if (INTEGER_TYPES.has(type)) {
		// bigint handles the full u32..i256 range; nativeToScVal accepts
		// bigint/number/string for all integer type hints.
		return BigInt(raw)
	}
	if (type === "bytes") {
		const hex = raw.startsWith("0x") ? raw.slice(2) : raw
		return Buffer.from(hex, "hex")
	}
	// address, string, symbol are passed through as-is
	return raw
}
