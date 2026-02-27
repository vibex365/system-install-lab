import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Phone, Clock, Loader2, ChevronDown, ChevronUp, Target, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface CallLog {
  id: string;
  phone_number: string;
  call_type: string;
  country_code: string;
  vapi_call_id: string | null;
  status: string;
  duration_seconds: number | null;
  call_duration_seconds: number | null;
  call_summary: string | null;
  context: Record<string, any>;
  created_at: string;
}

const STATUS_COLORS: Record<string, string> = {
  initiated: "bg-blue-500/20 text-blue-400",
  queued: "bg-amber-500/20 text-amber-400",
  ringing: "bg-cyan-500/20 text-cyan-400",
  "in-progress": "bg-emerald-500/20 text-emerald-400",
  completed: "bg-primary/20 text-primary",
  ended: "bg-muted text-muted-foreground",
  failed: "bg-destructive/20 text-destructive",
};

export default function AdminCallLog() {
  const [logs, setLogs] = useState<CallLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("call_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    setLogs((data as CallLog[]) ?? []);
    setLoading(false);
  };

  const regenerateSummary = async (callLogId: string) => {
    setRegeneratingId(callLogId);
    try {
      const { data, error } = await supabase.functions.invoke("regenerate-call-summary", {
        body: { call_log_id: callLogId },
      });
      if (error) throw error;
      if (data?.error) {
        toast.error(data.error);
        return;
      }
      if (data?.summary) {
        setLogs(prev => prev.map(l => l.id === callLogId ? { ...l, call_summary: data.summary } : l));
        setExpandedId(callLogId);
        toast.success("Sales brief generated");
      }
    } catch (e: any) {
      toast.error(e.message || "Failed to generate summary");
    } finally {
      setRegeneratingId(null);
    }
  };

  const formatDuration = (secs: number | null) => {
    if (!secs) return "—";
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  };

  const completedWithoutSummary = logs.filter(l => l.status === "completed" && !l.call_summary);

  return (
    <AdminShell>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-foreground">Call Log</h1>
          <p className="text-xs text-muted-foreground mt-1">Click completed calls to view the sales intelligence brief.</p>
        </div>
        {completedWithoutSummary.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            className="gap-2 text-xs"
            disabled={!!regeneratingId}
            onClick={async () => {
              for (const log of completedWithoutSummary) {
                await regenerateSummary(log.id);
              }
            }}
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Generate {completedWithoutSummary.length} Missing Briefs
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : logs.length === 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="py-12 text-center">
            <Phone className="h-8 w-8 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-sm text-muted-foreground">No calls have been made yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {logs.map((log) => {
            const isExpanded = expandedId === log.id;
            const hasSummary = !!log.call_summary;
            const duration = log.call_duration_seconds || log.duration_seconds;
            const isCompleted = log.status === "completed";
            const isRegenerating = regeneratingId === log.id;

            return (
              <div key={log.id} className="rounded-lg border border-border bg-card overflow-hidden">
                <div
                  className="w-full flex items-center gap-4 px-4 py-3 text-left hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => {
                    if (hasSummary) setExpandedId(isExpanded ? null : log.id);
                  }}
                >
                  <Phone className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className="text-sm text-foreground font-mono w-32 shrink-0">{log.phone_number}</span>
                  <Badge variant="outline" className="text-[10px] capitalize shrink-0">
                    {log.call_type.replace(/_/g, " ")}
                  </Badge>
                  <span className="text-xs text-muted-foreground truncate flex-1">
                    {log.context?.name || log.context?.business_name || "—"}
                  </span>
                  <span className="text-xs text-muted-foreground shrink-0 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDuration(duration)}
                  </span>
                  <Badge variant="outline" className={`text-[10px] shrink-0 ${STATUS_COLORS[log.status] || ""}`}>
                    {log.status}
                  </Badge>
                  <span className="text-xs text-muted-foreground shrink-0 w-28">
                    {format(new Date(log.created_at), "MMM d, h:mm a")}
                  </span>

                  {/* Regenerate button for completed calls without summary */}
                  {isCompleted && !hasSummary && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs text-primary hover:text-primary/80 shrink-0"
                      disabled={isRegenerating}
                      onClick={(e) => {
                        e.stopPropagation();
                        regenerateSummary(log.id);
                      }}
                    >
                      {isRegenerating ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <><RefreshCw className="h-3.5 w-3.5 mr-1" /> Brief</>
                      )}
                    </Button>
                  )}

                  {hasSummary && (
                    isExpanded
                      ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
                      : <ChevronDown className="h-4 w-4 text-primary shrink-0" />
                  )}
                </div>

                {isExpanded && log.call_summary && (
                  <div className="border-t border-border bg-muted/30 px-5 py-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Target className="h-4 w-4 text-primary" />
                        <span className="text-xs font-semibold text-primary uppercase tracking-wider">Sales Intelligence Brief</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                        disabled={isRegenerating}
                        onClick={() => regenerateSummary(log.id)}
                      >
                        {isRegenerating ? <Loader2 className="h-3 w-3 animate-spin" /> : <><RefreshCw className="h-3 w-3 mr-1" /> Regenerate</>}
                      </Button>
                    </div>
                    <div className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                      {log.call_summary}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </AdminShell>
  );
}
