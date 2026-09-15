import {
	ArrowLeftRight,
	ArrowRight,
	BadgeCheck,
	Check,
	CheckCircle2,
	ChevronDown,
	CircleMinus,
	Clock3,
	Coins,
	Copy,
	FileClock,
	Laptop,
	Moon,
	Play,
	RotateCcw,
	Search,
	ShieldCheck,
	Smartphone,
	Sun,
	UserRoundPlus,
	WalletCards,
} from "lucide-react"
import { type FormEvent, type ReactNode, useEffect, useState } from "react"
import { Link, useNavigate, useParams } from "react-router"

import { type Route } from "./+types/explorerPreview"
import styles from "./explorerPreview.module.css"

type Direction = "continuum" | "workbench" | "console"
type ExplorerScreen = "open" | "overview" | "interact" | "proposal"
type FixtureKey = "token" | "registry" | "nido"
type PreviewNetwork = "Testnet" | "Mainnet" | "Custom"

type Fixture = {
	name: string
	version: string
	kind: string
	id: string
	primaryFunction: string
	description: string
	argumentOne: { label: string; type: string; value: string }
	argumentTwo: { label: string; type: string; value: string }
	amount: { label: string; type: string; value: string; unit: string }
	effect: string
	fee: string
	result: string
	clientCode: string
	cliCode: string
	functions: Array<{ name: string; kind: "read" | "write" }>
}

const directionOrder: Direction[] = ["continuum", "workbench", "console"]

const screenLabels: Record<ExplorerScreen, string> = {
	open: "Open",
	overview: "Overview",
	interact: "Interact",
	proposal: "Proposal",
}

const directionDetails: Record<
	Direction,
	{
		number: string
		title: string
		summary: string
		best: string
		tradeoff: string
	}
> = {
	continuum: {
		number: "01",
		title: "Registry Continuum",
		summary:
			"A quiet, provenance-first document that unfolds from identity to code to interaction.",
		best: "Best when trust and registered context should lead.",
		tradeoff: "Slower for repeated function calls.",
	},
	workbench: {
		number: "02",
		title: "Focused Workbench",
		summary:
			"A compact three-pane tool that keeps functions, arguments, and consequences in one line of sight.",
		best: "Best default for Lab-like daily use.",
		tradeoff: "The densest direction on small screens.",
	},
	console: {
		number: "03",
		title: "Collaborative Console",
		summary:
			"An intent-and-approval workspace where simulation naturally becomes a shared proposal.",
		best: "Best for Nido and multisig workflows.",
		tradeoff: "Collaboration is prominent for solo users.",
	},
}

const fixtures: Record<FixtureKey, Fixture> = {
	token: {
		name: "payments/usdc",
		version: "2.3.1",
		kind: "Token contract",
		id: "CDLZFC3SYJYD4L…KWB3ZK7",
		primaryFunction: "transfer",
		description: "Move an exact token amount between accounts.",
		argumentOne: { label: "from", type: "Address", value: "nido:treasury" },
		argumentTwo: {
			label: "to",
			type: "Address",
			value: "alice*example.org",
		},
		amount: { label: "amount", type: "i128", value: "500.00", unit: "USDC" },
		effect: "Send 500.00 USDC to alice*example.org",
		fee: "0.047 XLM",
		result: "Transfer completed",
		clientCode: "await token.transfer({ from, to, amount })",
		cliCode:
			"stellar contract invoke --id payments/usdc -- transfer --from nido:treasury --to alice*example.org --amount 5000000000",
		functions: [
			{ name: "balance", kind: "read" },
			{ name: "transfer", kind: "write" },
			{ name: "approve", kind: "write" },
			{ name: "allowance", kind: "read" },
			{ name: "decimals", kind: "read" },
		],
	},
	registry: {
		name: "stellar-registry",
		version: "1.8.0",
		kind: "Registry contract",
		id: "CCK3RBQWNYQ23Y…M7K9E2A",
		primaryFunction: "deploy",
		description: "Deploy a registered Wasm version with a stable name.",
		argumentOne: { label: "name", type: "String", value: "payments/router" },
		argumentTwo: { label: "version", type: "String", value: "1.4.0" },
		amount: { label: "instances", type: "u32", value: "1", unit: "contract" },
		effect: "Deploy payments/router at version 1.4.0",
		fee: "0.183 XLM",
		result: "Contract CBQVM…A7PJ",
		clientCode: "await registry.deploy({ name, version, salt })",
		cliCode:
			"stellar registry deploy payments/router@1.4.0 --network testnet --source me",
		functions: [
			{ name: "resolve", kind: "read" },
			{ name: "publish", kind: "write" },
			{ name: "deploy", kind: "write" },
			{ name: "versions", kind: "read" },
			{ name: "owner", kind: "read" },
		],
	},
	nido: {
		name: "nido/proposal-policy",
		version: "preview",
		kind: "Account policy",
		id: "CBNIDO7MWGJX…P4SSKY",
		primaryFunction: "create_proposal",
		description: "Publish a typed invocation for retractable approval.",
		argumentOne: { label: "account", type: "Address", value: "nido:treasury" },
		argumentTwo: { label: "review delay", type: "Duration", value: "1 hour" },
		amount: { label: "expires in", type: "Duration", value: "7", unit: "days" },
		effect: "Create a 2-of-3 approval request",
		fee: "Sponsored",
		result: "Proposal PR-8D21",
		clientCode: "await proposalPolicy.create({ intent, deadline })",
		cliCode: "nido proposal create --account treasury --review 1h --expires 7d",
		functions: [
			{ name: "get_proposal", kind: "read" },
			{ name: "create_proposal", kind: "write" },
			{ name: "approve", kind: "write" },
			{ name: "retract", kind: "write" },
			{ name: "execute", kind: "write" },
		],
	},
}

