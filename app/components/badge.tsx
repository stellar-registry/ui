import { Slot } from "@radix-ui/react-slot"
import { type ComponentProps } from "react"
import styles from "./badge.module.css"

type BadgeProps = ComponentProps<"span"> & {
	variant?: "primary" | "secondary" | "outline" | "destructive"
	asChild?: boolean
}

function Badge({
	className,
	variant = "primary",
	asChild = false,
	...props
}: BadgeProps) {
	const Comp = asChild ? Slot : "span"

	return (
		<Comp
			data-slot="badge"
			data-variant={variant}
			className={`${styles.badge} ${className ?? ""}`.trim()}
			{...props}
		/>
	)
}

export { Badge }
