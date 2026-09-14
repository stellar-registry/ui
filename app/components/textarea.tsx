import { type ComponentProps } from "react"
import styles from "./textarea.module.css"

function Textarea({ className, ...props }: ComponentProps<"textarea">) {
	return (
		<textarea
			className={`${styles.textarea} ${className ?? ""}`.trim()}
			{...props}
		/>
	)
}

export { Textarea }
