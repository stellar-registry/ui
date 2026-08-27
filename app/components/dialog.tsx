import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"
import { type ComponentProps } from "react"
import styles from "./dialog.module.css"

const Dialog = DialogPrimitive.Root
const DialogTrigger = DialogPrimitive.Trigger

function DialogContent({
	className,
	children,
	...props
}: ComponentProps<typeof DialogPrimitive.Content>) {
	return (
		<DialogPrimitive.Portal>
			<DialogPrimitive.Overlay className={styles.overlay} />
			<DialogPrimitive.Content
				className={`${styles.content} ${className ?? ""}`.trim()}
				{...props}
			>
				{children}
				<DialogPrimitive.Close className={styles.close} aria-label="Close">
					<X size={16} />
				</DialogPrimitive.Close>
			</DialogPrimitive.Content>
		</DialogPrimitive.Portal>
	)
}

function DialogHeader({ className, ...props }: ComponentProps<"div">) {
	return (
		<div className={`${styles.header} ${className ?? ""}`.trim()} {...props} />
	)
}

function DialogTitle({
	className,
	...props
}: ComponentProps<typeof DialogPrimitive.Title>) {
	return (
		<DialogPrimitive.Title
			className={`${styles.title} ${className ?? ""}`.trim()}
			{...props}
		/>
	)
}

function DialogDescription({
	className,
	...props
}: ComponentProps<typeof DialogPrimitive.Description>) {
	return (
		<DialogPrimitive.Description
			className={`${styles.description} ${className ?? ""}`.trim()}
			{...props}
		/>
	)
}

function DialogFooter({ className, ...props }: ComponentProps<"div">) {
	return (
		<div className={`${styles.footer} ${className ?? ""}`.trim()} {...props} />
	)
}

export {
	Dialog,
	DialogTrigger,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
	DialogFooter,
}
