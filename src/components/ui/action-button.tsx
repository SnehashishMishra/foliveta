"use client";

import type { ReactNode } from "react";
import type { HTMLMotionProps } from "motion/react";
import { motion } from "motion/react";

type Variant = "primary" | "secondary" | "ghost" | "danger";

type ActionButtonProps = Omit<HTMLMotionProps<"button">, "ref"> & {
  variant?: Variant;
  children: ReactNode;
};

const base =
  "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border px-3.5 py-2.5 text-sm font-semibold leading-tight transition-[background-color,border-color,color,box-shadow] duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-50 motion-reduce:transition-none";

const variants: Record<Variant, string> = {
  primary:
    "border-primary/80 bg-gradient-to-br from-[#6262db] to-[#5050c8] text-primary-foreground shadow-[0_7px_18px_rgb(91_91_214_/_23%),inset_0_1px_rgb(255_255_255_/_25%)] hover:from-[#5555d0] hover:to-[#4646b8] hover:shadow-[0_10px_23px_rgb(91_91_214_/_28%)] active:shadow-none",
  secondary:
    "border-border bg-white/80 text-secondary-foreground shadow-sm hover:border-[#cfd3e8] hover:bg-white",
  ghost:
    "border-transparent bg-transparent text-muted-foreground hover:bg-accent hover:text-accent-foreground",
  danger:
    "border-destructive/20 bg-destructive text-white shadow-sm hover:bg-[#a93847]",
};

export function ActionButton({
  variant = "secondary",
  className = "",
  children,
  type = "button",
  ...props
}: ActionButtonProps) {
  return (
    <motion.button
      type={type}
      whileTap={{ scale: 0.97 }}
      whileHover={{ y: -1, cursor: "pointer" }}
      transition={{ type: "spring", stiffness: 500, damping: 28 }}
      className={`${base} ${variants[variant]} ${className}`.trim()}
      {...props}
    >
      {children}
    </motion.button>
  );
}
