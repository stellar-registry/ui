import { Moon, Sun } from "lucide-react"
import { useEffect, useState } from "react"
import {
	isRouteErrorResponse,
	Link,
	Links,
	Meta,
	Outlet,
	Scripts,
	ScrollRestoration,
} from "react-router"

import { type Route } from "./+types/root"
import "./app.css"
import styles from "./root.module.css"

// Runs before hydration to avoid flash of wrong theme. Defaults to dark.
const themeScript = `(function(){try{if(localStorage.getItem('theme')!=='light')document.documentElement.classList.add('dark')}catch(e){}})();`

function Header({
	isDark,
	onToggle,
}: {
	isDark: boolean
	onToggle: () => void
}) {
	return (
		<header className={styles.header}>
			<div className={styles.headerInner}>
				<Link to="/" className={styles.headerLogo}>
					<span className={styles.headerLogoMark}>✦</span>
					Stellar Registry
				</Link>
				<button
					className={styles.themeToggle}
					onClick={onToggle}
					aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
				>
					{isDark ? <Sun size={16} /> : <Moon size={16} />}
				</button>
			</div>
		</header>
	)
}

export function Layout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en" suppressHydrationWarning>
			<head>
				<meta charSet="utf-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<script dangerouslySetInnerHTML={{ __html: themeScript }} />
				<Meta />
				<Links />
			</head>
			<body>
				{children}
				<ScrollRestoration />
				<Scripts />
			</body>
		</html>
	)
}

export default function App() {
	const [isDark, setIsDark] = useState(true)

	useEffect(() => {
		setIsDark(document.documentElement.classList.contains("dark"))
	}, [])

	function toggleTheme() {
		const next = !isDark
		setIsDark(next)
		document.documentElement.classList.toggle("dark", next)
		localStorage.setItem("theme", next ? "dark" : "light")
	}

	return (
		<>
			<Header isDark={isDark} onToggle={toggleTheme} />
			<Outlet />
		</>
	)
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
	let message = "Oops!"
	let details = "An unexpected error occurred."
	let stack: string | undefined

	if (isRouteErrorResponse(error)) {
		message = error.status === 404 ? "404" : "Error"
		details =
			error.status === 404
				? "The requested page could not be found."
				: error.statusText || details
	} else if (import.meta.env.DEV && error && error instanceof Error) {
		details = error.message
		stack = error.stack
	}

	return (
		<main className={styles.errorMain}>
			<h1>{message}</h1>
			<p>{details}</p>
			{stack && (
				<pre className={styles.errorStack}>
					<code>{stack}</code>
				</pre>
			)}
		</main>
	)
}
