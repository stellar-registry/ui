import { Link } from "react-router"
import styles from "./governance.module.css"

export default function GovernanceIndex() {
	return (
		<main className={styles.page}>
			<div>
				<h1>Governance</h1>
				<p className={styles.intro}>
					Propose a change to the Stellar Registry root registry. On testnet
					this creates a Tansu DAO proposal; on mainnet it opens a{" "}
					<a
						href="https://github.com/stellar-registry/gov"
						target="_blank"
						rel="noopener noreferrer"
					>
						stellar-registry/gov
					</a>{" "}
					issue for review.
				</p>
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
				<div className={styles.itemDisabled}>
					<span className={styles.itemTitle}>Add wasm to root registry</span>
					<span className={styles.itemDescription}>
						Promote an already-published Wasm into the root registry.
					</span>
					<span className={styles.comingSoon}>Coming soon</span>
				</div>
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
