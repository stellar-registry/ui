import { Link } from "react-router"
import { type Route } from "./+types/governance"
import styles from "./governance.module.css"
import { GOVERNANCE_OPERATIONS } from "~/lib/governance"

export function meta({}: Route.MetaArgs) {
	return [
		{ title: "Governance — Stellar Registry" },
		{
			name: "description",
			content:
				"Submit governance proposals for the Stellar Registry root registry.",
		},
	]
}

export default function GovernanceIndex() {
	return (
		<>
			<section className={styles.pageHeader}>
				<div className={styles.pageHeaderInner}>
					<h1 className={styles.pageTitle}>Governance</h1>
					<p className={styles.pageSub}>
						Tansu doesn&rsquo;t yet have a UI for the specific proposals Stellar
						Registry needs, so these forms fill the gap for standard governance
						operations. Submissions are currently mocked — nothing is sent
						anywhere yet.
					</p>
				</div>
			</section>

			<main className={styles.main}>
				<div className={styles.operations}>
					{GOVERNANCE_OPERATIONS.map((operation) => (
						<Link
							key={operation.id}
							to={operation.path}
							className={styles.operationCard}
						>
							<h2 className={styles.operationTitle}>{operation.title}</h2>
							<p className={styles.operationDesc}>{operation.description}</p>
							<span className={styles.operationLink}>Open form →</span>
						</Link>
					))}
				</div>
			</main>
		</>
	)
}
