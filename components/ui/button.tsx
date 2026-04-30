import * as React from "react";
import { cn } from "@/lib/utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "secondary" | "ghost";
};

const variants: Record<NonNullable<ButtonProps["variant"]>, string> = {
  default:
    "bg-primary text-primary-foreground shadow-sm hover:bg-primary/95 disabled:bg-primary/70",
  secondary:
    "bg-white/45 text-secondary-foreground backdrop-blur-md hover:bg-white/60 disabled:bg-white/45",
  ghost:
    "bg-transparent text-foreground hover:bg-white/35 disabled:bg-transparent"
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "inline-flex h-11 items-center justify-center rounded-full border border-white/25 px-5 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-transparent disabled:cursor-not-allowed disabled:opacity-70",
        variants[variant],
        className
      )}
      {...props}
    />
  )
);

Button.displayName = "Button";
