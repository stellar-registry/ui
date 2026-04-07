import { useEffect, useState } from "react"

import { CodeBlock } from "./code-block"
import styles from "./usage-section.module.css"

interface UsageSectionProps {
	items: {
		label?: string
		code: string
		lang?: string
		description?: React.ReactNode
	}[]
	description?: string
	footer?: React.ReactNode
}

const STORAGE_KEY = "registry-usage-expanded"
const docsHref = "https://scaffoldstellar.org/docs/registry"

export function UsageSection({
	items,
	description,
	footer,
}: UsageSectionProps) {
	const [expanded, setExpanded] = useState(true)

	useEffect(() => {
		const stored = localStorage.getItem(STORAGE_KEY)
		if (stored !== null) setExpanded(stored === "true")
	}, [])

	function toggle() {
		const next = !expanded
		setExpanded(next)
		localStorage.setItem(STORAGE_KEY, String(next))
	}

	return (
		<section className={styles.section}>
			<div className={styles.header}>
				<h2 className={styles.heading}>Use in your contract</h2>
				<button
					className={styles.toggle}
					onClick={toggle}
					aria-expanded={expanded}
				>
					{expanded ? "Hide" : "Show"}
				</button>
			</div>
			{expanded && (
				<div className={styles.body}>
					{description && (
						<p className={styles.description}>
							{description}{" "}
							<a
								href={docsHref}
								target="_blank"
								rel="noopener noreferrer"
								className={styles.descriptionLink}
							>
								Read the docs →
							</a>
						</p>
					)}
					{items.map(({ label, lang, code, description = null }, i) => (
						<div key={i} className={styles.item}>
							{label && <p className={styles.itemLabel}>{label}</p>}
							<CodeBlock lang={lang}>{code}</CodeBlock>
							{description}
						</div>
					))}
					{footer && <div className={styles.footer}>{footer}</div>}
				</div>
			)}
		</section>
	)
}
