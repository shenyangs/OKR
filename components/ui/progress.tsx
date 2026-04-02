import { cn } from "@/lib/utils";

export function Progress({
  value,
  className
}: {
  value: number;
  className?: string;
}) {
  return (
    <div className={cn("pill-progress", className)}>
      <span style={{ width: `${Math.max(0, Math.min(value, 100))}%` }} />
    </div>
  );
}
