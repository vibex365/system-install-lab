import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusPill } from "@/components/StatusPill";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { CheckCircle, XCircle, Clock } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Application = Tables<"applications">;

export default function AdminApplications() {
  const { toast } = useToast();
  const [apps, setApps] = useState<Application[]>([]);
  const [selected, setSelected] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [smsStatus, setSmsStatus] = useState<Record<string, string>>({});

  const fetch = async () => {
    setLoading(true);
    const { data } = await supabase.from("applications").select("*").order("created_at", { ascending: false });
    setApps(data ?? []);
    setLoading(false);
  };

  useEffect(() => { fetch(); }, []);

  const sendSms = async (phone: string, message: string, appId: string) => {
    setSmsStatus((p) => ({ ...p, [appId]: "sending" }));
    try {
      const { error } = await supabase.functions.invoke("send-sms", { body: { phone, message } });
      if (error) throw error;
      setSmsStatus((p) => ({ ...p, [appId]: "sent" }));
    } catch {
      setSmsStatus((p) => ({ ...p, [appId]: "failed" }));
    }
  };

  const updateStatus = async (app: Application, status: Application["status"]) => {
    const { error } = await supabase.from("applications").update({ status }).eq("id", app.id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }

    if (status === "accepted" && app.user_id) {
      await supabase.from("profiles").update({ member_status: "accepted_pending_payment" as any }).eq("id", app.user_id);
    }
    if (status === "accepted" && app.phone_number) {
      await sendSms(app.phone_number, "You've been accepted into PFSW. Log in to complete onboarding.", app.id);
    }
    if (status === "rejected" && app.phone_number) {
      await sendSms(app.phone_number, "Your PFSW application was not approved at this time.", app.id);
    }

    toast({ title: `Application ${status}` });
    fetch();
    setSelected(null);
  };

  const sc = (s: string) => s === "accepted" ? "active" : s === "rejected" ? "muted" : "default";

  if (selected) {
    return (
      <AdminShell>
        <div className="max-w-2xl">
          <Button variant="ghost" size="sm" onClick={() => setSelected(null)} className="mb-4 text-xs">← Back</Button>
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                {selected.name} <StatusPill label={selected.status} variant={sc(selected.status)} />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="grid sm:grid-cols-2 gap-3">
                {[
                  ["Email", selected.email], ["Phone", selected.phone_number], ["Role", selected.role],
                  ["Stage", selected.stage], ["Payment", selected.payment_status], ["Revenue", selected.monthly_revenue],
                  ["Hours/wk", selected.hours_per_week], ["Team", selected.team_status],
                ].map(([l, v]) => (
                  <div key={l as string}><span className="text-muted-foreground">{l}:</span> <span className="text-foreground">{(v as string) || "—"}</span></div>
                ))}
              </div>
              <div className="border-t border-border pt-4 space-y-3">
                {[
                  ["Building", selected.product], ["Bottleneck", selected.bottleneck],
                  ["Why now", selected.why_now], ["Consequence", selected.consequence],
                  ["Avoiding", selected.avoiding], ["Peak productivity", selected.peak_productivity],
                ].map(([l, v]) => v && (
                  <div key={l as string}>
                    <p className="text-xs text-muted-foreground mb-1">{l}</p>
                    <p className="text-sm text-foreground bg-muted/50 rounded-lg p-3">{v as string}</p>
                  </div>
                ))}
              </div>

              {smsStatus[selected.id] && (
                <p className={`text-xs rounded-lg p-2 border ${smsStatus[selected.id] === "sent" ? "text-green-500 border-green-500/20" : smsStatus[selected.id] === "sending" ? "text-primary border-primary/20" : "text-destructive border-destructive/20"}`}>
                  {smsStatus[selected.id] === "sent" ? "✓ SMS sent" : smsStatus[selected.id] === "sending" ? "Sending..." : "✗ SMS failed"}
                </p>
              )}

              <div className="flex flex-wrap gap-2 pt-2">
                <Button size="sm" variant="outline" onClick={() => updateStatus(selected, "reviewing")} disabled={selected.status === "reviewing"} className="text-xs">
                  <Clock className="h-3 w-3 mr-1" /> Review
                </Button>
                <Button size="sm" onClick={() => updateStatus(selected, "accepted")} disabled={selected.status === "accepted"} className="text-xs">
                  <CheckCircle className="h-3 w-3 mr-1" /> Accept
                </Button>
                <Button size="sm" variant="destructive" onClick={() => updateStatus(selected, "rejected")} disabled={selected.status === "rejected"} className="text-xs">
                  <XCircle className="h-3 w-3 mr-1" /> Reject
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell>
      <h1 className="text-xl font-bold text-foreground mb-4">Applications</h1>
      {loading ? (
        <div className="flex justify-center py-12"><div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="rounded-lg border border-border overflow-x-auto">
          <table className="w-full text-sm min-w-[500px]">
            <thead className="bg-muted">
              <tr>
                <th className="text-left px-4 py-2.5 text-muted-foreground font-medium text-xs">Name</th>
                <th className="text-left px-4 py-2.5 text-muted-foreground font-medium text-xs hidden sm:table-cell">Email</th>
                <th className="text-left px-4 py-2.5 text-muted-foreground font-medium text-xs">Status</th>
                <th className="text-left px-4 py-2.5 text-muted-foreground font-medium text-xs hidden md:table-cell">Date</th>
              </tr>
            </thead>
            <tbody>
              {apps.map((app) => (
                <tr key={app.id} className="border-t border-border hover:bg-muted/50 cursor-pointer" onClick={() => setSelected(app)}>
                  <td className="px-4 py-2.5 text-foreground">{app.name}</td>
                  <td className="px-4 py-2.5 text-muted-foreground hidden sm:table-cell">{app.email}</td>
                  <td className="px-4 py-2.5"><StatusPill label={app.status} variant={sc(app.status)} /></td>
                  <td className="px-4 py-2.5 text-muted-foreground hidden md:table-cell">{format(new Date(app.created_at), "MMM d")}</td>
                </tr>
              ))}
              {apps.length === 0 && <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">No applications.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </AdminShell>
  );
}
