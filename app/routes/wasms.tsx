import { useQuery } from "@tanstack/react-query"
import { useEffect, useState } from "react"
import { Link, useNavigationType, useSearchParams } from "react-router"

import { type Route } from "./+types/wasms"
import styles from "./wasms.module.css"
import { Badge } from "~/components/badge"
import { Input } from "~/components/input"
import { useDebounced } from "~/hooks/useDebounce"
import { getWasms } from "~/lib/api"
import { wasmsQueryOptions } from "~/lib/queries"
import { type Wasm } from "~/lib/types"
import { getFullName } from "~/lib/util"

export function meta({}: Route.MetaArgs) {
	return [
		{ title: "WASMs — Stellar Registry" },
		{
			name: "description",
			content: "Browse published WASM modules on Stellar",
		},
	]
}

export async function loader({ request, context }: Route.LoaderArgs) {
	const query = new URL(request.url).searchParams.get("query") ?? ""
	const wasms = await getWasms(context.cloudflare.env.REGISTRY_API_URL, {
		query,
	})
	return { wasms, query }
}

type ShouldRevalidateArgs = {
	currentUrl: URL
	nextUrl: URL
	defaultShouldRevalidate: boolean
}

export function shouldRevalidate({
	currentUrl,
	nextUrl,
	defaultShouldRevalidate,
}: ShouldRevalidateArgs) {
	if (currentUrl.pathname === nextUrl.pathname) {
		return false
	}

	return defaultShouldRevalidate
}

function WasmRow({ wasm }: { wasm: Wasm }) {
	const fullName = getFullName(wasm)
	return (
		<Link to={`/wasms/${fullName}`} className={styles.row}>
			<div className={styles.rowMain}>
				<span className={styles.rowName}>{fullName}</span>
				<Badge variant="secondary">v{wasm.wasm_version}</Badge>
			</div>
			<p className={styles.rowSub}>Hash: {wasm.wasm_hash}</p>
		</Link>
	)
}

export default function WasmsIndex({ loaderData }: Route.ComponentProps) {
	const [searchParams, setSearchParams] = useSearchParams()
	const urlQuery = searchParams.get("query") ?? ""

	// This holds the input's live value so typing feels instant; it's kept in
	// sync with the URL (the source of truth) any time the URL changes from
	// elsewhere (e.g. mount, browser back/forward, or a shared link).
	const [input, setInput] = useState(urlQuery)
	const inputOnChange: React.ChangeEventHandler<HTMLInputElement> = (e) =>
		setInput(e.target.value)
	const debouncedInput = useDebounced(input, 300)
	const navigationType = useNavigationType()

	// Our own debounced write below always navigates with `replace: true`
	// (-> navigationType "REPLACE"), so any other urlQuery change is external
	// (back/forward, a shared link) and should overwrite the in-progress input.
	useEffect(() => {
		if (navigationType === "REPLACE") {
			return
		}
		setInput(urlQuery)
	}, [urlQuery, navigationType])

	useEffect(() => {
		if (debouncedInput === urlQuery) {
			return
		}

		const nextSearchParams = new URLSearchParams(searchParams)
		if (debouncedInput) {
			nextSearchParams.set("query", debouncedInput)
		} else {
			nextSearchParams.delete("query")
		}

		setSearchParams(nextSearchParams, { replace: true })
	}, [debouncedInput, searchParams, setSearchParams, urlQuery])

	const { data: wasms = [] } = useQuery({
		...wasmsQueryOptions({
			query: urlQuery,
		}),
		initialData: urlQuery === loaderData.query ? loaderData.wasms : undefined,
	})
	return (
		<>
			<section className={styles.pageHeader}>
				<div className={styles.pageHeaderInner}>
					<h1 className={styles.pageTitle}>WASMs</h1>
					<p className={styles.pageSub}>
						Published WebAssembly modules available on the Stellar network.
					</p>
				</div>
			</section>

			<main className={styles.main}>
				<div className={styles.toolbar}>
					<Input
						placeholder="Search WASMs by name…"
						value={input}
						onChange={inputOnChange}
					/>
				</div>

				{wasms.length === 0 ? (
					<p className={styles.emptyState}>No WASMs found.</p>
				) : (
					<div className={styles.list}>
						{wasms.map((wasm) => (
							<WasmRow key={wasm.wasm_hash} wasm={wasm} />
						))}
					</div>
				)}
			</main>
		</>
	)
}
