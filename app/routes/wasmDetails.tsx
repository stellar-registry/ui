import { useOutletContext } from "react-router"

import {
	DetailField,
	DetailFields,
	FieldLink,
	FieldValue,
} from "~/components/detail-field"
import { type WasmOutletContext } from "~/lib/types"
import { useRootData } from "~/root"

export default function WasmDetail() {
	const { wasm } = useOutletContext<WasmOutletContext>()
	const { stellarExpertUrl } = useRootData()

	const createdAt = new Date(wasm.created_at).toLocaleString()

	return (
		<DetailFields>
			<DetailField label="Wasm Hash">{wasm.wasm_hash}</DetailField>

			<DetailField label="Author">
				<FieldLink href={`${stellarExpertUrl}/account/${wasm.author}`} external>
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
					href={`${stellarExpertUrl}/tx/${wasm.transaction_hash}`}
					external
				>
					{wasm.transaction_hash}
				</FieldLink>
			</DetailField>

			{wasm.meta && (
				<>
					{wasm.meta.rsver && (
						<DetailField label="Rust Version">
							<FieldValue>{wasm.meta.rsver}</FieldValue>
						</DetailField>
					)}

					{wasm.meta.rssdkver && (
						<DetailField label="Soroban SDK Version">
							<FieldValue>{wasm.meta.rssdkver}</FieldValue>
						</DetailField>
					)}

					{wasm.meta.cliver && (
						<DetailField label="Stellar CLI Version">
							<FieldValue>{wasm.meta.cliver}</FieldValue>
						</DetailField>
					)}

					{wasm.meta.rssdk_spec_shaking && (
						<DetailField label="Spec Shaking">
							<FieldValue>{wasm.meta.rssdk_spec_shaking}</FieldValue>
						</DetailField>
					)}

					{wasm.meta.binver && (
						<DetailField label="Binary Version">
							<FieldValue>{wasm.meta.binver}</FieldValue>
						</DetailField>
					)}
				</>
			)}
		</DetailFields>
	)
}
