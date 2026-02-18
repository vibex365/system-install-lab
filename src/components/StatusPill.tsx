import { cn } from "@/lib/utils";

interface StatusPillProps {
  label: string;
  variant?: "default" | "active" | "muted";
}

export function StatusPill({ label, variant = "default" }: StatusPillProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold tracking-wide",
        variant === "active" && "border border-primary/30 bg-primary/10 text-primary",
        variant === "muted" && "border border-border bg-muted text-muted-foreground",
        variant === "default" && "border border-border bg-card text-foreground"
      )}
    >
      {variant === "active" && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
      {label}
    </span>
  );
}
