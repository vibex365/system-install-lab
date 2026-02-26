import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Zap, ArrowLeft } from "lucide-react";

export default function Workflows() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !user) navigate("/login", { replace: true });
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("workflows")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (data) setWorkflows(data);
        setFetching(false);
      });
  }, [user]);

  const statusColors: Record<string, string> = {
    planning: "bg-primary/10 text-primary",
    running: "bg-emerald-500/10 text-emerald-400",
    completed: "bg-emerald-500/10 text-emerald-400",
    paused: "bg-yellow-500/10 text-yellow-400",
    failed: "bg-destructive/10 text-destructive",
  };

  if (loading || fetching) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
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
              <Link to="/dashboard"><ArrowLeft className="h-4 w-4" /></Link>
            </Button>
            <h1 className="text-2xl font-bold text-foreground">All Workflows</h1>
          </div>

          {workflows.length === 0 ? (
            <Card className="bg-card border-border">
              <CardContent className="py-16 text-center">
                <Zap className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No workflows yet.</p>
                <Button asChild className="mt-4" variant="outline">
                  <Link to="/dashboard">Create Your First Workflow</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {workflows.map((w) => (
                <Link
                  key={w.id}
                  to={`/dashboard/workflows/${w.id}`}
                  className="block rounded-xl border border-border bg-card p-5 hover:border-primary/30 transition-all"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{w.goal}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-xs text-muted-foreground">
                          {new Date(w.created_at).toLocaleDateString()}
                        </span>
                        {w.niche && (
                          <span className="text-[10px] uppercase tracking-wider text-primary bg-primary/5 px-2 py-0.5 rounded-full">
                            {w.niche}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded-full ${statusColors[w.status] || "bg-muted text-muted-foreground"}`}>
                      {w.status}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
