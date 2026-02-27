import { ArrowRight } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ActivityEntry {
  id: string;
  lead_id: string;
  from_status: string | null;
  to_status: string;
  created_at: string;
  lead_name?: string;
}

interface LeadTimelineProps {
  activities: ActivityEntry[];
  leadMap: Record<string, string>;
}

export function LeadTimeline({ activities, leadMap }: LeadTimelineProps) {
  if (activities.length === 0) {
    return (
      <p className="text-xs text-muted-foreground text-center py-6">
        No pipeline activity yet. Activity will appear here as agents process leads.
      </p>
    );
  }

  return (
    <ScrollArea className="h-64">
      <div className="space-y-1 pr-3">
        {activities.map((a) => (
          <div key={a.id} className="flex items-center gap-2 py-1.5 border-b border-border/50 last:border-0">
            <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
            <span className="text-xs font-medium text-foreground truncate max-w-[140px]">
              {leadMap[a.lead_id] || "Unknown"}
            </span>
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
              {a.from_status && (
                <>
                  <span className="capitalize">{a.from_status.replace(/_/g, " ")}</span>
                  <ArrowRight className="h-2.5 w-2.5" />
                </>
              )}
              <span className="capitalize text-foreground font-medium">{a.to_status.replace(/_/g, " ")}</span>
            </div>
            <span className="ml-auto text-[10px] text-muted-foreground whitespace-nowrap">
              {new Date(a.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
