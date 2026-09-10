import { useOutletContext } from "react-router"

import { DetailField, DetailFields } from "~/components/detail-field"
import { type WasmOutletContext } from "~/lib/types"
import { useRootData } from "~/root"

export default function WasmDetail() {
	const { wasm } = useOutletContext<WasmOutletContext>()
	const { stellarExpertUrl } = useRootData()

	const createdAt = new Date(wasm.created_at).toLocaleString()

	return (
		<DetailFields>
			<DetailField label="Wasm Hash">{wasm.wasm_hash}</DetailField>

			<DetailField
				label="Author"
				href={`${stellarExpertUrl}/account/${wasm.author}`}
				external
			>
				{wasm.author}
			</DetailField>

			<DetailField label="Published">{createdAt}</DetailField>

			<DetailField label="Ledger">
				{wasm.ledger_sequence.toLocaleString()}
			</DetailField>

			<DetailField
				label="Transaction"
				href={`${stellarExpertUrl}/tx/${wasm.transaction_hash}`}
				external
			>
				{wasm.transaction_hash}
			</DetailField>

			{wasm.meta && (
				<>
					{wasm.meta.rsver && (
						<DetailField label="Rust Version">{wasm.meta.rsver}</DetailField>
					)}

					{wasm.meta.rssdkver && (
						<DetailField label="Soroban SDK Version">
							{wasm.meta.rssdkver}
						</DetailField>
					)}

					{wasm.meta.cliver && (
						<DetailField label="Stellar CLI Version">
							{wasm.meta.cliver}
						</DetailField>
					)}

					{wasm.meta.rssdk_spec_shaking && (
						<DetailField label="Spec Shaking">
							{wasm.meta.rssdk_spec_shaking}
						</DetailField>
					)}

					{wasm.meta.binver && (
						<DetailField label="Binary Version">{wasm.meta.binver}</DetailField>
					)}
				</>
			)}
		</DetailFields>
	)
}
