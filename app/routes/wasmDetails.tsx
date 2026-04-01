import { useOutletContext, useRouteLoaderData } from "react-router"

import {
	DetailField,
	DetailFields,
	FieldLink,
	FieldValue,
} from "~/components/detail-field"
import { type loader as rootLoader } from "~/root"
import { type WasmOutletContext } from "~/routes/wasmOverview"

export default function WasmDetail() {
	const { wasm } = useOutletContext<WasmOutletContext>()
	const { stellarExpertURL } = useRouteLoaderData<typeof rootLoader>("root")

	const createdAt = new Date(wasm.created_at).toLocaleString()

	return (
		<DetailFields>
			<DetailField label="WASM Hash">
				<FieldLink
					href={`${stellarExpertURL}/contract/${wasm.wasm_hash}`}
					external
				>
					{wasm.wasm_hash}
				</FieldLink>
			</DetailField>

			<DetailField label="Author">
				<FieldLink href={`${stellarExpertURL}/account/${wasm.author}`} external>
					{wasm.author}
				</FieldLink>
			</DetailField>

			<DetailField label="Published">
				<FieldValue>{createdAt}</FieldValue>
			</DetailField>

			<DetailField label="Ledger">
				<FieldValue>{wasm.ledger_sequence.toLocaleString()}</FieldValue>
			</DetailField>

			<DetailField label="Transaction">
				<FieldLink
					href={`${stellarExpertURL}/tx/${wasm.transaction_hash}`}
					external
				>
					{wasm.transaction_hash}
				</FieldLink>
			</DetailField>
		</DetailFields>
	)
}