const buildTrail = [
	{
		phase: "Trailhead · choose",
		title: "Direction decision",
		body: "Walk all three previews with five tasks: locate, inspect, simulate, submit, and create a proposal. Choose one structural foundation and name the exact traits imported from the others.",
		checks: ["Decision record", "Desktop and narrow acceptance captures"],
	},
	{
		phase: "Camp 1 · bones",
		title: "Shell and resolver",
		body: "Build the compact header, omnibox, URL state, network boundary, Registry-name resolver, raw-ID fallback, recents, and deterministic error states.",
		checks: [
			"IDs, names, and proposal links resolve",
			"Reading needs no wallet",
		],
	},
	{
		phase: "Camp 2 · language",
		title: "Friendly contract interface",
		body: "Turn contract specs into searchable functions and typed controls for addresses, numbers, enums, bytes, maps, optionals, and nested values without exposing serialization formats.",
		checks: [
			"Complex arguments remain understandable",
			"Generated code agrees with the form",
		],
	},
	{
		phase: "Camp 3 · truth",
		title: "Simulation as the center",
		body: "Normalize decoded returns, state changes, events, resources, fees, authorization, restoration, and failure recovery into one result model.",
		checks: [
			"Argument edits invalidate old results",
			"Reopening pulls fresh chain state",
		],
	},
	{
		phase: "Camp 4 · action",
		title: "Signing and temporary Testnet account",
		body: "Connect wallets only at authorization time. Add a plain-language temporary Testnet account, persistent until Reset, and a post-success handoff to create a durable Nido account.",
		checks: [
			"No Friendbot language",
			"Mainnet never offers temporary credentials",
		],
	},
	{
		phase: "Camp 5 · Registry",
		title: "Guided registered deployment",
		body: "Recognize Registry contracts and transform their generic functions into a guided publish and deploy path while retaining the underlying interface.",
		checks: [
			"Generic engine stays authoritative",
			"Unregistered contracts get a soft naming invitation",
		],
	},
	{
		phase: "Camp 6 · bridge",
		title: "Shareable immutable proposals",
		body: "Package typed intent, constraints, author note, network, rule fingerprint, nonce, and deadline. Keep approvals separate so the proposal link remains stable.",
		checks: ["Edits create a new revision", "Old revisions show Superseded"],
	},
	{
		phase: "Camp 7 · Nido",
		title: "Immediate multisig handoff",
		body: "Use Nido’s existing content-addressed transaction relay for synchronous co-signing and render every requested authorization in human terms.",
		checks: [
			"No raw envelope workflow",
			"Downloaded transaction hashes are verified",
		],
	},
	{
		phase: "Frontier · on-chain",
		title: "Retractable proposal policy",
		body: "Design and audit a stateful policy with approve, retract, review countdown, expiry, frozen Ready state, retryable execution, rule-change invalidation, and replay-safe relayed votes.",
		checks: [
			"Old relayed approvals cannot undo retraction",
			"No signer or creator gains a veto",
		],
	},
	{
		phase: "Summit · prove",
		title: "Hardening and release",
		body: "Complete keyboard, screen-reader, 320px, dark theme, adversarial copy, stale simulation, custom-network, property, and end-to-end Testnet passes.",
		checks: [
			"Consequential screens show evidence",
			"Explorer ships independently of future policy work",
		],
	},
]

function isDirection(value: string | undefined): value is Direction {
	return directionOrder.includes(value as Direction)
}

export function meta({ params }: Route.MetaArgs) {
	const direction = isDirection(params.direction)
		? directionDetails[params.direction].title
		: "Design directions"
	return [
		{ title: `${direction} — Contract Explorer preview` },
		{
			name: "description",
			content:
				"Interactive design previews for the Stellar Registry Contract Explorer.",
		},
	]
}

export default function ExplorerPreview() {
	const { direction } = useParams<"direction">()

	if (!isDirection(direction)) return <DirectionIndex />
	return <DirectionPreview direction={direction} />
}

function PreviewMark() {
	return <span className={styles.brandMark}>S</span>
}

function PreviewNotice({ children }: { children: ReactNode }) {
	return (
		<span className={styles.previewNotice}>
			<span className={styles.dot} />
			{children}
		</span>
	)
}

