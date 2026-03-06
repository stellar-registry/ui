import styles from "./detail-field.module.css"

function DetailFields({ children }: { children: React.ReactNode }) {
	return <div className={styles.fields}>{children}</div>
}

function DetailField({
	label,
	children,
}: {
	label: string
	children: React.ReactNode
}) {
	return (
		<div className={styles.field}>
			<p className={styles.fieldLabel}>{label}</p>
			{children}
		</div>
	)
}

function FieldLink({
	href,
	external,
	children,
}: {
	href: string
	external?: boolean
	children: React.ReactNode
}) {
	return (
		<a
			href={href}
			className={styles.fieldLink}
			{...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
		>
			{children}
		</a>
	)
}

function FieldValue({ children }: { children: React.ReactNode }) {
	return <p className={styles.fieldValue}>{children}</p>
}

export { DetailFields, DetailField, FieldLink, FieldValue }
