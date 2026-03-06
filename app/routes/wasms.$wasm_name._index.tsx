import { useQuery } from "@tanstack/react-query"
import { useRouteLoaderData } from "react-router"

import {
	DetailField,
	DetailFields,
	FieldLink,
	FieldValue,
} from "~/components/detail-field"
import { wasmQueryOptions } from "~/lib/queries"
import { type loader as rootLoader } from "~/root"
import { type loader as wasmLoader } from "~/routes/wasms.$wasm_name"

export default function WasmDetail() {
	const { wasm } = useRouteLoaderData<typeof wasmLoader>("wasm")
	const { stellarExpertURL } = useRouteLoaderData<typeof rootLoader>("root")

	const { data: detail } = useQuery({
		...wasmQueryOptions(wasm.wasm_name),
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
