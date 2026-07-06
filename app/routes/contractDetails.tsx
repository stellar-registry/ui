import { data, useRouteLoaderData, isRouteErrorResponse } from "react-router"
import { type Route } from "./+types/contractDetails"
import styles from "./contractDetails.module.css"
import { buildWasmUsageItems } from "./wasmOverview"
import { Badge } from "~/components/badge"
import {
	DetailField,
	DetailFields,
	FieldLink,
	FieldValue,
} from "~/components/detail-field"
import {
	SidebarAlert,
	SidebarLink,
	SidebarPanel,
} from "~/components/detail-sidebar"
import { UsageSection } from "~/components/usage-section"
import { getContract } from "~/lib/api"
import { getFullName, prefixName } from "~/lib/util"

export async function loader({ params, context }: Route.LoaderArgs) {
	const { name, channel } = params
	try {
		const contract = await getContract(
			name,
			channel,
			context.cloudflare.env.REGISTRY_API_URL,
		)
		return { contract, name, channel, fullName: getFullName(contract) }
	} catch (e) {
		console.error(e)
		if (isRouteErrorResponse(e) && e.status === 500) {
			throw e
		}
		throw data("Contract not found", { status: 404 })
	}
}

export function meta({ loaderData }: Route.MetaArgs) {
	if (!loaderData) return [{ title: "Contract Not Found" }]
	return [{ title: `${loaderData.fullName} — Stellar Registry` }]
}

export default function ContractDetail({ loaderData }: Route.ComponentProps) {
	const { contract, fullName } = loaderData
	const { network, stellarExpertURL } = useRouteLoaderData("root")

	const createdAt = new Date(contract.created_at).toLocaleString()

	const hasWasm = !!contract.wasm_name
	const fullWasmName = hasWasm
		? prefixName(contract.wasm_name!, contract.wasm_channel)
		: ""
	const wasmAndVersion = hasWasm
		? `${fullWasmName}@v${contract.wasm_version}`
		: ""

	return (
		<main className={styles.main}>
			<div className={styles.titleRow}>
				<h1 className={styles.title}>{fullName}</h1>

				{hasWasm && <Badge variant="secondary">{wasmAndVersion}</Badge>}
			</div>

			<div className={styles.layout}>
				<DetailFields>
					<DetailField label="Contract ID">
						<FieldLink
							href={`${stellarExpertURL}/contract/${contract.contract_id}`}
							external
						>
							{contract.contract_id}
						</FieldLink>
					</DetailField>

					<DetailField label="Deployer">
						<FieldLink
							href={`${stellarExpertURL}/account/${contract.deployer}`}
							external
						>
							{contract.deployer}
						</FieldLink>
					</DetailField>

					{hasWasm && (
						<DetailField label="WASM">
							<FieldLink
								href={`/wasms/${fullWasmName}/v/${contract.wasm_version}`}
							>
								{wasmAndVersion}
							</FieldLink>
						</DetailField>
					)}

					<DetailField label="Deployed">
						<FieldValue>{createdAt}</FieldValue>
					</DetailField>

					<DetailField label="Ledger">
						<FieldValue>{contract.ledger_sequence.toLocaleString()}</FieldValue>
					</DetailField>

					<DetailField label="Transaction">
						<FieldLink
							href={`${stellarExpertURL}/tx/${contract.transaction_hash}`}
							external
						>
							{contract.transaction_hash}
						</FieldLink>
					</DetailField>
				</DetailFields>

				<aside className={styles.sidebar}>
					{network === "testnet" && (
						<SidebarAlert
							href="https://stellar.rgstry.xyz"
							linkText="Switch to Mainnet →"
						>
							Testnet data — this contract may not exist on mainnet.
						</SidebarAlert>
					)}
					<SidebarPanel>
						<SidebarLink
							href={`${stellarExpertURL}/contract/${contract.contract_id}`}
							external
						>
							View on Stellar Expert
						</SidebarLink>
						{hasWasm && (
							<SidebarLink href={`/wasms/${fullWasmName}`}>
								View WASM
							</SidebarLink>
						)}
						<SidebarLink
							href={`${stellarExpertURL}/account/${contract.deployer}`}
							external
						>
							View Deployer
						</SidebarLink>
					</SidebarPanel>
				</aside>
			</div>

			{!hasWasm ? null : (
        <>
          <h1>Interact with this contract</h1>
          <div><a href="https://www.npmjs.com/package/@theahaco/contract-explorer">Contract Explorer</a> goes here</div>
          <UsageSection
            items={buildWasmUsageItems(
              fullWasmName,
              contract.wasm_version,
              contract.contract_id,
            )}
            description="Use the registered name of this Contract's Wasm to create a module for it and start calling its methods."
            footer={
              <>
                <p style={{ margin: "0 0 1rem" }}>
                  The macro downloads this Wasm at build time and generates a
                  type-safe Rust client. Your editor's autocomplete should show
                  all available methods as well as their argument and return
                  types.
                </p>
                <p>
                  Importing a Contract directly by name with the{" "}
                  <code>import_contract!</code> macro is in development.{" "}
                  <a
                    href="https://github.com/theahaco/scaffold-stellar/issues/419"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Follow progress on GitHub →
                  </a>
                </p>
              </>
            }
          />
        </>
			)}
		</main>
	)
}
