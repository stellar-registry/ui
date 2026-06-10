import { useQuery } from "@tanstack/react-query"
import { useEffect, useState } from "react"
import Markdown from "react-markdown"
import remarkGfm from "remark-gfm"

import styles from "./metadata-section.module.css"
import {
	buildGithubRawFileCandidates,
	type GithubRawFileCandidate,
	parseGithubSourceRepo,
	resolveGithubMarkdownImage,
	resolveGithubMarkdownLink,
} from "~/lib/util"

interface MetadataSectionProps {
	sourceRepoUrl: string
}

const STORAGE_KEY = "registry-metadata-expanded"
const README_FILENAMES = ["README.md", "README.MD", "readme.md"]
const LICENSE_FILENAMES = [
	"LICENSE",
	"LICENSE.md",
	"LICENSE.txt",
	"LICENCE",
	"LICENCE.md",
	"LICENCE.txt",
	"COPYING",
	"COPYING.md",
	"COPYING.txt",
]

type ResolvedMetadataFile = {
	content: string
	path: string
}

async function fetchFirstAvailableContent(
	candidates: GithubRawFileCandidate[],
): Promise<ResolvedMetadataFile | null> {
	for (const candidate of candidates) {
		try {
			const response = await fetch(candidate.url)
			if (response.ok) {
				return {
					content: await response.text(),
					path: candidate.path,
				}
			}
		} catch {
			continue
		}
	}

	return null
}

function ReadmeSection({
	content,
	path,
	sourceRepoUrl,
}: {
	content: string
	path: string
	sourceRepoUrl: string
}) {
	const sourceRepo = parseGithubSourceRepo(sourceRepoUrl)

	return (
		<article className={styles.panel}>
			<h3 className={styles.subheading}>Readme</h3>
			<div className={styles.markdown}>
				<Markdown
					remarkPlugins={[remarkGfm]}
					components={{
						a: ({ node: _node, href = "", ...props }) => (
							<a
								href={
									sourceRepo
										? resolveGithubMarkdownLink(sourceRepo, path, href)
										: href
								}
								{...(href.startsWith("#") ? {} : { target: "_blank" })}
								{...props}
							/>
						),
						img: ({ node: _node, src = "", alt = "", ...props }) => (
							<img
								src={
									sourceRepo
										? resolveGithubMarkdownImage(sourceRepo, path, src)
										: src
								}
								alt={alt}
								loading="lazy"
								{...props}
							/>
						),
					}}
				>
					{content}
				</Markdown>
			</div>
		</article>
	)
}

function LicenseSection({ content }: { content: string }) {
	return (
		<article className={styles.panel}>
			<h3 className={styles.subheading}>License</h3>
			<pre className={styles.license}>{content}</pre>
		</article>
	)
}

export function MetadataSection({ sourceRepoUrl }: MetadataSectionProps) {
	const sourceRepo = parseGithubSourceRepo(sourceRepoUrl)
	const [expanded, setExpanded] = useState(true)

	const { data } = useQuery({
		queryKey: ["wasm-meta", sourceRepoUrl],
		enabled: Boolean(sourceRepo),
		staleTime: 5 * 60_000,
		queryFn: async () => {
			if (!sourceRepo) {
				return { readme: null, license: null }
			}

			const readmeCandidates = buildGithubRawFileCandidates(
				sourceRepo,
				README_FILENAMES,
			)
			const licenseCandidates = buildGithubRawFileCandidates(
				sourceRepo,
				LICENSE_FILENAMES,
			)

			const [readme, license] = await Promise.all([
				fetchFirstAvailableContent(readmeCandidates),
				fetchFirstAvailableContent(licenseCandidates),
			])

			return {
				readme,
				license,
			}
		},
	})

	useEffect(() => {
		const stored = localStorage.getItem(STORAGE_KEY)
		if (stored !== null) setExpanded(stored === "true")
	}, [])

	function toggle() {
		const next = !expanded
		setExpanded(next)
		localStorage.setItem(STORAGE_KEY, String(next))
	}

	if (!data?.readme && !data?.license) return null

	return (
		<section className={styles.section}>
			<div className={styles.header}>
				<h2 className={styles.heading}>Metadata</h2>
				<button
					className={styles.toggle}
					onClick={toggle}
					aria-expanded={expanded}
				>
					{expanded ? "Hide" : "Show"}
				</button>
			</div>
			{expanded && (
				<div className={styles.body}>
					{data.readme && (
						<ReadmeSection
							content={data.readme.content}
							path={data.readme.path}
							sourceRepoUrl={sourceRepoUrl}
						/>
					)}
					{data.license && <LicenseSection content={data.license.content} />}
				</div>
			)}
		</section>
	)
}
