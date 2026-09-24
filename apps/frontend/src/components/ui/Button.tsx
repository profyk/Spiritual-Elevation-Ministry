import Link from "next/link";
import type { ComponentPropsWithoutRef } from "react";

const VARIANTS = {
  primary: "bg-accent text-white hover:bg-accent-hover",
  secondary: "bg-surface text-accent-ink border border-accent-line hover:bg-accent-surface",
  ghost: "text-accent-ink hover:bg-accent-surface",
} as const;

type Variant = keyof typeof VARIANTS;

const baseClasses =
  "inline-flex items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-800";

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ComponentPropsWithoutRef<"button"> & { variant?: Variant }) {
  return <button className={`${baseClasses} ${VARIANTS[variant]} ${className}`} {...props} />;
}

export function LinkButton({
  variant = "primary",
  className = "",
  href,
  ...props
}: ComponentPropsWithoutRef<typeof Link> & { variant?: Variant }) {
  return <Link href={href} className={`${baseClasses} ${VARIANTS[variant]} ${className}`} {...props} />;
}
