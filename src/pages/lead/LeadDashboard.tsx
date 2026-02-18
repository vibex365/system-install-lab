import { useEffect, useState } from "react";
import { AuthGate } from "@/components/AuthGate";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import { Users, Calendar, CheckCircle, AlertTriangle } from "lucide-react";

export default function LeadDashboard() {
  const { user } = useAuth();
  const [cohort, setCohort] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      // Find cohort led by this user
      const { data: cohortData } = await supabase
        .from("cohorts")
        .select("*")
        .eq("lead_id", user.id)
        .single();
      setCohort(cohortData);

      if (cohortData) {
        const { data: membersData } = await supabase
          .from("cohort_members")
          .select("*, profile:profiles!cohort_members_user_id_fkey(full_name, email, attendance_count, consecutive_missed_sessions)")
          .eq("cohort_id", cohortData.id);
        setMembers(membersData || []);
      }
      setLoading(false);
    };
    load();
  }, [user]);

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <AuthGate requireLead>
      <div className="min-h-screen bg-background">
        <div className="max-w-3xl mx-auto px-6 py-20">
          <p className="text-xs uppercase tracking-[0.3em] text-primary mb-4">Architect Lead</p>
          <h1 className="text-2xl font-bold text-foreground mb-6">Cohort Dashboard</h1>

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : !cohort ? (
            <p className="text-muted-foreground">No cohort assigned to you.</p>
          ) : (
            <>
              <Card className="bg-card border-border mb-6">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm font-semibold text-foreground">{cohort.name}</p>
                      <p className="text-xs text-muted-foreground">{dayNames[cohort.day_of_week]} · {cohort.time_slot} · {members.length}/{cohort.capacity} members</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-foreground">Members ({members.length})</h2>
                <Button asChild size="sm" variant="outline" className="text-xs border-border">
                  <Link to="/lead/attendance">Take Attendance</Link>
                </Button>
              </div>

              <div className="space-y-2">
                {members.map((m) => (
                  <Card key={m.id} className="bg-card border-border">
                    <CardContent className="p-3 flex items-center justify-between">
                      <div>
                        <p className="text-sm text-foreground">{m.profile?.full_name || m.profile?.email}</p>
                        <p className="text-xs text-muted-foreground">{m.profile?.attendance_count || 0} sessions attended</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {(m.profile?.consecutive_missed_sessions || 0) >= 2 && (
                          <AlertTriangle className="h-4 w-4 text-destructive" />
                        )}
                        {(m.profile?.consecutive_missed_sessions || 0) < 2 && (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </AuthGate>
  );
}
