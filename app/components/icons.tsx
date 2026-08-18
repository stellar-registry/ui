import { type SVGProps } from "react"

// Brand marks from the Q2 logo/iconography refresh — see
// https://github.com/stellar-registry/ui/issues/41
//
// All use fill="currentColor" so a single asset works across themes and
// surfaces via CSS, rather than shipping separate black/grey/yellow/white
// files per usage. There's also a purpose-drawn "small" variant of the wasm
// and contract icons (simplified geometry for sub-12px renders, e.g.
// favicon-scale) — not wired up here since current usage renders at normal
// icon sizes; see the issue if a tiny-size use case comes up later.

export function RegistryLogo(props: SVGProps<SVGSVGElement>) {
	return (
		<svg
			viewBox="0 0 1000 954.8"
			fill="currentColor"
			aria-hidden="true"
			focusable="false"
			{...props}
		>
			<path d="M0,624.6v-85.1l35.8-18.2c27.2-13.9,43.4-42.7,41.1-73.2-.8-10.5-1.2-21.1-1.2-31.7,0-87.9,27.8-173.5,79.4-244.6C290.2-14.3,550.5-55.6,736.6,79.4l-10.1,5.2-67.8,34.6c-50.7-28.3-107.7-43.2-165.8-43.3-188.3-.2-341.1,152.2-341.3,340.4,0,14.9,1,29.8,2.9,44.5L984.1,38.1v85L0,624.6ZM1000,902.4l-202.8-202.8c11.2-12.1,21.9-25,31.8-38.7,51.6-71.1,79.4-156.6,79.4-244.5,0-10.7-.4-21.4-1.2-32-2.3-30.4,13.9-59.3,41.1-73.2l35.8-18.2v-84.8L0,709.4v85l829.8-422.8c1.9,14.9,2.9,29.8,2.9,44.8-.1,188.3-152.8,340.8-341.1,340.7-58.3,0-115.6-15-166.5-43.5l-4.2,2.2-73.5,37.5c151.6,110,352.4,103,494.7-3.9l205.5,205.5,52.4-52.4Z" />
		</svg>
	)
}

export function WasmIcon(props: SVGProps<SVGSVGElement>) {
	return (
		<svg
			viewBox="0 0 91.6 100"
			fill="currentColor"
			aria-hidden="true"
			focusable="false"
			{...props}
		>
			<path d="M0,57.7v10.1L91.6,21.1v-10.1L0,57.7Z" />
			<path d="M91.6,32.2L0,78.9v10.1l91.6-46.7v-10Z" />
			<polygon points="7.5 37 0 37 0 0 45.8 0 45.8 7.5 7.5 7.5 7.5 37" />
			<polygon points="91.6 100 46.7 100 46.7 92.5 84.1 92.5 84.1 63 91.6 63 91.6 100" />
		</svg>
	)
}

export function ContractIcon(props: SVGProps<SVGSVGElement>) {
	return (
		<svg
			viewBox="0 0 91.6 100"
			fill="currentColor"
			aria-hidden="true"
			focusable="false"
			{...props}
		>
			<polygon points="0 77.8 91.6 31.2 91.6 22.1 0 68.8 0 77.8" />
			<polygon points="0 100 91.6 100 91.6 42.6 0 89.2 0 100" />
			<polygon points="0 0 0 57.4 91.6 10.7 91.6 0 0 0" />
		</svg>
	)
}
