import { config } from "@theahaco/ts-config/eslint"
import { globalIgnores } from "eslint/config"

/** @type {import("eslint").Linter.Config[]} */
export default [
	globalIgnores(["build", "node_modules", ".react-router"]),
	...config,
]
