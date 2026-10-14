"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import Link from "next/link";
import { forwardRef } from "react";

type Variant = "primary" | "secondary" | "ghost" | "quiet" | "danger";
type Size = "sm" | "md" | "lg";

const base =
  "relative inline-flex items-center justify-center gap-2 select-none whitespace-nowrap " +
  "font-medium tracking-[0.14em] uppercase transition-colors duration-300 " +
  "disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none";

const variants: Record<Variant, string> = {
  primary:
    "bg-amber text-ink hover:bg-turmeric shadow-[0_18px_40px_-24px_rgba(221,160,74,0.9)] " +
    "border border-amber/60",
  secondary:
    "border border-ivory/25 text-ivory hover:border-amber/70 hover:text-amber bg-ink/20 backdrop-blur-[2px]",
  ghost: "text-ivory/80 hover:text-amber border border-transparent",
  quiet: "text-ash hover:text-ivory border border-ivory/12 hover:border-ivory/30",
  danger: "border border-chili/50 text-chili hover:bg-chili/10",
};

const sizes: Record<Size, string> = {
  sm: "h-11 min-h-[44px] px-4 text-[0.6875rem]",
  md: "h-12 min-h-[48px] px-5 text-xs",
  lg: "h-14 min-h-[56px] px-7 text-xs sm:text-[0.8125rem]",
};

const press = { scale: 0.985 };
const hover = { y: -1 };

export interface ButtonProps extends Omit<HTMLMotionProps<"button">, "children"> {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  children: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", fullWidth, className = "", children, ...rest },
  ref,
) {
  return (
    <motion.button
      ref={ref}
      type={rest.type ?? "button"}
      whileHover={rest.disabled ? undefined : hover}
      whileTap={rest.disabled ? undefined : press}
      transition={{ duration: 0.18, ease: [0.2, 0.9, 0.24, 1] }}
      className={[base, variants[variant], sizes[size], fullWidth ? "w-full" : "", className]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    >
      {children}
    </motion.button>
  );
});

export interface ButtonLinkProps {
  href: string;
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  className?: string;
  external?: boolean;
  children: React.ReactNode;
  onClick?: (event: React.MouseEvent<HTMLAnchorElement>) => void;
  "data-testid"?: string;
  "aria-label"?: string;
}

export function ButtonLink({
  href,
  variant = "primary",
  size = "md",
  fullWidth,
  className = "",
  external,
  children,
  onClick,
  ...rest
}: ButtonLinkProps) {
  const classes = [base, variants[variant], sizes[size], fullWidth ? "w-full" : "", className]
    .filter(Boolean)
    .join(" ");

  if (external) {
    return (
      <motion.a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={onClick}
        whileHover={hover}
        whileTap={press}
        transition={{ duration: 0.18, ease: [0.2, 0.9, 0.24, 1] }}
        className={classes}
        {...rest}
      >
        {children}
      </motion.a>
    );
  }

  return (
    <motion.span
      whileHover={hover}
      whileTap={press}
      transition={{ duration: 0.18, ease: [0.2, 0.9, 0.24, 1] }}
      className="inline-flex"
    >
      <Link href={href} className={classes} onClick={onClick} {...rest}>
        {children}
      </Link>
    </motion.span>
  );
}
