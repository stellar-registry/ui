import { type ComponentProps } from "react";
import styles from "./input.module.css";

function Input({ className, ...props }: ComponentProps<"input">) {
  return (
    <input
      className={`${styles.input} ${className ?? ""}`.trim()}
      {...props}
    />
  );
}

export { Input };
