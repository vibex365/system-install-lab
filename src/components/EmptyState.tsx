import { Inbox } from "lucide-react";

interface EmptyStateProps {
  message: string;
  sub?: string;
}

export function EmptyState({ message, sub }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Inbox className="h-10 w-10 text-muted-foreground/40 mb-4" />
      <p className="text-sm font-medium text-muted-foreground">{message}</p>
      {sub && <p className="text-xs text-muted-foreground/60 mt-1">{sub}</p>}
    </div>
  );
}
