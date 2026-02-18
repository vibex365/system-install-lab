import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { AuthGate } from "@/components/AuthGate";
import { StatusPill } from "@/components/StatusPill";
import { StepList } from "@/components/StepList";
import { EmptyState } from "@/components/EmptyState";
import { track } from "@/lib/analytics";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Map, Zap, FileText } from "lucide-react";

const cadenceSteps = [
  { label: "Plan", active: true },
  { label: "Build", active: false },
  { label: "Ship", active: false },
  { label: "Review", active: false },
];

const promptPacks = ["MVP Blueprint Prompt", "Architecture Prompt", "Landing Page Prompt"];

export default function Dashboard() {
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [activating, setActivating] = useState(false);

  useEffect(() => { track("dashboard_viewed"); }, []);

  // Verify membership payment if redirected from Stripe
  useEffect(() => {
    const membershipSessionId = searchParams.get("membership_session_id");
    if (!membershipSessionId) return;

    const verify = async () => {
      setActivating(true);
      try {
        const { data, error } = await supabase.functions.invoke("verify-membership-payment", {
          body: { session_id: membershipSessionId },
        });
        if (error) throw error;
        if (data?.error) throw new Error(data.error);
        toast({ title: "Membership activated!", description: `Welcome, ${data.tier} member.` });
        // Clean URL
        window.history.replaceState({}, "", "/dashboard");
      } catch (err: any) {
        console.error("Membership verification error:", err);
        toast({ title: "Verification issue", description: err.message, variant: "destructive" });
      } finally {
        setActivating(false);
      }
    };

    verify();
  }, [searchParams, toast]);

  return (
    <AuthGate requireActive>
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-24 pb-20">
          <div className="container max-w-5xl">
            {activating && (
              <div className="mb-6 rounded-lg border border-primary/20 bg-primary/5 p-4 text-center">
                <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin inline-block mr-2" />
                <span className="text-sm text-primary font-medium">Activating your membership...</span>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3 mb-10">
              <StatusPill label="Active" variant="active" />
              <StatusPill label="Week 01" />
              <Button size="sm" disabled className="ml-auto tracking-wide opacity-50">
                Start Weekly Sprint
              </Button>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mb-12">
              <Card className="bg-card border-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Map className="h-4 w-4 text-primary" /> This Week's System
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">Your System Map appears here.</p>
                  <Button size="sm" variant="outline" disabled className="opacity-50 border-border">Generate System Map</Button>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Zap className="h-4 w-4 text-primary" /> Execution Cadence
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <StepList steps={cadenceSteps} />
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" /> Prompt Packs
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {promptPacks.map((p) => (
                    <div key={p} className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2">
                      <span className="text-sm text-foreground">{p}</span>
                      <Button size="sm" variant="ghost" className="text-xs text-primary h-auto py-1 px-2" disabled>Open</Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-foreground mb-4">Recent Activity</h2>
              <Card className="bg-card border-border">
                <CardContent className="p-0">
                  <EmptyState message="No activity yet." sub="Start Week 01." />
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </AuthGate>
  );
}
