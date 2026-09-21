import { Link } from "react-router"
import styles from "./governance.module.css"
import { tansuGovernanceUrl } from "~/lib/tansu"
import { useRootData } from "~/root"

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
				<Link to="/governance/add-contract" className={styles.item}>
					<span className={styles.itemTitle}>
						Add contract to root registry
					</span>
					<span className={styles.itemDescription}>
						Register a deployed contract instance in the root registry.
					</span>
				</Link>
				<Link to="/governance/add-wasm" className={styles.item}>
					<span className={styles.itemTitle}>Add wasm to root registry</span>
					<span className={styles.itemDescription}>
						Publish a wasm hash under a new name in the root registry.
					</span>
				</Link>
				<div className={styles.itemDisabled}>
					<span className={styles.itemTitle}>Create a new subregistry</span>
					<span className={styles.itemDescription}>
						Create a new named channel for grouping related Wasms and contracts.
					</span>
					<span className={styles.comingSoon}>Coming soon</span>
				</div>
			</div>
		</main>
	)
}
