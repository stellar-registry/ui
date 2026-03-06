import styles from "./detail-sidebar.module.css"

function SidebarAlert({
	children,
	href,
	linkText,
}: {
	children: React.ReactNode
	href: string
	linkText: string
}) {
	return (
		<div className={styles.sidebarAlert}>
			<p className={styles.sidebarAlertText}>{children}</p>
			<a href={href} className={styles.sidebarAlertLink}>
				{linkText}
			</a>
		</div>
	)
}

function SidebarPanel({ children }: { children: React.ReactNode }) {
	return <div className={styles.sidebarPanel}>{children}</div>
}

function SidebarLink({
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
			className={styles.sidebarLink}
			{...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
		>
			<span>{children}</span>
			<span className={styles.sidebarLinkArrow}>{external ? "↗" : "→"}</span>
		</a>
	)
}

export { SidebarAlert, SidebarPanel, SidebarLink }
