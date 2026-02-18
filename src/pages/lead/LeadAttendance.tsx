import { useEffect, useState } from "react";
import { AuthGate } from "@/components/AuthGate";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import { ArrowLeft, Check, X } from "lucide-react";

export default function LeadAttendance() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [cohort, setCohort] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<Record<string, "present" | "absent">>({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data: cohortData } = await supabase
        .from("cohorts")
        .select("*")
        .eq("lead_id", user.id)
        .single();
      setCohort(cohortData);

      if (cohortData) {
        const { data: membersData } = await supabase
          .from("cohort_members")
          .select("*, profile:profiles!cohort_members_user_id_fkey(id, full_name, email, attendance_count, consecutive_missed_sessions)")
          .eq("cohort_id", cohortData.id);
        setMembers(membersData || []);
      }
      setLoading(false);
    };
    load();
  }, [user]);

  const mark = (userId: string, status: "present" | "absent") => {
    setAttendance((prev) => ({ ...prev, [userId]: status }));
  };

  const saveAttendance = async () => {
    setSaving(true);
    try {
      for (const m of members) {
        const profileId = m.profile?.id;
        if (!profileId) continue;
        const status = attendance[profileId];
        if (!status) continue;

        if (status === "present") {
          await supabase.from("profiles").update({
            attendance_count: (m.profile.attendance_count || 0) + 1,
            consecutive_missed_sessions: 0,
            last_attended_at: new Date().toISOString(),
          } as any).eq("id", profileId);
        } else {
          const missed = (m.profile.consecutive_missed_sessions || 0) + 1;
          await supabase.from("profiles").update({
            consecutive_missed_sessions: missed,
          } as any).eq("id", profileId);
        }
      }
      toast({ title: "Attendance saved" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AuthGate requireLead>
      <div className="min-h-screen bg-background">
        <div className="max-w-lg mx-auto px-6 py-20">
          <Link to="/lead/dashboard" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-6">
            <ArrowLeft className="h-3 w-3" /> Back to Dashboard
          </Link>

          <h1 className="text-xl font-bold text-foreground mb-1">Roll Call</h1>
          <p className="text-sm text-muted-foreground mb-6">{cohort?.name || "Your Cohort"}</p>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              <div className="space-y-2 mb-6">
                {members.map((m) => {
                  const pid = m.profile?.id;
                  const status = pid ? attendance[pid] : undefined;
                  return (
                    <Card key={m.id} className="bg-card border-border">
                      <CardContent className="p-3 flex items-center justify-between">
                        <div>
                          <p className="text-sm text-foreground">{m.profile?.full_name || m.profile?.email}</p>
                          <p className="text-[10px] text-muted-foreground">
                            Missed: {m.profile?.consecutive_missed_sessions || 0} consecutive
                          </p>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant={status === "present" ? "default" : "outline"}
                            className={`h-7 w-7 p-0 ${status === "present" ? "" : "border-border"}`}
                            onClick={() => pid && mark(pid, "present")}
                          >
                            <Check className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant={status === "absent" ? "destructive" : "outline"}
                            className={`h-7 w-7 p-0 ${status === "absent" ? "" : "border-border"}`}
                            onClick={() => pid && mark(pid, "absent")}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              <Button onClick={saveAttendance} disabled={saving || Object.keys(attendance).length === 0} className="w-full gold-glow-strong">
                {saving ? "Saving..." : "Save Attendance"}
              </Button>
            </>
          )}
        </div>
      </div>
    </AuthGate>
  );
}