function DirectionIndex() {
	return (
		<main className={styles.indexPage}>
			<header className={styles.indexHeader}>
				<div className={styles.indexBrand}>
					<PreviewMark />
					<span>Stellar Registry</span>
				</div>
				<PreviewNotice>Design preview · deterministic fixtures</PreviewNotice>
			</header>

			<section className={styles.indexHero}>
				<p className={styles.eyebrow}>Contract Explorer</p>
				<h1>Three credible foundations</h1>
				<p>
					Each direction supports the complete path from contract discovery to a
					decoded result and shared approval. The question is which concern
					leads.
				</p>
			</section>

			<section className={styles.directionCards} aria-label="Design directions">
				{directionOrder.map((key) => {
					const item = directionDetails[key]
					return (
						<article
							className={`${styles.directionCard} ${key === "workbench" ? styles.currentLean : ""}`}
							key={key}
						>
							<div className={styles.directionCardTop}>
								<span>{item.number}</span>
								{key === "workbench" && (
									<PreviewNotice>Current lean</PreviewNotice>
								)}
							</div>
							<h2>{item.title}</h2>
							<p>{item.summary}</p>
							<dl>
								<dt>Best at</dt>
								<dd>{item.best}</dd>
								<dt>Watch for</dt>
								<dd>{item.tradeoff}</dd>
							</dl>
							<Link
								className={styles.primaryLink}
								to={`/explorer-preview/${key}`}
							>
								Open full preview <ArrowRight size={16} />
							</Link>
						</article>
					)
				})}
			</section>

			<section className={styles.comparisonSection}>
				<div className={styles.sectionHeading}>
					<div>
						<p className={styles.eyebrow}>Decision lens</p>
						<h2>Compare without averaging</h2>
					</div>
					<p>
						Choose one structure, then import specific strengths from the
						others.
					</p>
				</div>
				<div className={styles.tableWrap}>
					<table className={styles.comparisonTable}>
						<thead>
							<tr>
								<th>Decision lens</th>
								<th>Continuum</th>
								<th>Workbench</th>
								<th>Console</th>
							</tr>
						</thead>
						<tbody>
							<ComparisonRow
								label="First impression"
								values={[
									"Trusted reference",
									"Serious developer tool",
									"Shared operations room",
								]}
							/>
							<ComparisonRow
								label="Repeated calls"
								values={["Good", "Strongest", "Good"]}
							/>
							<ComparisonRow
								label="Provenance"
								values={[
									"Strongest",
									"Compact side context",
									"Contextual evidence",
								]}
							/>
							<ComparisonRow
								label="Proposal review"
								values={[
									"Readable narrative",
									"Efficient checklist",
									"Strongest",
								]}
							/>
							<ComparisonRow
								label="Narrow screens"
								values={[
									"Natural document flow",
									"Panes become a sequence",
									"Builder stacks above approvals",
								]}
							/>
							<ComparisonRow
								label="Best trait to export"
								values={[
									"Provenance hierarchy",
									"Invocation workspace",
									"Approval state model",
								]}
							/>
						</tbody>
					</table>
				</div>
				<div className={styles.recommendation}>
					<BadgeCheck size={18} />
					<p>
						<strong>Recommended synthesis:</strong> Focused Workbench as the
						foundation, Continuum’s provenance hierarchy, and Console’s
						collaboration model only when an invocation becomes a proposal.
					</p>
				</div>
			</section>

			<section className={styles.roadmapSection}>
				<div className={styles.sectionHeading}>
					<div>
						<p className={styles.eyebrow}>The build trail</p>
						<h2>From design choice to trustworthy tool</h2>
					</div>
					<p>
						Each camp produces something independently testable. The on-chain
						frontier never holds the explorer hostage.
					</p>
				</div>
				<div className={styles.roadmapList}>
					{buildTrail.map((item, index) => (
						<details
							className={styles.roadmapItem}
							key={item.phase}
							open={index < 2}
						>
							<summary>
								<span>{item.phase}</span>
								<strong>{item.title}</strong>
								<ChevronDown size={16} />
							</summary>
							<div className={styles.roadmapBody}>
								<p>{item.body}</p>
								<ul>
									{item.checks.map((check) => (
										<li key={check}>
											<Check size={15} /> {check}
										</li>
									))}
								</ul>
							</div>
						</details>
					))}
				</div>
			</section>
		</main>
	)
}

function ComparisonRow({ label, values }: { label: string; values: string[] }) {
	return (
		<tr>
			<th>{label}</th>
			{values.map((value, index) => (
				<td key={`${value}-${index}`}>{value}</td>
			))}
		</tr>
	)
}

