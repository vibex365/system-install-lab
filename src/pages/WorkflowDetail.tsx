import { useEffect, useState, useMemo } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, CheckCircle2, Circle, Loader2, XCircle, Pause, Play, Users, BarChart3 } from "lucide-react";

const stepIcons: Record<string, React.ReactNode> = {
  pending: <Circle className="h-4 w-4 text-muted-foreground" />,
  running: <Loader2 className="h-4 w-4 text-primary animate-spin" />,
  completed: <CheckCircle2 className="h-4 w-4 text-emerald-400" />,
  failed: <XCircle className="h-4 w-4 text-destructive" />,
  skipped: <Circle className="h-4 w-4 text-muted-foreground/50" />,
};

export default function WorkflowDetail() {
  const { id } = useParams<{ id: string }>();
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [workflow, setWorkflow] = useState<any>(null);
  const [steps, setSteps] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !user) navigate("/login", { replace: true });
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user || !id) return;

    const fetchData = async () => {
      const [wf, st, ld] = await Promise.all([
        supabase.from("workflows").select("*").eq("id", id).single(),
        supabase.from("workflow_steps").select("*").eq("workflow_id", id).order("position"),
        supabase.from("leads").select("id, business_name, pipeline_status, rating, city, category").eq("user_id", user.id),
      ]);
      if (wf.data) setWorkflow(wf.data);
      if (st.data) setSteps(st.data);
      if (ld.data) setLeads(ld.data);
      setFetching(false);
    };

    fetchData();

    // Realtime subscription
    const channel = supabase
      .channel(`workflow-${id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "workflows", filter: `id=eq.${id}` }, (payload) => {
        setWorkflow(payload.new);
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "workflow_steps", filter: `workflow_id=eq.${id}` }, () => {
        supabase.from("workflow_steps").select("*").eq("workflow_id", id).order("position").then(({ data }) => {
          if (data) setSteps(data);
        });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, id]);

  const togglePause = async () => {
    if (!workflow) return;
    const newStatus = workflow.status === "paused" ? "running" : "paused";
    const { error } = await supabase.from("workflows").update({ status: newStatus }).eq("id", workflow.id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
  };

  const pipelineStats = useMemo(() => {
    const counts: Record<string, number> = {};
    leads.forEach((l) => {
      counts[l.pipeline_status] = (counts[l.pipeline_status] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [leads]);

  const statusColors: Record<string, string> = {
    scraped: "bg-muted text-muted-foreground",
    qualified: "bg-primary/10 text-primary border-primary/20",
    contacted: "bg-accent/10 text-accent-foreground border-accent/20",
    sms_sent: "bg-secondary text-secondary-foreground",
    booked: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    closed: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  };

  const completedCount = steps.filter(s => s.status === "completed").length;

  if (loading || fetching) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!workflow) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-24 pb-20">
          <div className="container max-w-4xl text-center py-20">
            <p className="text-muted-foreground">Workflow not found.</p>
            <Button asChild className="mt-4" variant="outline">
              <Link to="/dashboard/workflows">Back to Workflows</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-20">
        <div className="container max-w-4xl">
          <div className="flex items-center gap-3 mb-8">
            <Button asChild variant="ghost" size="sm">
              <Link to="/dashboard/workflows"><ArrowLeft className="h-4 w-4" /></Link>
            </Button>
            <div className="flex-1">
              <h1 className="text-lg font-bold text-foreground">{workflow.goal}</h1>
              <p className="text-xs text-muted-foreground mt-1">
                {new Date(workflow.created_at).toLocaleString()} · {completedCount}/{steps.length} steps complete
              </p>
            </div>
            {(workflow.status === "running" || workflow.status === "paused") && (
              <Button variant="outline" size="sm" onClick={togglePause}>
                {workflow.status === "paused" ? <Play className="h-3.5 w-3.5 mr-1" /> : <Pause className="h-3.5 w-3.5 mr-1" />}
                {workflow.status === "paused" ? "Resume" : "Pause"}
              </Button>
            )}
          </div>

          {/* Progress bar */}
          <div className="h-1.5 bg-muted rounded-full mb-8 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-500"
              style={{ width: steps.length ? `${(completedCount / steps.length) * 100}%` : "0%" }}
            />
          </div>

          {/* Pipeline Stats */}
          {pipelineStats.length > 0 && (
            <Card className="bg-card border-border mb-8">
              <CardHeader className="pb-3 pt-4 px-5">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-primary" />
                  Lead Pipeline
                  <Badge variant="secondary" className="ml-auto text-[10px]">
                    {leads.length} total
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="px-5 pb-4">
                <div className="flex flex-wrap gap-2">
                  {pipelineStats.map(([status, count]) => (
                    <div
                      key={status}
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${statusColors[status] || "bg-muted text-muted-foreground"}`}
                    >
                      <span className="capitalize">{status.replace(/_/g, " ")}</span>
                      <span className="font-bold">{count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Steps */}
          <div className="space-y-3">
            {steps.map((step) => (
              <Card key={step.id} className={`bg-card border-border ${step.status === "running" ? "border-primary/30" : ""}`}>
                <CardContent className="py-4 px-5">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">{stepIcons[step.status] || stepIcons.pending}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-foreground capitalize">{step.agent_id.replace(/_/g, " ")}</span>
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{step.status}</span>
                      </div>

                      {step.error && (
                        <p className="text-xs text-destructive mt-1">{step.error}</p>
                      )}

                      {step.output && (
                        <div className="mt-2 rounded-lg bg-background border border-border p-3">
                          <pre className="text-[11px] text-muted-foreground overflow-auto max-h-32 whitespace-pre-wrap">
                            {typeof step.output === "string" ? step.output : JSON.stringify(step.output, null, 2)}
                          </pre>
                        </div>
                      )}

                      {step.completed_at && (
                        <p className="text-[10px] text-muted-foreground mt-1">
                          Completed {new Date(step.completed_at).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {steps.length === 0 && (
            <Card className="bg-card border-border">
              <CardContent className="py-12 text-center">
                <Loader2 className="h-6 w-6 text-primary animate-spin mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Planning workflow steps...</p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
