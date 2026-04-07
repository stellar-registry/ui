import { useEffect, useState } from "react"

import styles from "./code-block.module.css"

export function CodeBlock({
	children,
	lang,
}: {
	children: string
	lang?: string
}) {
	const [copied, setCopied] = useState(false)

	useEffect(() => {
		if (!copied) return
		const id = setTimeout(() => setCopied(false), 2000)
		return () => clearTimeout(id)
	}, [copied])

	function copy() {
		void navigator.clipboard.writeText(children).then(() => setCopied(true))
	}

	return (
		<div className={styles.block}>
			<div className={styles.toolbar}>
				{lang && <span className={styles.lang}>{lang}</span>}
				<button
					className={styles.copy}
					onClick={copy}
					aria-label="Copy code to clipboard"
				>
					{copied ? "Copied!" : "Copy"}
				</button>
			</div>
			<pre className={styles.pre}>
				<code>{children}</code>
			</pre>
		</div>
	)
}
