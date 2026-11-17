import styles from "./detail-field.module.css"

function DetailFields({ children }: { children: React.ReactNode }) {
	return <div className={styles.fields}>{children}</div>
}

function DetailField({
	label,
	children,
	href,
	external,
}: {
	label: string
	children: React.ReactNode
	href?: string
	external?: boolean
}) {
	return (
		<div className={styles.field}>
			<p className={styles.fieldLabel}>{label}</p>
			{href ? (
				<FieldLink href={href} external={external}>
					{children}
				</FieldLink>
			) : (
				<FieldValue>{children}</FieldValue>
			)}
		</div>
	)
}

/** An account address, led by its registry name when it has one. */
function AccountField({
	label,
	address,
	name,
	href,
}: {
	label: string
	address: string
	name?: string | null
	href: string
}) {
	return (
		<DetailField label={label} href={href} external>
			{name ? (
				<>
					<span className={styles.accountName}>{name}</span>
					<span className={styles.accountAddress}>{address}</span>
				</>
			) : (
				address
			)}
		</DetailField>
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
	return <div className={styles.fieldValue}>{children}</div>
}

export { DetailFields, DetailField, AccountField }