function DirectionPreview({ direction }: { direction: Direction }) {
	const navigate = useNavigate()
	const detail = directionDetails[direction]
	const [screen, setScreen] = useState<ExplorerScreen>("interact")
	const [fixtureKey, setFixtureKey] = useState<FixtureKey>("token")
	const [network, setNetwork] = useState<PreviewNetwork>("Testnet")
	const [isMobile, setIsMobile] = useState(false)
	const [isDark, setIsDark] = useState(false)
	const [simulated, setSimulated] = useState(true)
	const [approved, setApproved] = useState(false)
	const [walletOpen, setWalletOpen] = useState(false)
	const [account, setAccount] = useState<"none" | "temporary" | "wallet">(
		"none",
	)
	const [copied, setCopied] = useState(false)
	const [submitted, setSubmitted] = useState(false)
	const [query, setQuery] = useState(fixtures.token.name)
	const fixture = fixtures[fixtureKey]

	useEffect(() => {
		setIsDark(document.documentElement.classList.contains("dark"))
	}, [])

	useEffect(() => {
		setQuery(fixture.name)
		setSimulated(true)
		setApproved(false)
		setSubmitted(false)
	}, [fixture])

	function toggleTheme() {
		const next = !isDark
		setIsDark(next)
		document.documentElement.classList.toggle("dark", next)
		localStorage.setItem("theme", next ? "dark" : "light")
	}

	function openQuery(event: FormEvent<HTMLFormElement>) {
		event.preventDefault()
		const normalized = query.toLowerCase()
		if (normalized.includes("registry")) setFixtureKey("registry")
		else if (normalized.includes("nido") || normalized.includes("proposal"))
			setFixtureKey("nido")
		else setFixtureKey("token")
		setScreen("overview")
	}

	function chooseFixture(next: FixtureKey) {
		setFixtureKey(next)
		setSimulated(true)
	}

	function chooseFunction(name: string) {
		setScreen("interact")
		setSimulated(name === fixture.primaryFunction)
	}

	function chooseAccount(next: "temporary" | "wallet") {
		setAccount(next)
		setWalletOpen(false)
	}

	function submit() {
		if (account === "none") {
			setWalletOpen(true)
			return
		}
		setSubmitted(true)
	}

	function copyProposal() {
		setCopied(true)
		void navigator.clipboard?.writeText(
			"https://stellar.rgstry.xyz/proposals/PR-8D21",
		)
	}

	return (
		<main className={styles.previewPage}>
			<header className={styles.previewBar}>
				<Link to="/explorer-preview" className={styles.backLink}>
					<ArrowRight size={16} /> All directions
				</Link>
				<nav aria-label="Switch design direction">
					{directionOrder.map((key) => (
						<Link
							to={`/explorer-preview/${key}`}
							aria-current={direction === key ? "page" : undefined}
							key={key}
						>
							{directionDetails[key].number} {directionDetails[key].title}
						</Link>
					))}
				</nav>
				<button type="button" onClick={() => setIsMobile((value) => !value)}>
					{isMobile ? <Laptop size={16} /> : <Smartphone size={16} />}
					{isMobile ? "Desktop" : "Mobile"}
				</button>
			</header>

			<section className={styles.directionIntro}>
				<div>
					<p className={styles.eyebrow}>Design direction</p>
					<h1>{detail.title}</h1>
					<p>{detail.summary}</p>
				</div>
				<div className={styles.directionThesis}>
					<strong>{detail.best}</strong>
					<span>{detail.tradeoff}</span>
				</div>
			</section>

			<div className={styles.productStage}>
				<section
					className={`${styles.productWindow} ${isMobile ? styles.mobileWindow : ""}`}
					aria-label={`${detail.title} product preview`}
				>
					<header className={styles.productHeader}>
						<Link to="/explorer-preview" className={styles.productBrand}>
							<PreviewMark />
							<span>
								<strong>Stellar Registry</strong>
								<small>Contract Explorer</small>
							</span>
						</Link>
						<form className={styles.omnibox} onSubmit={openQuery}>
							<Search size={16} />
							<input
								aria-label="Contract, Registry name, or proposal"
								value={query}
								onChange={(event) => setQuery(event.target.value)}
							/>
							<kbd>⌘ K</kbd>
						</form>
						<div className={styles.productActions}>
							<select
								aria-label="Network"
								value={network}
								onChange={(event) =>
									setNetwork(event.target.value as PreviewNetwork)
								}
							>
								<option>Testnet</option>
								<option>Mainnet</option>
								<option>Custom</option>
							</select>
							<button
								type="button"
								className={styles.iconButton}
								onClick={toggleTheme}
								aria-label={isDark ? "Use light theme" : "Use dark theme"}
							>
								{isDark ? <Sun size={16} /> : <Moon size={16} />}
							</button>
							<div className={styles.walletControl}>
								<button
									type="button"
									className={styles.walletButton}
									onClick={() => setWalletOpen((value) => !value)}
									aria-expanded={walletOpen}
								>
									<WalletCards size={16} />
									<span>
										{account === "temporary"
											? "Temporary account"
											: account === "wallet"
												? "GDKQ…7M2"
												: "Connect"}
									</span>
								</button>
								{walletOpen && (
									<div
										className={styles.walletMenu}
										role="dialog"
										aria-label="Choose signing account"
									>
										<h2>Choose a signing account</h2>
										{network === "Testnet" && (
											<button
												type="button"
												onClick={() => chooseAccount("temporary")}
											>
												<UserRoundPlus size={17} />
												<span>
													<strong>Use a temporary Testnet account</strong>
													<small>
														Ready in moments. Reset whenever you want.
													</small>
												</span>
											</button>
										)}
										<button
											type="button"
											onClick={() => chooseAccount("wallet")}
										>
											<WalletCards size={17} />
											<span>
												<strong>Connect an existing wallet</strong>
												<small>Choose a wallet only when signing.</small>
											</span>
										</button>
										{account !== "none" && (
											<button
												type="button"
												className={styles.resetAccount}
												onClick={() => {
													setAccount("none")
													setWalletOpen(false)
												}}
											>
												<RotateCcw size={15} /> Reset account
											</button>
										)}
									</div>
								)}
							</div>
						</div>
					</header>

					<div className={styles.contextBar}>
						<nav aria-label="Contract Explorer views">
							{(
								["open", "overview", "interact", "proposal"] as ExplorerScreen[]
							).map((item) => (
								<button
									type="button"
									className={screen === item ? styles.activeTab : ""}
									onClick={() => setScreen(item)}
									aria-current={screen === item ? "page" : undefined}
									key={item}
								>
									{screenLabels[item]}
								</button>
							))}
						</nav>
						<label>
							<span>Fixture</span>
							<select
								value={fixtureKey}
								onChange={(event) =>
									chooseFixture(event.target.value as FixtureKey)
								}
							>
								<option value="token">Token transfer</option>
								<option value="registry">Registry deploy</option>
								<option value="nido">Nido policy</option>
							</select>
						</label>
					</div>

					<div className={styles.productMain} aria-live="polite">
						{screen === "open" && (
							<OpenScreen
								direction={direction}
								onOpen={(key) => {
									chooseFixture(key)
									setScreen("overview")
								}}
							/>
						)}
						{screen === "overview" && (
							<OverviewScreen
								direction={direction}
								fixture={fixture}
								onFunction={chooseFunction}
							/>
						)}
						{screen === "interact" && (
							<InteractScreen
								direction={direction}
								fixture={fixture}
								simulated={simulated}
								submitted={submitted}
								onFunction={chooseFunction}
								onSimulate={() => {
									setSimulated(true)
									setSubmitted(false)
								}}
								onReset={() => {
									setSimulated(false)
									setSubmitted(false)
								}}
								onSubmit={submit}
								onProposal={() => setScreen("proposal")}
							/>
						)}
						{screen === "proposal" && (
							<ProposalScreen
								direction={direction}
								fixture={fixture}
								approved={approved}
								copied={copied}
								onApproval={() => setApproved((value) => !value)}
								onCopy={copyProposal}
							/>
						)}
					</div>
				</section>
			</div>

			<footer className={styles.previewFooter}>
				<p>
					Preview data only. No network request, wallet signature, or submission
					occurs.
				</p>
				<button type="button" onClick={() => navigate("/explorer-preview")}>
					Compare directions
				</button>
			</footer>
		</main>
	)
}

