import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { AuthGate } from "@/components/AuthGate";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Users, Clock } from "lucide-react";

const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function ChooseCohort() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [cohorts, setCohorts] = useState<any[]>([]);
  const [memberCounts, setMemberCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data: cohortsData } = await supabase
        .from("cohorts")
        .select("*")
        .eq("active", true)
        .order("day_of_week");

      setCohorts(cohortsData || []);

      // Get member counts
      if (cohortsData && cohortsData.length > 0) {
        const { data: members } = await supabase
          .from("cohort_members")
          .select("cohort_id");
        const counts: Record<string, number> = {};
        members?.forEach((m) => { counts[m.cohort_id] = (counts[m.cohort_id] || 0) + 1; });
        setMemberCounts(counts);
      }
      setLoading(false);
    };
    load();
  }, []);

  const joinCohort = async (cohortId: string) => {
    if (!user) return;
    setJoining(cohortId);
    try {
      const { error: insertError } = await supabase
        .from("cohort_members")
        .insert({ cohort_id: cohortId, user_id: user.id });
      if (insertError) throw insertError;

      await supabase
        .from("profiles")
        .update({ cohort_id: cohortId } as any)
        .eq("id", user.id);

      toast({ title: "Cohort assigned" });
      navigate("/engine");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setJoining(null);
    }
  };

  return (
    <AuthGate requireActive>
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-24 pb-20">
          <div className="container max-w-2xl">
            <p className="text-xs uppercase tracking-[0.3em] text-primary mb-4">Cohort Selection</p>
            <h1 className="text-2xl font-bold text-foreground mb-2">Choose Your Cohort</h1>
            <p className="text-sm text-muted-foreground mb-8">
              Select your weekly session time. Once enrolled, attendance is mandatory.
            </p>

            {loading ? (
              <div className="flex justify-center py-20">
                <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : cohorts.length === 0 ? (
              <p className="text-center text-muted-foreground py-12">No cohorts available. Contact administration.</p>
            ) : (
              <div className="space-y-3">
                {cohorts.map((c) => {
                  const count = memberCounts[c.id] || 0;
                  const full = count >= c.capacity;
                  return (
                    <Card key={c.id} className={`bg-card border-border ${full ? "opacity-50" : "hover:border-primary/30"} transition-colors`}>
                      <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="flex flex-col items-center justify-center w-14 h-14 rounded-lg bg-primary/10">
                            <Calendar className="h-4 w-4 text-primary mb-0.5" />
                            <span className="text-[10px] text-primary font-medium">{dayNames[c.day_of_week]?.slice(0, 3)}</span>
                          </div>
                          <div>
                            <h3 className="text-sm font-semibold text-foreground">{c.name}</h3>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {c.time_slot}</span>
                              <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {count}/{c.capacity}</span>
                            </div>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          disabled={full || !!joining}
                          onClick={() => joinCohort(c.id)}
                          className={full ? "" : "gold-glow-strong"}
                        >
                          {joining === c.id ? "Joining..." : full ? "Full" : "Join"}
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </main>
        <Footer />
      </div>
    </AuthGate>
  );
}
