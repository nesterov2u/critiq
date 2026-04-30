import * as React from "react";
import { cn } from "@/lib/utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "secondary" | "ghost";
};

const variants: Record<NonNullable<ButtonProps["variant"]>, string> = {
  default:
    "bg-primary text-primary-foreground shadow-sm hover:opacity-95 disabled:bg-primary/70",
  secondary:
    "bg-secondary text-secondary-foreground hover:bg-secondary/80 disabled:bg-secondary",
  ghost: "bg-transparent text-foreground hover:bg-secondary disabled:bg-transparent"
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "inline-flex h-11 items-center justify-center rounded-full px-5 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed",
        variants[variant],
        className
      )}
      {...props}
    />
  )
);

Button.displayName = "Button";
