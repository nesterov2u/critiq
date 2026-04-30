import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
};

export function Select({ className, label, children, ...props }: SelectProps) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-foreground/80">{label}</span>
      <span className="relative block">
        <select
          className={cn(
            "h-12 w-full appearance-none rounded-full border border-white/30 bg-white/60 px-4 pr-10 text-sm outline-none backdrop-blur-md transition focus:border-ring focus:ring-2 focus:ring-ring/20",
            className
          )}
          {...props}
        >
          {children}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-foreground/50" />
      </span>
    </label>
  );
}