function OpenScreen({
	direction,
	onOpen,
}: {
	direction: Direction
	onOpen: (key: FixtureKey) => void
}) {
	return (
		<section className={styles.openScreen}>
			<div>
				<p className={styles.eyebrow}>Mainnet · Testnet · Custom</p>
				<h2>
					{direction === "console"
						? "Open a contract or approval request"
						: "Find a contract"}
				</h2>
				<p>Use a Registry name, contract ID, or proposal link.</p>
			</div>
			<label className={styles.largeSearch}>
				<Search size={18} />
				<span className={styles.srOnly}>Open a contract</span>
				<input placeholder="payments/usdc or C…" />
			</label>
			<div className={styles.openColumns}>
				<section>
					<h3>Recent</h3>
					<OpenRow
						title="payments/usdc"
						description="Token · 8 minutes ago"
						onClick={() => onOpen("token")}
					/>
					<OpenRow
						title="stellar-registry"
						description="Registry · yesterday"
						onClick={() => onOpen("registry")}
					/>
				</section>
				<section>
					<h3>
						{direction === "console" ? "Awaiting you" : "Registry suggestions"}
					</h3>
					<OpenRow
						title={
							direction === "console" ? "Treasury transfer" : "payments/router"
						}
						description={
							direction === "console"
								? "1 of 2 approvals · expires in 3d"
								: "Verified build · v1.4.0"
						}
						onClick={() =>
							onOpen(direction === "console" ? "nido" : "registry")
						}
					/>
					<OpenRow
						title={direction === "console" ? "Upgrade policy" : "nido/account"}
						description={
							direction === "console"
								? "Ready to execute"
								: "Verified build · preview"
						}
						onClick={() => onOpen("nido")}
					/>
				</section>
			</div>
		</section>
	)
}

function OpenRow({
	title,
	description,
	onClick,
}: {
	title: string
	description: string
	onClick: () => void
}) {
	return (
		<button type="button" className={styles.openRow} onClick={onClick}>
			<span>
				<strong>{title}</strong>
				<small>{description}</small>
			</span>
			<ArrowRight size={16} />
		</button>
	)
}

function ContractIdentity({ fixture }: { fixture: Fixture }) {
	return (
		<header className={styles.contractIdentity}>
			<div>
				<p className={styles.eyebrow}>{fixture.kind}</p>
				<h2>{fixture.name}</h2>
				<code>{fixture.id}</code>
			</div>
			<PreviewNotice>
				{fixture.version === "preview"
					? "Design preview"
					: `Registered · v${fixture.version}`}
			</PreviewNotice>
		</header>
	)
}

function FunctionList({
	fixture,
	onFunction,
}: {
	fixture: Fixture
	onFunction: (name: string) => void
}) {
	return (
		<div className={styles.functionList}>
			{fixture.functions.map((item) => (
				<button
					type="button"
					className={
						item.name === fixture.primaryFunction ? styles.selectedFunction : ""
					}
					onClick={() => onFunction(item.name)}
					key={item.name}
				>
					<code>{item.name}</code>
					<small>{item.kind}</small>
				</button>
			))}
		</div>
	)
}

function OverviewScreen({
	direction,
	fixture,
	onFunction,
}: {
	direction: Direction
	fixture: Fixture
	onFunction: (name: string) => void
}) {
	if (direction === "continuum") {
		return (
			<div className={styles.continuumLayout}>
				<SectionRail active="Identity" />
				<article className={styles.continuumContent}>
					<ContractIdentity fixture={fixture} />
					<p className={styles.lead}>{fixture.description}</p>
					<div className={styles.continuumColumns}>
						<div>
							<Provenance />
							<section className={styles.contentSection}>
								<div className={styles.contentHeading}>
									<h3>Functions</h3>
									<span>{fixture.functions.length} exported</span>
								</div>
								<FunctionRows fixture={fixture} onFunction={onFunction} />
							</section>
						</div>
						<RegistryAside fixture={fixture} />
					</div>
				</article>
			</div>
		)
	}

	if (direction === "workbench") {
		return (
			<div className={styles.workbenchOverview}>
				<aside className={styles.pane}>
					<p className={styles.paneTitle}>Functions</p>
					<FunctionList fixture={fixture} onFunction={onFunction} />
				</aside>
				<article className={styles.pane}>
					<ContractIdentity fixture={fixture} />
					<div className={styles.rule} />
					<h3>Interface</h3>
					<p>{fixture.description}</p>
					<pre>
						<code>
							{fixture.primaryFunction}({fixture.argumentOne.label}:{" "}
							{fixture.argumentOne.type}, {fixture.argumentTwo.label}:{" "}
							{fixture.argumentTwo.type}, {fixture.amount.label}:{" "}
							{fixture.amount.type})
						</code>
					</pre>
					<div className={styles.rule} />
					<h3>Recent activity</h3>
					<ActivityRow
						icon={<CheckCircle2 size={16} />}
						title="Successful invocation"
						body={`12 minutes ago · ${fixture.primaryFunction}`}
					/>
					<ActivityRow
						icon={<FileClock size={16} />}
						title="Simulation inspected"
						body="Yesterday · no submission"
					/>
				</article>
				<aside className={styles.pane}>
					<RegistryAside fixture={fixture} />
				</aside>
			</div>
		)
	}

	return (
		<div className={styles.consoleLayout}>
			<article className={styles.consolePrimary}>
				<ContractIdentity fixture={fixture} />
				<div className={styles.rule} />
				<div className={styles.contentHeading}>
					<div>
						<h3>Interface</h3>
						<span>{fixture.functions.length} exported functions</span>
					</div>
					<button
						type="button"
						onClick={() => onFunction(fixture.primaryFunction)}
					>
						Prepare a call
					</button>
				</div>
				<FunctionRows fixture={fixture} onFunction={onFunction} />
			</article>
			<aside className={styles.consoleSide}>
				<h3>Account readiness</h3>
				<div className={styles.callout}>
					<strong>Nido proposals available</strong>
					<p>2-of-3 approvals · 1-hour review delay · 7-day expiry.</p>
				</div>
				<div className={styles.rule} />
				<h3>Open proposals</h3>
				<ProposalRow
					title="Treasury transfer"
					body="Review ends in 42m"
					status="2 of 3"
				/>
				<ProposalRow
					title="Registry deployment"
					body="Awaiting one approval"
					status="1 of 2"
				/>
			</aside>
		</div>
	)
}

