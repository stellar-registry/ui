import { useQuery } from "@tanstack/react-query"
import { useEffect, useState } from "react"
import Markdown from "react-markdown"
import remarkGfm from "remark-gfm"

import styles from "./metadata-section.module.css"
import {
	type GithubSourceRepo,
	parseGithubSourceRepo,
	resolveGithubMarkdownImage,
	resolveGithubMarkdownLink,
} from "~/lib/github"
import { wasmMetaQueryOptions } from "~/lib/queries"

interface MetadataSectionProps {
	sourceRepoUrl: string
}

const STORAGE_KEY = "registry-metadata-expanded"

function ReadmeSection({
	content,
	path,
	sourceRepo,
}: {
	content: string
	path: string
	sourceRepo: GithubSourceRepo | null
}) {
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
								{...(href.startsWith("#")
									? {}
									: { target: "_blank", rel: "noopener noreferrer" })}
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

	const { data } = useQuery(wasmMetaQueryOptions(sourceRepoUrl))

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
							sourceRepo={sourceRepo}
						/>
					)}
					{data.license && <LicenseSection content={data.license.content} />}
				</div>
			)}
		</section>
	)
}
