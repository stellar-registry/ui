import { useQuery } from "@tanstack/react-query"
import { data, useRouteLoaderData } from "react-router"

import { type Route } from "./+types/wasms.$wasm_name.v.$version"
import {
	DetailField,
	DetailFields,
	FieldLink,
	FieldValue,
} from "~/components/detail-field"
import { getWasm } from "~/lib/api"
import { wasmQueryOptions } from "~/lib/queries"
import { type loader as rootLoader } from "~/root"

export async function loader({ params }: Route.LoaderArgs) {
	try {
		const wasm = await getWasm(params.wasm_name, params.version)
		return { wasm }
	} catch {
		throw data("WASM not found", { status: 404 })
	}
}

export function meta({ data: loaderData }: Route.MetaArgs) {
	if (!loaderData) return [{ title: "WASM Not Found" }]
	const { wasm_name, version } = loaderData.wasm
	return [{ title: `${wasm_name}@${version} — Stellar Registry` }]
}

export default function WasmVersionDetail({
	loaderData,
}: Route.ComponentProps) {
	const { wasm } = loaderData
	const { stellarExpertURL } = useRouteLoaderData<typeof rootLoader>("root")

	const { data: detail } = useQuery({
		...wasmQueryOptions(wasm.wasm_name, wasm.version),
		initialData: wasm,
	})

	const createdAt = new Date(detail.created_at).toLocaleString()

	return (
		<DetailFields>
			<DetailField label="WASM Hash">
				<FieldLink
					href={`${stellarExpertURL}/contract/${detail.wasm_hash}`}
					external
				>
					{detail.wasm_hash}
				</FieldLink>
			</DetailField>

			<DetailField label="Author">
				<FieldLink
					href={`${stellarExpertURL}/account/${detail.author}`}
					external
				>
					{detail.author}
				</FieldLink>
			</DetailField>

			<DetailField label="Published">
				<FieldValue>{createdAt}</FieldValue>
			</DetailField>

			<DetailField label="Ledger">
				<FieldValue>{detail.ledger_sequence.toLocaleString()}</FieldValue>
			</DetailField>

			<DetailField label="Transaction">
				<FieldLink
					href={`${stellarExpertURL}/tx/${detail.transaction_hash}`}
					external
				>
					{detail.transaction_hash}
				</FieldLink>
			</DetailField>
		</DetailFields>
	)
}
