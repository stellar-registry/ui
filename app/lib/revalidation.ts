import { type ShouldRevalidateFunctionArgs } from "react-router"

export function shouldRevalidateWhenPathChanges({
	currentUrl,
	nextUrl,
	defaultShouldRevalidate,
}: ShouldRevalidateFunctionArgs) {
	if (currentUrl.pathname === nextUrl.pathname) {
		return false
	}

	return defaultShouldRevalidate
}
