import * as React from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "min-h-[140px] w-full rounded-3xl border border-white/60 bg-white/75 px-4 py-3 text-sm text-zinc-900 shadow-soft outline-none backdrop-blur-xl transition focus:border-sky-200 focus:ring-2 focus:ring-sky-100",
        className
      )}
      ref={ref}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";

export { Textarea };