function SectionRail({ active }: { active: string }) {
	return (
		<aside className={styles.sectionRail}>
			{["Identity", "Provenance", "Interface", "Storage", "Activity"].map(
				(item) => (
					<button
						type="button"
						className={item === active ? styles.activeRail : ""}
						key={item}
					>
						{item}
					</button>
				),
			)}
		</aside>
	)
}

function Provenance() {
	return (
		<section className={styles.contentSection}>
			<div className={styles.contentHeading}>
				<h3>Provenance</h3>
				<a href="#registry-record">View registry record</a>
			</div>
			<dl className={styles.keyValues}>
				<dt>Published by</dt>
				<dd>Stellar Registry maintainers</dd>
				<dt>Wasm hash</dt>
				<dd>
					<code>7d9f…e201</code>
				</dd>
				<dt>Source</dt>
				<dd>
					<a href="#source">Verified repository</a>
				</dd>
				<dt>Build</dt>
				<dd>Reproducible</dd>
			</dl>
		</section>
	)
}

function RegistryAside({ fixture }: { fixture: Fixture }) {
	return (
		<div className={styles.asideStack}>
			<div>
				<p className={styles.paneTitle}>Registry context</p>
				<PreviewNotice>
					{fixture.version === "preview" ? "Preview" : "Verified build"}
				</PreviewNotice>
			</div>
			<dl className={styles.keyValues}>
				<dt>Name</dt>
				<dd>{fixture.name}</dd>
				<dt>Version</dt>
				<dd>{fixture.version}</dd>
				<dt>Wasm</dt>
				<dd>
					<code>7d9f…e201</code>
				</dd>
				<dt>Source</dt>
				<dd>
					<a href="#source">Open source</a>
				</dd>
			</dl>
			<div className={styles.callout}>
				<strong>Stable identity</strong>
				<p>This Registry name resolves to the displayed contract and build.</p>
			</div>
		</div>
	)
}

function FunctionRows({
	fixture,
	onFunction,
}: {
	fixture: Fixture
	onFunction: (name: string) => void
}) {
	return (
		<div>
			{fixture.functions.map((item) => (
				<div className={styles.functionRow} key={item.name}>
					<strong>
						<code>{item.name}</code>
					</strong>
					<span>
						{item.name === fixture.primaryFunction
							? fixture.description
							: `${item.kind === "read" ? "Read" : "Change"} contract state.`}
					</span>
					<button type="button" onClick={() => onFunction(item.name)}>
						{item.kind === "read" ? "Run" : "Prepare"}
					</button>
				</div>
			))}
		</div>
	)
}

function ActivityRow({
	icon,
	title,
	body,
}: {
	icon: ReactNode
	title: string
	body: string
}) {
	return (
		<div className={styles.activityRow}>
			{icon}
			<span>
				<strong>{title}</strong>
				<small>{body}</small>
			</span>
		</div>
	)
}

function ProposalRow({
	title,
	body,
	status,
}: {
	title: string
	body: string
	status: string
}) {
	return (
		<div className={styles.proposalRow}>
			<span>
				<strong>{title}</strong>
				<small>{body}</small>
			</span>
			<PreviewNotice>{status}</PreviewNotice>
		</div>
	)
}

type InteractProps = {
	direction: Direction
	fixture: Fixture
	simulated: boolean
	submitted: boolean
	onFunction: (name: string) => void
	onSimulate: () => void
	onReset: () => void
	onSubmit: () => void
	onProposal: () => void
}

function InteractScreen(props: InteractProps) {
	const {
		direction,
		fixture,
		simulated,
		submitted,
		onFunction,
		onSimulate,
		onReset,
		onSubmit,
		onProposal,
	} = props
	if (direction === "continuum") {
		return (
			<div className={styles.continuumLayout}>
				<aside className={styles.sectionRail}>
					<p className={styles.paneTitle}>Functions</p>
					<FunctionList fixture={fixture} onFunction={onFunction} />
				</aside>
				<article className={styles.continuumContent}>
					<InvocationHeading fixture={fixture} />
					<div className={styles.continuumColumns}>
						<div>
							<ArgumentFields fixture={fixture} />
							<ActionRow onSimulate={onSimulate} onReset={onReset} />
							<CodeExample fixture={fixture} />
						</div>
						<aside>
							<h3>Review</h3>
							<Simulation
								fixture={fixture}
								simulated={simulated}
								submitted={submitted}
							/>
							<PostSimulation
								simulated={simulated}
								onSubmit={onSubmit}
								onProposal={onProposal}
							/>
						</aside>
					</div>
				</article>
			</div>
		)
	}

	if (direction === "workbench") {
		return (
			<div className={styles.workbenchLayout}>
				<aside className={styles.pane}>
					<p className={styles.paneTitle}>Functions</p>
					<FunctionList fixture={fixture} onFunction={onFunction} />
				</aside>
				<article className={styles.pane}>
					<InvocationHeading fixture={fixture} />
					<ArgumentFields fixture={fixture} />
					<ActionRow onSimulate={onSimulate} onReset={onReset} />
				</article>
				<aside className={styles.pane}>
					<p className={styles.paneTitle}>Consequences</p>
					<Simulation
						fixture={fixture}
						simulated={simulated}
						submitted={submitted}
					/>
					<PostSimulation
						simulated={simulated}
						onSubmit={onSubmit}
						onProposal={onProposal}
					/>
				</aside>
			</div>
		)
	}

	return (
		<div className={styles.consoleLayout}>
			<article className={styles.consolePrimary}>
				<InvocationHeading fixture={fixture} />
				<ArgumentFields fixture={fixture} />
				<ActionRow onSimulate={onSimulate} onReset={onReset} />
				<CodeExample fixture={fixture} />
			</article>
			<aside className={styles.consoleSide}>
				<p className={styles.paneTitle}>Review before authorization</p>
				<Simulation
					fixture={fixture}
					simulated={simulated}
					submitted={submitted}
					compact
				/>
				<PostSimulation
					simulated={simulated}
					onSubmit={onSubmit}
					onProposal={onProposal}
				/>
			</aside>
		</div>
	)
}

