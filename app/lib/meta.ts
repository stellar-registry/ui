/** Title + description plus the Open Graph / Twitter Card tags every page shares. */
export function pageMeta({
	title,
	description,
}: {
	title: string
	description: string
}) {
	return [
		{ title },
		{ name: "description", content: description },
		{ property: "og:title", content: title },
		{ property: "og:description", content: description },
		{ property: "og:image", content: "/og-image.png" },
		{ property: "og:type", content: "website" },
		{ name: "twitter:card", content: "summary_large_image" },
		{ name: "twitter:title", content: title },
		{ name: "twitter:description", content: description },
		{ name: "twitter:image", content: "/og-image.png" },
	]
}
