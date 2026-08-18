import { data } from "react-router"
import { type Route } from "./+types/governanceNewSubregistry"
import { GovernanceForm } from "~/components/governance-form"
import {
	getGovernanceOperation,
	submitGovernanceProposal,
	validateGovernanceFields,
} from "~/lib/governance"

const OPERATION_ID = "new-subregistry"

export function meta({}: Route.MetaArgs) {
	const operation = getGovernanceOperation(OPERATION_ID)!
	return [
		{ title: `${operation.title} — Governance — Stellar Registry` },
		{ name: "description", content: operation.description },
	]
}

export async function action({ request }: Route.ActionArgs) {
	const operation = getGovernanceOperation(OPERATION_ID)!
	const formData = await request.formData()
	const { values, errors } = validateGovernanceFields(operation, formData)

	if (Object.keys(errors).length > 0) {
		return data({ ok: false as const, errors }, { status: 400 })
	}

	const result = await submitGovernanceProposal(operation.id, values)
	return data({ ok: true as const, result })
}

export default function GovernanceNewSubregistry({
	actionData,
}: Route.ComponentProps) {
	return (
		<GovernanceForm
			operation={getGovernanceOperation(OPERATION_ID)!}
			actionData={actionData}
		/>
	)
}
