import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "w-full resize-none rounded-md border border-surface-border bg-surface-raised px-3 py-2.5 text-sm text-ink placeholder:text-ink-faint outline-none transition-colors focus:border-accent",
      className
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";
