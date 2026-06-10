import { type Contract, type Wasm, type WasmDetail } from "./types"

/** Prefix a Wasm or Contract name with its Channel, if it exists and isn't verified */
export function prefixName(name: string, channel?: string) {
	return channel && channel !== "root" ? `${channel}/${name}` : name
}

export function getFullName(wasmOrContract: Wasm | Contract) {
	const channel =
		"channel" in wasmOrContract ? wasmOrContract.channel : undefined
	const name =
		"contract_name" in wasmOrContract
			? wasmOrContract.contract_name
			: wasmOrContract.wasm_name
	return prefixName(name, channel)
}

export function isLatestWasm(wasm: WasmDetail) {
	return wasm.wasm_version === wasm.versions[0]?.wasm_version
}

export interface GithubSourceRepo {
	owner: string
	repo: string
	ref: string
	subpath: string
}

export interface GithubRawFileCandidate {
	path: string
	url: string
}

function normalizePath(path: string) {
	return path.replace(/^\/+|\/+$/g, "")
}

/* GitHub tree URL has this form: https://github.com/{owner}/{repo}/tree/{branch}/{path} */
export function parseGithubSourceRepo(url: string): GithubSourceRepo | null {
	try {
		const parsed = new URL(url)
		if (parsed.hostname !== "github.com") return null

		const segments = parsed.pathname
			.split("/")
			.filter(Boolean)
			.map((segment) => decodeURIComponent(segment))
		if (segments.length < 4) return null

		const [owner, repo, type, ref, ...rest] = segments
		if (!owner || !repo || type !== "tree" || !ref) return null

		return {
			owner,
			repo,
			ref,
			subpath: normalizePath(rest.join("/")),
		}
	} catch {
		return null
	}
}

function buildGithubRawFileUrl(source: GithubSourceRepo, path: string) {
	const normalizedPath = normalizePath(path)
	return `https://raw.githubusercontent.com/${source.owner}/${source.repo}/${source.ref}/${normalizedPath}`
}

function buildGithubFileCandidate(source: GithubSourceRepo, path: string) {
	const normalizedPath = normalizePath(path)
	return {
		path: normalizedPath,
		url: buildGithubRawFileUrl(source, normalizedPath),
	}
}

function buildGithubBlobUrl(source: GithubSourceRepo, path: string) {
	return `https://github.com/${source.owner}/${source.repo}/blob/${source.ref}/${path}`
}

export function buildGithubRawFileCandidates(
	source: GithubSourceRepo,
	filenames: string[],
) {
	const normalizedFilenames = filenames.map(normalizePath).filter(Boolean)
	const subpathCandidates = source.subpath
		? normalizedFilenames.map((filename) =>
				buildGithubFileCandidate(source, `${source.subpath}/${filename}`),
			)
		: []
	const rootCandidates = normalizedFilenames.map((filename) =>
		buildGithubFileCandidate(source, filename),
	)

	return [...subpathCandidates, ...rootCandidates]
}

const EXTERNAL_LINK_PATTERN = /^[a-z][a-z\d+.-]*:/i

function isExternalOrAnchorLink(url: string) {
	return (
		url.startsWith("#") ||
		url.startsWith("//") ||
		EXTERNAL_LINK_PATTERN.test(url)
	)
}

function splitUrlParts(url: string) {
	const hashIndex = url.indexOf("#")
	const beforeHash = hashIndex >= 0 ? url.slice(0, hashIndex) : url
	const hash = hashIndex >= 0 ? url.slice(hashIndex) : ""

	const queryIndex = beforeHash.indexOf("?")
	const path = queryIndex >= 0 ? beforeHash.slice(0, queryIndex) : beforeHash
	const query = queryIndex >= 0 ? beforeHash.slice(queryIndex) : ""

	return { path, query, hash }
}

function resolveRepoPath(baseFilePath: string, targetPath: string) {
	if (!targetPath) return normalizePath(baseFilePath)

	const baseDirSegments = normalizePath(baseFilePath).split("/").filter(Boolean)
	baseDirSegments.pop()

	const absolute = targetPath.startsWith("/")
	const pathSegments = targetPath.split("/")
	const resolvedSegments = absolute ? [] : [...baseDirSegments]

	for (const segment of pathSegments) {
		if (!segment || segment === ".") continue
		if (segment === "..") {
			if (resolvedSegments.length > 0) resolvedSegments.pop()
			continue
		}
		resolvedSegments.push(segment)
	}

	return resolvedSegments.join("/")
}

export function resolveGithubMarkdownLink(
	source: GithubSourceRepo,
	baseFilePath: string,
	href: string,
) {
	if (!href || isExternalOrAnchorLink(href)) return href

	const { path, query, hash } = splitUrlParts(href)
	const resolvedPath = resolveRepoPath(baseFilePath, path)
	if (!resolvedPath) return href

	return `${buildGithubBlobUrl(source, encodeURI(resolvedPath))}${query}${hash}`
}

export function resolveGithubMarkdownImage(
	source: GithubSourceRepo,
	baseFilePath: string,
	src: string,
) {
	if (!src || isExternalOrAnchorLink(src)) return src

	const { path, query, hash } = splitUrlParts(src)
	const resolvedPath = resolveRepoPath(baseFilePath, path)
	if (!resolvedPath) return src

	return `${buildGithubRawFileUrl(source, encodeURI(resolvedPath))}${query}${hash}`
}
