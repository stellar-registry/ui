import { type ComponentProps } from "react"
import styles from "./label.module.css"

function Label({ className, ...props }: ComponentProps<"label">) {
	return (
		<label className={`${styles.label} ${className ?? ""}`.trim()} {...props} />
	)
}

export { Label }
