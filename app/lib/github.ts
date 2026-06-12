export interface GithubSourceRepo {
	owner: string
	repo: string
	ref: string
	subpath: string
}

export type GithubMetadataFile = {
	content: string
	path: string
}

export type GithubMetadata = {
	readme: GithubMetadataFile | null
	license: GithubMetadataFile | null
}

type GithubContentsEntry = {
	name: string
	path: string
	type: string
	download_url: string | null
}

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
const GITHUB_CONTENTS_HEADERS = {
	Accept: "application/vnd.github+json",
}
const EXTERNAL_LINK_PATTERN = /^[a-z][a-z\d+.-]*:/i

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

function buildGithubContentsUrl(sourceRepo: GithubSourceRepo, path?: string) {
	const encodedPath = path
		? `/${path
				.split("/")
				.filter(Boolean)
				.map((segment) => encodeURIComponent(segment))
				.join("/")}`
		: ""
	const ref = encodeURIComponent(sourceRepo.ref)
	return `https://api.github.com/repos/${encodeURIComponent(sourceRepo.owner)}/${encodeURIComponent(sourceRepo.repo)}/contents${encodedPath}?ref=${ref}`
}

// This function returns `bool` but checks the type of `value` while doing so:
// if it returns `true`, type of value is GithubContentsEntry
function isGithubContentsEntry(value: unknown): value is GithubContentsEntry {
	if (!value || typeof value !== "object") return false
	const entry = value as Record<string, unknown>
	return (
		typeof entry.name === "string" &&
		typeof entry.path === "string" &&
		typeof entry.type === "string" &&
		(typeof entry.download_url === "string" || entry.download_url === null)
	)
}

// Loads the directory entries from the public api
async function fetchGithubDirectoryEntries(
	sourceRepo: GithubSourceRepo,
	path?: string,
): Promise<GithubContentsEntry[]> {
	try {
		const url = buildGithubContentsUrl(sourceRepo, path)
		const response = await fetch(url, {
			headers: GITHUB_CONTENTS_HEADERS,
		})

		if (
			response.status === 404 ||
			response.status === 403 ||
			response.status === 429
		) {
			return []
		}
		if (!response.ok) return []

		const data: unknown = await response.json()
		if (!Array.isArray(data)) return []

		return data.filter(isGithubContentsEntry)
	} catch {
		return []
	}
}

// Iterates through the entries to find the preferred file(s)
function findPreferredFile(
	entries: GithubContentsEntry[],
	preferredNames: string[],
) {
	const filesByName = new Map(
		entries
			.filter((entry) => entry.type === "file")
			.map((entry) => [entry.name.toLowerCase(), entry] as const),
	)

	for (const name of preferredNames) {
		const match = filesByName.get(name.toLowerCase())
		if (match?.download_url) return match
	}

	return null
}

async function fetchGithubFile(
	entry: GithubContentsEntry,
): Promise<GithubMetadataFile | null> {
	if (!entry.download_url) return null

	try {
		const response = await fetch(entry.download_url)
		if (!response.ok) return null

		return {
			content: await response.text(),
			path: entry.path,
		}
	} catch {
		return null
	}
}

export async function fetchGithubMetadata(
	sourceRepo: GithubSourceRepo | null,
): Promise<GithubMetadata> {
	if (!sourceRepo) {
		return { readme: null, license: null }
	}

	// sometimes READMEs can be located in a subdirectory, fetch it first
	// if there is a subpath
	const subpathEntries = sourceRepo.subpath
		? await fetchGithubDirectoryEntries(sourceRepo, sourceRepo.subpath)
		: []

	let readmeEntry = findPreferredFile(subpathEntries, README_FILENAMES)
	let licenseEntry = findPreferredFile(subpathEntries, LICENSE_FILENAMES)

	if (!readmeEntry || !licenseEntry) {
		const rootEntries = await fetchGithubDirectoryEntries(sourceRepo)
		if (!readmeEntry) {
			readmeEntry = findPreferredFile(rootEntries, README_FILENAMES)
		}
		if (!licenseEntry) {
			licenseEntry = findPreferredFile(rootEntries, LICENSE_FILENAMES)
		}
	}

	const [readme, license] = await Promise.all([
		readmeEntry ? fetchGithubFile(readmeEntry) : Promise.resolve(null),
		licenseEntry ? fetchGithubFile(licenseEntry) : Promise.resolve(null),
	])

	return { readme, license }
}

function buildGithubRawFileUrl(source: GithubSourceRepo, path: string) {
	const normalizedPath = normalizePath(path)
	return `https://raw.githubusercontent.com/${source.owner}/${source.repo}/${source.ref}/${normalizedPath}`
}

function buildGithubBlobUrl(source: GithubSourceRepo, path: string) {
	return `https://github.com/${source.owner}/${source.repo}/blob/${source.ref}/${path}`
}

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