function InvocationHeading({ fixture }: { fixture: Fixture }) {
	return (
		<header className={styles.invocationHeading}>
			<div>
				<p className={styles.eyebrow}>{fixture.name}</p>
				<h2>
					<code>{fixture.primaryFunction}</code>
				</h2>
				<p>{fixture.description}</p>
			</div>
			<span>write</span>
		</header>
	)
}

function ArgumentFields({ fixture }: { fixture: Fixture }) {
	return (
		<div className={styles.argumentFields}>
			<label>
				{fixture.argumentOne.label} <span>{fixture.argumentOne.type}</span>
				<input defaultValue={fixture.argumentOne.value} />
			</label>
			<label>
				{fixture.argumentTwo.label} <span>{fixture.argumentTwo.type}</span>
				<input defaultValue={fixture.argumentTwo.value} />
			</label>
			<label>
				{fixture.amount.label} <span>{fixture.amount.type}</span>
				<span className={styles.inputGroup}>
					<input defaultValue={fixture.amount.value} />
					<small>{fixture.amount.unit}</small>
				</span>
			</label>
		</div>
	)
}

function ActionRow({
	onSimulate,
	onReset,
}: {
	onSimulate: () => void
	onReset: () => void
}) {
	return (
		<div className={styles.actionRow}>
			<button
				type="button"
				className={styles.primaryButton}
				onClick={onSimulate}
			>
				<Play size={15} /> Simulate
			</button>
			<button type="button" className={styles.quietButton} onClick={onReset}>
				<RotateCcw size={15} /> Reset
			</button>
		</div>
	)
}

function CodeExample({ fixture }: { fixture: Fixture }) {
	const [codeKind, setCodeKind] = useState<"typescript" | "cli">("typescript")
	return (
		<section className={styles.codeSection}>
			<div className={styles.contentHeading}>
				<h3>Use this call</h3>
				<div className={styles.codeTabs}>
					<button
						type="button"
						className={codeKind === "typescript" ? styles.activeCodeTab : ""}
						onClick={() => setCodeKind("typescript")}
					>
						TypeScript
					</button>
					<button
						type="button"
						className={codeKind === "cli" ? styles.activeCodeTab : ""}
						onClick={() => setCodeKind("cli")}
					>
						CLI
					</button>
				</div>
			</div>
			<pre>
				<code>
					{codeKind === "typescript" ? fixture.clientCode : fixture.cliCode}
				</code>
			</pre>
		</section>
	)
}

function Simulation({
	fixture,
	simulated,
	submitted,
	compact = false,
}: {
	fixture: Fixture
	simulated: boolean
	submitted: boolean
	compact?: boolean
}) {
	if (!simulated)
		return (
			<div className={styles.callout}>
				<strong>Ready to simulate</strong>
				<p>Check authorization, fees, and state changes before signing.</p>
			</div>
		)
	return (
		<section className={styles.simulation}>
			<div className={styles.simulationHeading}>
				<PreviewNotice>
					{submitted ? "Confirmed" : "Simulation succeeded"}
				</PreviewNotice>
				<span>Just now</span>
			</div>
			<ActivityRow
				icon={<ArrowLeftRight size={16} />}
				title={submitted ? fixture.result : fixture.effect}
				body={submitted ? "Ledger 9,814,302" : "Predicted state change"}
			/>
			<ActivityRow
				icon={<ShieldCheck size={16} />}
				title={
					fixture.kind === "Account policy"
						? "One eligible signer"
						: "Account authorization required"
				}
				body="No unexpected authorization"
			/>
			<ActivityRow
				icon={<Coins size={16} />}
				title={fixture.fee}
				body="Estimated network cost"
			/>
			{!compact && (
				<>
					<details>
						<summary>
							State changes and events <ChevronDown size={15} />
						</summary>
						<p>1 write · 2 reads · 1 contract event</p>
					</details>
					<details>
						<summary>
							Resources <ChevronDown size={15} />
						</summary>
						<p>Instructions 1.4M · read 2.1 KB · write 512 B</p>
					</details>
				</>
			)}
		</section>
	)
}

function PostSimulation({
	simulated,
	onSubmit,
	onProposal,
}: {
	simulated: boolean
	onSubmit: () => void
	onProposal: () => void
}) {
	if (!simulated) return null
	return (
		<div className={styles.postSimulation}>
			<button type="button" className={styles.primaryButton} onClick={onSubmit}>
				Sign and submit
			</button>
			<button type="button" onClick={onProposal}>
				Create approval request
			</button>
		</div>
	)
}

