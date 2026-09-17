// Renders a governance operation's fields. Unlike a typical React Router
// `<Form>`/`action` pair, submission here needs a connected wallet and a
// multi-step async flow (build proposal content, upload to IPFS, sign, send —
// see `app/routes/governanceAddContract.tsx`), so this component only owns
// field rendering; the route owns values/errors/submission via a mutation,
// the same pattern `DeployWasmDialog` uses for wallet-signed calls.

import styles from "./governance-fields.module.css"
import { Input } from "~/components/input"
import { Label } from "~/components/label"
import { Textarea } from "~/components/textarea"
import { type GovernanceOperation } from "~/lib/governance"

function GovernanceFields({
	operation,
	values,
	errors,
	disabled,
	readOnlyFields,
	onChange,
}: {
	operation: GovernanceOperation
	values: Record<string, string>
	errors: Record<string, string>
	disabled?: boolean
	/** Fields whose value is set programmatically (e.g. from a connected wallet) rather than typed. */
	readOnlyFields?: string[]
	onChange: (name: string, value: string) => void
}) {
	return (
		<div className={styles.fields}>
			{operation.fields.map((field) => {
				const errorMessage = errors[field.name]
				const fieldId = `${operation.id}-${field.name}`
				const readOnly = readOnlyFields?.includes(field.name)
				return (
					<div className={styles.field} key={field.name}>
						<Label htmlFor={fieldId}>
							{field.label}
							{field.required && <span className={styles.required}>*</span>}
						</Label>
						{field.type === "textarea" ? (
							<Textarea
								id={fieldId}
								name={field.name}
								value={values[field.name] ?? ""}
								onChange={(e) => onChange(field.name, e.target.value)}
								placeholder={field.placeholder}
								aria-invalid={Boolean(errorMessage)}
								disabled={disabled}
								readOnly={readOnly}
								rows={4}
							/>
						) : (
							<Input
								id={fieldId}
								name={field.name}
								value={values[field.name] ?? ""}
								onChange={(e) => onChange(field.name, e.target.value)}
								placeholder={field.placeholder}
								aria-invalid={Boolean(errorMessage)}
								disabled={disabled}
								readOnly={readOnly}
							/>
						)}
						{readOnly && (
							<p className={styles.hint}>Set from your connected wallet.</p>
						)}
						{errorMessage && <p className={styles.error}>{errorMessage}</p>}
					</div>
				)
			})}
		</div>
	)
}

export { GovernanceFields }
