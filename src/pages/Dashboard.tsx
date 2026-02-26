import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Zap, Rocket, Target, ArrowRight, Mail, Phone, MessageSquare, Search, BarChart3 } from "lucide-react";
import { motion } from "framer-motion";

const quickGoals = [
  { label: "Find Leads", icon: Search, goal: "Find 50 leads in my niche in my local area" },
  { label: "Build Funnel", icon: Target, goal: "Build a quiz funnel for my niche that captures leads and books calls" },
  { label: "Book Calls", icon: Phone, goal: "Call my top 20 qualified leads and book discovery calls" },
  { label: "Email Campaign", icon: Mail, goal: "Send a 3-part email sequence to my uncontacted leads" },
  { label: "SMS Follow-up", icon: MessageSquare, goal: "Send SMS follow-ups to leads who haven't responded to email" },
  { label: "Competitor Intel", icon: BarChart3, goal: "Research my top 5 competitors and find positioning gaps" },
];

export default function Dashboard() {
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [goal, setGoal] = useState("");
  const [launching, setLaunching] = useState(false);
  const [workflows, setWorkflows] = useState<any[]>([]);

  useEffect(() => {
    if (!loading && !user) navigate("/login", { replace: true });
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("workflows")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(5)
      .then(({ data }) => {
        if (data) setWorkflows(data);
      });
  }, [user]);

  const launchWorkflow = async (goalText: string) => {
    if (!goalText.trim() || !user) return;
    setLaunching(true);
    try {
      const { data, error } = await supabase.functions.invoke("orchestrator", {
        body: { goal: goalText.trim() },
      });
      if (error) throw error;
      toast({ title: "Workflow launched!", description: "Your agents are working on it." });
      if (data?.workflow_id) {
        navigate(`/dashboard/workflows/${data.workflow_id}`);
      }
    } catch (err: any) {
      toast({ title: "Failed to launch", description: err.message, variant: "destructive" });
    } finally {
      setLaunching(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  const statusColors: Record<string, string> = {
    planning: "text-primary",
    running: "text-emerald-400",
    completed: "text-emerald-400",
    paused: "text-yellow-400",
    failed: "text-destructive",
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-20">
        <div className="container max-w-4xl">
          {/* Goal Input */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-10"
          >
            <Card className="bg-card border-border overflow-hidden">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl flex items-center gap-2">
                  <Zap className="h-5 w-5 text-primary" />
                  What do you want to accomplish?
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  placeholder="Get me 50 MLM leads in Dallas who are interested in health supplements..."
                  className="min-h-[80px] bg-background border-border resize-none text-sm"
                />

                <div className="flex flex-wrap gap-2">
                  {quickGoals.map((qg) => (
                    <button
                      key={qg.label}
                      onClick={() => setGoal(qg.goal)}
                      className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-xs text-muted-foreground hover:border-primary/30 hover:text-foreground transition-all"
                    >
                      <qg.icon className="h-3 w-3" />
                      {qg.label}
                    </button>
                  ))}
                </div>

                <Button
                  onClick={() => launchWorkflow(goal)}
                  disabled={!goal.trim() || launching}
                  className="w-full gold-glow-strong"
                  size="lg"
                >
                  {launching ? (
                    <>
                      <div className="h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2" />
                      Launching...
                    </>
                  ) : (
                    <>
                      <Rocket className="h-4 w-4 mr-2" />
                      Launch Workflow
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Recent Workflows */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">Recent Workflows</h2>
              <Button asChild variant="ghost" size="sm" className="text-primary">
                <Link to="/dashboard/workflows">View All <ArrowRight className="h-3 w-3 ml-1" /></Link>
              </Button>
            </div>

            {workflows.length === 0 ? (
              <Card className="bg-card border-border">
                <CardContent className="py-12 text-center">
                  <Zap className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">No workflows yet. Describe a goal above to get started.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {workflows.map((w) => (
                  <Link
                    key={w.id}
                    to={`/dashboard/workflows/${w.id}`}
                    className="block rounded-xl border border-border bg-card p-4 hover:border-primary/30 transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{w.goal}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(w.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <span className={`text-xs font-semibold uppercase tracking-wider ${statusColors[w.status] || "text-muted-foreground"}`}>
                        {w.status}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Active Workflows", value: workflows.filter(w => w.status === "running").length, icon: Zap },
              { label: "Completed", value: workflows.filter(w => w.status === "completed").length, icon: Target },
              { label: "Leads Found", value: "—", icon: Search },
              { label: "Calls Booked", value: "—", icon: Phone },
            ].map((s) => (
              <Card key={s.label} className="bg-card border-border">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <s.icon className="h-3.5 w-3.5 text-primary" />
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{s.label}</span>
                  </div>
                  <p className="text-2xl font-bold text-foreground">{s.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
