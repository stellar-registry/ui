import { Form, Link } from "react-router"
import { type Route } from "./+types/home"
import styles from "./home.module.css"
import { CodeBlock } from "~/components/code-block"
import { Input } from "~/components/input"
import { Logo } from "~/components/logo"
import { useRootData } from "~/root"

export function meta({}: Route.MetaArgs) {
	return [
		{ title: "Stellar Registry" },
		{ name: "description", content: "Browse deployed Stellar smart contracts" },
	]
}

export default function Index() {
	const { network } = useRootData()

	return (
		<>
			<section className={styles.hero}>
				<div className={styles.heroInner}>
					<Logo />
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
						<Input
							name="query"
							placeholder="Search contracts by name or WASM…"
						/>
					</Form>
				</div>
			</section>

			<main className={styles.main}>
				<div className={styles.features}>
					<Link to="/wasms" className={styles.featureCard}>
						<h2 className={styles.featureTitle}>
							<svg viewBox="0 0 91.6 100">
								<path d="M0,57.7v10.1L91.6,21.1v-10.1L0,57.7Z" />
								<path d="M91.6,32.2L0,78.9v10.1l91.6-46.7v-10Z" />
								<polygon points="7.5 37 0 37 0 0 45.8 0 45.8 7.5 7.5 7.5 7.5 37" />
								<polygon points="91.6 100 46.7 100 46.7 92.5 84.1 92.5 84.1 63 91.6 63 91.6 100" />
							</svg>
							WASMs
						</h2>
						<p className={styles.featureDesc}>
							Explore published WebAssembly modules. WASMs define the logic
							shared across contract deployments and are identified by their
							content hash.
						</p>
						<span className={styles.featureLink}>Explore WASMs →</span>
					</Link>

					<Link to="/contracts" className={styles.featureCard}>
						<h2 className={styles.featureTitle}>
							<svg viewBox="0 0 91.6 100">
								<polygon points="0 77.8 91.6 31.2 91.6 22.1 0 68.8 0 77.8" />
								<polygon points="0 100 91.6 100 91.6 42.6 0 89.2 0 100" />
								<polygon points="0 0 0 57.4 91.6 10.7 91.6 0 0 0" />
							</svg>
							Contracts
						</h2>
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

				<section className={styles.install}>
					<h2 className={styles.installHeading}>Add to your project</h2>
					<p className={styles.installBody}>
						Use{" "}
						<a
							href="https://github.com/theahaco/scaffold-stellar"
							target="_blank"
							rel="noopener noreferrer"
							className={styles.installLink}
						>
							stellar-registry
						</a>{" "}
						to import contract clients directly in your Soroban smart contracts.
					</p>
					<CodeBlock lang="shell">cargo add stellar-registry</CodeBlock>
					<a
						href="https://scaffoldstellar.org/docs/registry"
						target="_blank"
						rel="noopener noreferrer"
						className={styles.aboutLink}
					>
						Read the installation guide →
					</a>
				</section>
			</main>
		</>
	)
}
