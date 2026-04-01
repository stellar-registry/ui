import { Form, Link, useRouteLoaderData } from "react-router"

import { type Route } from "./+types/home"
import styles from "./home.module.css"
import { Input } from "~/components/input"
import { type loader as rootLoader } from "~/root"

export function meta({}: Route.MetaArgs) {
	return [
		{ title: "Stellar Registry" },
		{ name: "description", content: "Browse deployed Stellar smart contracts" },
	]
}

export default function Index() {
	const { network } = useRouteLoaderData<typeof rootLoader>("root")

	return (
		<>
			<section className={styles.hero}>
				<div className={styles.heroInner}>
					<div className={styles.heroMark}>✦</div>
					<div className={styles.heroHeadingWrapper}>
						<h1 className={styles.heroHeading}>Stellar Registry</h1>
						{network === "testnet" && (
							<span className={styles.testnetStamp}>Testnet</span>
						)}
					</div>
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

				<section className={styles.about}>
					<h2 className={styles.aboutHeading}>What is the Stellar Registry?</h2>
					<p className={styles.aboutBody}>
						The Stellar Registry is a naming and discovery system for smart
						contracts on the Stellar network. Rather than tracking raw contract
						addresses, it lets developers publish and find{" "}
						<strong>contracts by name</strong>, making it easier to build on top
						of existing on-chain logic and standardizing how contracts are
						deployed and referenced.
					</p>
					<p className={styles.aboutBody}>
						The registry separates two distinct concepts: <strong>WASMs</strong>
						, the compiled WebAssembly modules that define contract logic and
						are identified by their content hash, and <strong>Contracts</strong>
						, which are live deployed instances of those modules.
					</p>
					<a
						href="https://scaffoldstellar.org/docs/registry"
						target="_blank"
						rel="noopener noreferrer"
						className={styles.aboutLink}
					>
						Read the full documentation →
					</a>
				</section>
			</main>
		</>
	)
}
