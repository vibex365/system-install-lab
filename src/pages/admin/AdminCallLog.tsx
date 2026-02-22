import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Phone, Clock, Loader2 } from "lucide-react";

interface CallLog {
  id: string;
  phone_number: string;
  call_type: string;
  country_code: string;
  vapi_call_id: string | null;
  status: string;
  duration_seconds: number | null;
  context: Record<string, any>;
  created_at: string;
}

const STATUS_COLORS: Record<string, string> = {
  initiated: "bg-blue-500/20 text-blue-400",
  queued: "bg-amber-500/20 text-amber-400",
  ringing: "bg-cyan-500/20 text-cyan-400",
  "in-progress": "bg-emerald-500/20 text-emerald-400",
  ended: "bg-muted text-muted-foreground",
  failed: "bg-destructive/20 text-destructive",
};

export default function AdminCallLog() {
  const [logs, setLogs] = useState<CallLog[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <AdminShell>
      <h1 className="text-xl font-bold text-foreground mb-4">Call Log</h1>
      <p className="text-xs text-muted-foreground mb-6">All VAPI outbound calls made from the platform.</p>

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
        <div className="rounded-lg border border-border overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead className="bg-muted">
              <tr>
                <th className="text-left px-4 py-2.5 text-muted-foreground font-medium text-xs">Phone</th>
                <th className="text-left px-4 py-2.5 text-muted-foreground font-medium text-xs">Type</th>
                <th className="text-left px-4 py-2.5 text-muted-foreground font-medium text-xs">Context</th>
                <th className="text-left px-4 py-2.5 text-muted-foreground font-medium text-xs">Status</th>
                <th className="text-left px-4 py-2.5 text-muted-foreground font-medium text-xs">Date</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-t border-border hover:bg-muted/50">
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2 text-foreground">
                      <Phone className="h-3 w-3 text-muted-foreground" />
                      {log.phone_number}
                    </div>
                  </td>
                  <td className="px-4 py-2.5">
                    <Badge variant="outline" className="text-[10px] capitalize">
                      {log.call_type.replace(/_/g, " ")}
                    </Badge>
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground text-xs max-w-[200px] truncate">
                    {log.context?.name || log.context?.business_name || "—"}
                  </td>
                  <td className="px-4 py-2.5">
                    <Badge variant="outline" className={`text-[10px] ${STATUS_COLORS[log.status] || ""}`}>
                      {log.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground text-xs">
                    {format(new Date(log.created_at), "MMM d, h:mm a")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminShell>
  );
}
