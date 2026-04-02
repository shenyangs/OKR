import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, ...props }, ref) => {
  return (
    <input
      ref={ref}
      className={cn(
        "flex h-11 w-full rounded-2xl border border-white/60 bg-white/75 px-4 text-sm text-zinc-900 shadow-soft outline-none backdrop-blur-xl transition placeholder:text-zinc-400 focus:border-sky-200 focus:ring-2 focus:ring-sky-100",
        className
      )}
      {...props}
    />
  );
});
Input.displayName = "Input";

export { Input };
