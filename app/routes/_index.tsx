import { Form, Link } from "react-router"

import { type Route } from "./+types/_index"
import styles from "./_index.module.css"
import { Input } from "~/components/input"

export function meta({}: Route.MetaArgs) {
	return [
		{ title: "Stellar Registry" },
		{ name: "description", content: "Browse deployed Stellar smart contracts" },
	]
}

export default function Index() {
	return (
		<>
			<section className={styles.hero}>
				<div className={styles.heroInner}>
					<div className={styles.heroMark}>✦</div>
					<h1 className={styles.heroHeading}>Stellar Registry</h1>
					<p className={styles.heroSub}>
						Browse and discover deployed smart contracts on the Stellar network.
					</p>
					<Form action="/contracts" method="get" className={styles.heroSearch}>
						<Input name="q" placeholder="Search contracts by name or WASM…" />
					</Form>
				</div>
			</section>

			<main className={styles.main}>
				<div className={styles.features}>
					<Link to="/wasms" className={styles.featureCard}>
						<h2 className={styles.featureTitle}>WASMs</h2>
						<p className={styles.featureDesc}>
							Explore published WebAssembly modules. WASMs define the logic
							shared across contract deployments and are identified by their
							content hash.
						</p>
						<span className={styles.featureLink}>Explore WASMs →</span>
					</Link>

					<Link to="/contracts" className={styles.featureCard}>
						<h2 className={styles.featureTitle}>Contracts</h2>
						<p className={styles.featureDesc}>
							Browse deployed contract instances. Each contract is a live
							on-chain deployment with a unique address, linked to a published
							WASM module.
						</p>
						<span className={styles.featureLink}>Browse contracts →</span>
					</Link>
				</div>
			</main>
		</>
	)
}
