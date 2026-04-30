import * as React from "react";
import { cn } from "@/lib/utils";

export function Card({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-[28px] border bg-card text-card-foreground shadow-panel backdrop-blur-sm",
        className
      )}
      {...props}
    />
  );
}
