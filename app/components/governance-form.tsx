import { Form, useNavigation } from "react-router"
import { Button } from "./button"
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "./card"
import styles from "./governance-form.module.css"
import { Input } from "./input"
import { Label } from "./label"
import { Textarea } from "./textarea"
import {
	type GovernanceActionData,
	type GovernanceOperation,
} from "~/lib/governance"

function GovernanceForm({
	operation,
	actionData,
}: {
	operation: GovernanceOperation
	actionData: GovernanceActionData | undefined
}) {
	const navigation = useNavigation()
	const isSubmitting = navigation.state === "submitting"

	if (actionData?.ok) {
		return (
			<main className={styles.page}>
				<Card>
					<CardHeader>
						<CardTitle>Proposal captured</CardTitle>
						<CardDescription>
							This is a mock submission — nothing was actually sent anywhere
							yet.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<p className={styles.successSummary}>{actionData.result.summary}</p>
						<p className={styles.successTracking}>
							Mock tracking id: <code>{actionData.result.trackingId}</code>
						</p>
					</CardContent>
				</Card>
			</main>
		)
	}

	const errors = actionData?.ok === false ? actionData.errors : undefined

	return (
		<main className={styles.page}>
			<Form method="post" className={styles.form}>
				<Card>
					<CardHeader>
						<CardTitle>{operation.title}</CardTitle>
						<CardDescription>{operation.description}</CardDescription>
					</CardHeader>
					<CardContent className={styles.fields}>
						{operation.fields.map((field) => {
							const errorMessage = errors?.[field.name]
							const fieldId = `${operation.id}-${field.name}`
							return (
								<div className={styles.field} key={field.name}>
									<Label htmlFor={fieldId}>
										{field.label}
										{field.required && (
											<span className={styles.required}>*</span>
										)}
									</Label>
									{field.type === "textarea" ? (
										<Textarea
											id={fieldId}
											name={field.name}
											placeholder={field.placeholder}
											aria-invalid={Boolean(errorMessage)}
											rows={4}
										/>
									) : (
										<Input
											id={fieldId}
											name={field.name}
											placeholder={field.placeholder}
											aria-invalid={Boolean(errorMessage)}
										/>
									)}
									{errorMessage && (
										<p className={styles.error}>{errorMessage}</p>
									)}
								</div>
							)
						})}
					</CardContent>
					<CardFooter>
						<Button type="submit" disabled={isSubmitting}>
							{isSubmitting ? "Submitting…" : "Submit proposal"}
						</Button>
					</CardFooter>
				</Card>
			</Form>
		</main>
	)
}

export { GovernanceForm }
