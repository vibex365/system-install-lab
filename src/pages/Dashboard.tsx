import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { AuthGate } from "@/components/AuthGate";
import { StatusPill } from "@/components/StatusPill";
import { StepList } from "@/components/StepList";
import { EmptyState } from "@/components/EmptyState";
import { track } from "@/lib/analytics";
import { Map, Zap, FileText } from "lucide-react";

const cadenceSteps = [
  { label: "Plan", active: true },
  { label: "Build", active: false },
  { label: "Ship", active: false },
  { label: "Review", active: false },
];

const promptPacks = [
  "MVP Blueprint Prompt",
  "Architecture Prompt",
  "Landing Page Prompt",
];

export default function Dashboard() {
  useEffect(() => { track("dashboard_viewed"); }, []);

  return (
    <AuthGate>
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-24 pb-20">
          <div className="container max-w-5xl">
            {/* Command Bar */}
            <div className="flex flex-wrap items-center gap-3 mb-10">
              <StatusPill label="Active" variant="active" />
              <StatusPill label="Week 01" />
              <Button size="sm" disabled className="ml-auto tracking-wide opacity-50">
                Start Weekly Sprint
              </Button>
            </div>

            {/* Main Grid */}
            <div className="grid md:grid-cols-3 gap-6 mb-12">
              <Card className="bg-card border-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Map className="h-4 w-4 text-primary" /> This Week's System
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">Your System Map appears here.</p>
                  <Button size="sm" variant="outline" disabled className="opacity-50 border-border">
                    Generate System Map
                  </Button>
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
                      <Button size="sm" variant="ghost" className="text-xs text-primary h-auto py-1 px-2" disabled>
                        Open
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
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
