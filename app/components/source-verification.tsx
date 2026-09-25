import { Link } from "react-router"

import { Badge } from "./badge"
import { DetailField, DetailFields } from "./detail-field"
import styles from "./source-verification.module.css"
import { type ContractValidation, type WasmMeta } from "~/lib/types"
import {
	SEP58_URL,
	hasSep58Meta,
	safeHref,
	sep58BuildCommand,
	verifierResults,
} from "~/lib/verification"

type SourceVerificationProps = { validation: ContractValidation | null } & (
	| { meta: WasmMeta | undefined }
	// Contract pages link to their Wasm's recipe instead of repeating it.
	| { wasmHref: string | undefined }
)

function BuildRecipe({ meta }: { meta: WasmMeta | undefined }) {
	if (!meta || !hasSep58Meta(meta)) {
		return (
			<p className={styles.note}>
				This Wasm doesn't embed <a href={SEP58_URL}>SEP-58</a> build metadata,
				so there is not build information on how to reproduce it.
			</p>
		)
	}

	const sourceHref = safeHref(meta.source_uri)

	return (
		<>
			<p className={styles.note}>
				Recorded in the Wasm by its publisher. You can use this information to
				reproduce the build.
			</p>
			<DetailFields>
				<DetailField label="Build Image">
					{meta.bldimg ?? "Not recorded"}
				</DetailField>
				<DetailField label="Build Command">
					<code>{sep58BuildCommand(meta)}</code>
				</DetailField>
				<DetailField label="Source Archive SHA-256">
					{meta.source_sha256 ?? "Not recorded"}
				</DetailField>
				{meta.source_uri && (
					<DetailField label="Source Archive" href={sourceHref} external>
						{meta.source_uri}
					</DetailField>
				)}
			</DetailFields>
		</>
	)
}

export function SourceVerification(props: SourceVerificationProps) {
	const results = verifierResults(props.validation)

	return (
		<section className={styles.section}>
			<h2 className={styles.heading}>Source Verification</h2>
			<div className={styles.body}>
				{"meta" in props ? (
					<article className={styles.panel}>
						<h3 className={styles.subheading}>Build Recipe (SEP-58)</h3>
						<BuildRecipe meta={props.meta} />
					</article>
				) : (
					props.wasmHref && (
						<p className={styles.note}>
							For how this contract's code was built, see{" "}
							<Link to={props.wasmHref}>its Wasm's build recipe</Link>.
						</p>
					)
				)}

				<article className={styles.panel}>
					<h3 className={styles.subheading}>Verifiers</h3>
					<p className={styles.note}>
						Each verifier's result is shown as reported. Registry doesn't
						combine them into a single status.
					</p>
					<ul className={styles.verifiers}>
						{results.map((result) => (
							<li key={result.verifier} className={styles.verifier}>
								<div className={styles.verifierHeader}>
									<a
										href={result.verifierUrl}
										target="_blank"
										rel="noopener noreferrer"
									>
										{result.verifier}
									</a>
									{result.status === "verified" ? (
										<Badge variant="primary">Verified build</Badge>
									) : (
										<Badge variant="outline">No verified build</Badge>
									)}
								</div>
								{result.source && (
									<DetailFields>
										<DetailField
											label="Source"
											href={result.source.href}
											external
										>
											{result.source.label}
										</DetailField>
										{result.path && (
											<DetailField label="Path">{result.path}</DetailField>
										)}
										{result.package && (
											<DetailField label="Package">
												{result.package}
											</DetailField>
										)}
									</DetailFields>
								)}
							</li>
						))}
					</ul>
				</article>
			</div>
		</section>
	)
}
