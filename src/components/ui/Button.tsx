import Link from "next/link";
import type { ComponentPropsWithoutRef } from "react";

const VARIANTS = {
  primary: "bg-amber-800 text-white hover:bg-amber-900",
  secondary: "bg-white text-amber-900 border border-amber-800 hover:bg-amber-50",
  ghost: "text-amber-900 hover:bg-amber-50",
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
