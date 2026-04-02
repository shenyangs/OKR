import { cn } from "@/lib/utils";

export function Badge({
  children,
  className
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-white/70 bg-white/75 px-3 py-1 text-xs font-medium text-zinc-700 backdrop-blur-xl",
        className
      )}
    >
      {children}
    </span>
  );
}