function ProposalScreen({
	direction,
	fixture,
	approved,
	copied,
	onApproval,
	onCopy,
}: {
	direction: Direction
	fixture: Fixture
	approved: boolean
	copied: boolean
	onApproval: () => void
	onCopy: () => void
}) {
	const action = <ProposalAction fixture={fixture} />
	const approvals = (
		<Approvals
			approved={approved}
			copied={copied}
			onApproval={onApproval}
			onCopy={onCopy}
		/>
	)
	if (direction === "console")
		return (
			<div className={styles.consoleLayout}>
				<article className={styles.consolePrimary}>
					<div className={styles.proposalTitle}>
						<div>
							<p className={styles.eyebrow}>Proposal PR-8D21</p>
							<h2>
								{fixture.kind === "Token contract"
									? "August vendor payment"
									: fixture.kind === "Registry contract"
										? "Deploy router 1.4.0"
										: "Enable approval policy"}
							</h2>
						</div>
						<PreviewNotice>On-chain proposal</PreviewNotice>
					</div>
					{action}
					<h3 className={styles.subheading}>Latest simulation</h3>
					<Simulation fixture={fixture} simulated submitted={false} compact />
				</article>
				<aside className={styles.consoleSide}>
					{approvals}
					<ActivityTimeline approved={approved} />
				</aside>
			</div>
		)
	if (direction === "workbench")
		return (
			<div className={styles.workbenchLayout}>
				<aside className={styles.pane}>
					<p className={styles.paneTitle}>Proposal</p>
					<div className={styles.proposalNav}>
						<span className={styles.selectedFunction}>
							Action <Check size={15} />
						</span>
						<span>
							Effects <Check size={15} />
						</span>
						<span>
							Approvals <small>{approved ? "2/3" : "1/3"}</small>
						</span>
						<span>Activity</span>
					</div>
				</aside>
				<article className={styles.pane}>
					<div className={styles.proposalTitle}>
						<div>
							<p className={styles.eyebrow}>PR-8D21</p>
							<h2>Review exact intent</h2>
						</div>
						<PreviewNotice>
							{approved ? "Review period · 42m" : "Awaiting approval"}
						</PreviewNotice>
					</div>
					{action}
				</article>
				<aside className={styles.pane}>{approvals}</aside>
			</div>
		)
	return (
		<div className={styles.continuumLayout}>
			<SectionRail active="Identity" />
			<article className={styles.continuumContent}>
				<div className={styles.proposalTitle}>
					<div>
						<p className={styles.eyebrow}>Proposal PR-8D21</p>
						<h2>Review exact intent</h2>
						<p>
							The decoded action remains primary; the signed author note is
							secondary.
						</p>
					</div>
				</div>
				<div className={styles.continuumColumns}>
					<div>
						{action}
						<h3 className={styles.subheading}>Latest simulation</h3>
						<Simulation fixture={fixture} simulated submitted={false} compact />
					</div>
					<aside>{approvals}</aside>
				</div>
			</article>
		</div>
	)
}

function ProposalAction({ fixture }: { fixture: Fixture }) {
	return (
		<div className={styles.proposalStack}>
			<section className={styles.proposalAction}>
				<p className={styles.eyebrow}>What the contract will do</p>
				<h3>{fixture.effect}</h3>
				<dl className={styles.keyValues}>
					<dt>Contract</dt>
					<dd>{fixture.name}</dd>
					<dt>Function</dt>
					<dd>
						<code>{fixture.primaryFunction}</code>
					</dd>
					<dt>Network</dt>
					<dd>Testnet</dd>
					<dt>Deadline</dt>
					<dd>September 10, 2026</dd>
				</dl>
			</section>
			<div className={styles.callout}>
				<strong>Author’s note · signed by Willem</strong>
				<p>
					Routine{" "}
					{fixture.kind === "Registry contract"
						? "deployment of the verified release"
						: fixture.kind === "Token contract"
							? "vendor payment for August"
							: "account policy update"}
					.
				</p>
			</div>
		</div>
	)
}

function Approvals({
	approved,
	copied,
	onApproval,
	onCopy,
}: {
	approved: boolean
	copied: boolean
	onApproval: () => void
	onCopy: () => void
}) {
	const count = approved ? 2 : 1
	return (
		<section className={styles.approvals}>
			<div className={styles.contentHeading}>
				<div>
					<h2>Approvals</h2>
					<span>{count} of 3 recorded</span>
				</div>
				<PreviewNotice>
					{approved ? "Review period · 42m" : "Awaiting approval"}
				</PreviewNotice>
			</div>
			<div
				className={styles.approvalMeter}
				role="progressbar"
				aria-label="Proposal approvals"
				aria-valuemin={0}
				aria-valuemax={3}
				aria-valuenow={count}
			>
				<span style={{ width: approved ? "67%" : "34%" }} />
			</div>
			<div className={styles.approverList}>
				<Approver initial="W" name="Willem" status="Approved · 9:41" complete />
				<Approver
					initial="A"
					name="Ada"
					status={approved ? "Approved · just now" : "Awaiting response"}
					complete={approved}
				/>
				<Approver initial="G" name="Grace" status="No action yet" />
			</div>
			<div className={styles.approvalActions}>
				<button
					type="button"
					className={approved ? styles.retractButton : styles.primaryButton}
					onClick={onApproval}
				>
					{approved ? "Retract approval" : "Approve with Nido"}
				</button>
				<button type="button" onClick={onCopy}>
					{copied ? <Check size={15} /> : <Copy size={15} />}
					{copied ? "Link copied" : "Copy proposal link"}
				</button>
			</div>
		</section>
	)
}

function Approver({
	initial,
	name,
	status,
	complete = false,
}: {
	initial: string
	name: string
	status: string
	complete?: boolean
}) {
	return (
		<div className={styles.approver}>
			<span className={styles.avatar}>{initial}</span>
			<span>
				<strong>{name}</strong>
				<small>{status}</small>
			</span>
			{complete ? <Check size={16} /> : <CircleMinus size={16} />}
		</div>
	)
}

function ActivityTimeline({ approved }: { approved: boolean }) {
	return (
		<section className={styles.timeline}>
			<h2>Activity</h2>
			<div>
				<Clock3 size={15} />
				<span>
					<strong>Proposal published</strong>
					<small>Willem · 9:36</small>
				</span>
			</div>
			<div>
				<Check size={15} />
				<span>
					<strong>Willem approved</strong>
					<small>9:41</small>
				</span>
			</div>
			{approved && (
				<div>
					<Check size={15} />
					<span>
						<strong>Ada approved</strong>
						<small>Review countdown started</small>
					</span>
				</div>
			)}
		</section>
	)
}
