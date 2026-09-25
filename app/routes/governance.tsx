import { Link } from "react-router"
import { type Route } from "./+types/governance"
import styles from "./governance.module.css"
import { GOVERNANCE_OPERATIONS } from "~/lib/governance"
import { tansuGovernanceUrl } from "~/lib/tansu"
import { useRootData } from "~/root"

export function meta({}: Route.MetaArgs) {
	return [{ title: "Governance — Stellar Registry" }]
}

function GovernanceIntro() {
	const { network } = useRootData()

	if (network === "mainnet") {
		return (
			<p className={styles.intro}>
				Propose a change to the Stellar Registry root registry. This opens a{" "}
				<a
					href="https://github.com/stellar-registry/gov"
					target="_blank"
					rel="noopener noreferrer"
				>
					stellar-registry/gov
				</a>{" "}
				issue for a maintainer to review.
			</p>
		)
	}

	return (
		<p className={styles.intro}>
			Propose a change to the Stellar Registry root registry. This creates a{" "}
			<a href={tansuGovernanceUrl()} target="_blank" rel="noopener noreferrer">
				Tansu DAO proposal
			</a>{" "}
			for the community to vote on.
		</p>
	)
}

export default function GovernanceIndex() {
	return (
		<main className={styles.page}>
			<div>
				<h1>Governance</h1>
				<GovernanceIntro />
			</div>
			<div className={styles.list}>
				{GOVERNANCE_OPERATIONS.map((operation) => (
					<Link key={operation.id} to={operation.path} className={styles.item}>
						<span className={styles.itemTitle}>{operation.title}</span>
						<span className={styles.itemDescription}>{operation.summary}</span>
					</Link>
				))}
			</div>
		</main>
	)
}
