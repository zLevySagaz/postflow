import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "h-10 w-full rounded-md border border-surface-border bg-surface-raised px-3 text-sm text-ink placeholder:text-ink-faint outline-none transition-colors focus:border-accent",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";
