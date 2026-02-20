import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { AuthGate } from "@/components/AuthGate";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Share2, Search, FileText, MessageSquare, Package, ScanLine,
  CalendarDays, Mail, Eye, UserCheck, ChevronDown, ChevronUp,
  Play, Zap, CheckCircle2, Clock, Loader2
} from "lucide-react";
import { Navbar } from "@/components/Navbar";

const ICON_MAP: Record<string, React.ElementType> = {
  Share2, Search, FileText, MessageSquare, Package, ScanLine,
  CalendarDays, Mail, Eye, UserCheck,
};

const CATEGORY_COLORS: Record<string, string> = {
  Content: "bg-primary/20 text-primary border-primary/30",
  Research: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  Outreach: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
};

interface Agent {
  id: string;
  name: string;
  slug: string;
  headline: string;
  description: string;
  what_it_does: string;
  use_cases: string[];
  example_output: string | null;
  job_type: string;
  category: string;
  icon_name: string;
  price_cents: number;
  stripe_price_id: string | null;
  status: string;
}

interface AgentLease {
  id: string;
  agent_id: string;
  status: string;
  leased_at: string;
}

interface AgentRun {
  agent_id: string;
  triggered_at: string;
}

function AgentCard({
  agent,
  lease,
  lastRun,
  onLease,
  onRun,
  leasing,
}: {
  agent: Agent;
  lease: AgentLease | null;
  lastRun: AgentRun | null;
  onLease: (agent: Agent) => void;
  onRun: (agent: Agent) => void;
  leasing: boolean;
}) {
  const [exampleOpen, setExampleOpen] = useState(false);
  const IconComponent = ICON_MAP[agent.icon_name] || Package;
  const isActive = lease?.status === "active";
  const hasStripePrice = !!agent.stripe_price_id;
  const canLease = agent.status === "active" && hasStripePrice;
  const price = (agent.price_cents / 100).toFixed(0);

  return (
    <Card className="bg-card border-border flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg border ${CATEGORY_COLORS[agent.category] || "bg-muted text-muted-foreground border-border"}`}>
              <IconComponent className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-semibold text-foreground">{agent.name}</h3>
                <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-4 border ${CATEGORY_COLORS[agent.category] || ""}`}>
                  {agent.category}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{agent.headline}</p>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1 shrink-0">
            {isActive ? (
              <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px]">
                <CheckCircle2 className="h-3 w-3 mr-1" /> Active
              </Badge>
            ) : agent.status === "coming_soon" || !hasStripePrice ? (
              <Badge variant="outline" className="text-[10px] text-muted-foreground">Coming Soon</Badge>
            ) : null}
            <span className="text-xs font-bold text-primary">${price}/mo</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col gap-4 pt-0">
        {/* What it does */}
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1.5">What This Agent Does</p>
          <p className="text-xs text-muted-foreground leading-relaxed">{agent.what_it_does}</p>
        </div>

        {/* Use cases */}
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1.5">Use Cases</p>
          <ul className="space-y-1.5">
            {agent.use_cases.map((uc, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                <Zap className="h-3 w-3 text-primary shrink-0 mt-0.5" />
                <span>{uc}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Example output */}
        {agent.example_output && (
          <Collapsible open={exampleOpen} onOpenChange={setExampleOpen}>
            <CollapsibleTrigger className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors font-semibold">
              Example Output
              {exampleOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2">
              <div className="rounded-md bg-muted/50 border border-border p-3">
                <pre className="text-[11px] text-muted-foreground whitespace-pre-wrap font-mono leading-relaxed">
                  {agent.example_output}
                </pre>
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Last run */}
        {isActive && lastRun && (
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <Clock className="h-3 w-3" />
            Last run: {new Date(lastRun.triggered_at).toLocaleDateString()}
          </div>
        )}

        {/* CTA */}
        <div className="mt-auto pt-2">
          {isActive ? (
            <Button size="sm" className="w-full" onClick={() => onRun(agent)}>
              <Play className="h-3.5 w-3.5 mr-1.5" /> Run Agent
            </Button>
          ) : canLease ? (
            <Button
              size="sm"
              className="w-full"
              onClick={() => onLease(agent)}
              disabled={leasing}
            >
              {leasing ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : null}
              Lease Agent — ${price}/mo
            </Button>
          ) : (
            <Button size="sm" className="w-full" variant="outline" disabled>
              Coming Soon
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function AgentsContent() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [leases, setLeases] = useState<AgentLease[]>([]);
  const [runs, setRuns] = useState<AgentRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [leasingId, setLeasingId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  useEffect(() => {
    fetchData();
    // Handle return from Stripe
    const leaseSuccess = searchParams.get("lease_success");
    const agentId = searchParams.get("agent_id");
    if (leaseSuccess === "true" && agentId) {
      verifyLease(agentId);
    }
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [agentsRes, leasesRes, runsRes] = await Promise.all([
        supabase.from("agents").select("*").order("price_cents"),
        user ? supabase.from("agent_leases").select("*").eq("user_id", user.id) : Promise.resolve({ data: [], error: null }),
        user ? supabase.from("agent_runs").select("agent_id, triggered_at").eq("user_id", user.id).order("triggered_at", { ascending: false }) : Promise.resolve({ data: [], error: null }),
      ]);
      if (agentsRes.data) setAgents(agentsRes.data as Agent[]);
      if (leasesRes.data) setLeases(leasesRes.data as AgentLease[]);
      if (runsRes.data) setRuns(runsRes.data as AgentRun[]);
    } finally {
      setLoading(false);
    }
  };

  const verifyLease = async (agentId: string) => {
    const sessionId = searchParams.get("session_id");
    if (!sessionId) return;
    try {
      const { data, error } = await supabase.functions.invoke("verify-agent-lease", {
        body: { session_id: sessionId, agent_id: agentId },
      });
      if (error) throw error;
      toast({ title: "Agent leased!", description: "Your agent is now active and ready to run." });
      fetchData();
    } catch (e: any) {
      toast({ title: "Verification error", description: e.message, variant: "destructive" });
    }
  };

  const handleLease = async (agent: Agent) => {
    setLeasingId(agent.id);
    try {
      const { data, error } = await supabase.functions.invoke("create-agent-lease", {
        body: { agent_id: agent.id },
      });
      if (error) throw error;
      if (data?.url) window.location.href = data.url;
    } catch (e: any) {
      toast({ title: "Checkout error", description: e.message, variant: "destructive" });
    } finally {
      setLeasingId(null);
    }
  };

  const handleRun = (agent: Agent) => {
    toast({
      title: `${agent.name} queued`,
      description: "Your agent is running. Results will appear shortly.",
    });
  };

  const categories = ["All", ...Array.from(new Set(agents.map((a) => a.category)))];
  const filtered = selectedCategory === "All" ? agents : agents.filter((a) => a.category === selectedCategory);
  const activeLeases = leases.filter((l) => l.status === "active");

  const getLastRun = (agentId: string) => runs.find((r) => r.agent_id === agentId) || null;
  const getLease = (agentId: string) => leases.find((l) => l.agent_id === agentId) || null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16 px-4 container max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <p className="text-xs tracking-[0.2em] text-primary uppercase font-semibold mb-2">OpenClaw</p>
          <h1 className="text-3xl font-bold text-foreground mb-3">Agent Marketplace</h1>
          <p className="text-muted-foreground max-w-2xl text-sm">
            Lease a specialized AI agent that works on your behalf. Each agent runs a dedicated pipeline — outreach, research, content, audits — so you can focus on building.
          </p>
        </div>

        {/* My Active Agents strip */}
        {activeLeases.length > 0 && (
          <div className="mb-10">
            <p className="text-xs tracking-[0.15em] text-muted-foreground uppercase font-semibold mb-3">My Active Agents</p>
            <div className="flex gap-3 flex-wrap">
              {activeLeases.map((lease) => {
                const agent = agents.find((a) => a.id === lease.agent_id);
                if (!agent) return null;
                const Icon = ICON_MAP[agent.icon_name] || Package;
                const lastRun = getLastRun(agent.id);
                return (
                  <div key={lease.id} className="flex items-center gap-3 bg-card border border-primary/30 rounded-lg px-4 py-3">
                    <div className={`p-1.5 rounded-md border ${CATEGORY_COLORS[agent.category] || ""}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-foreground">{agent.name}</p>
                      {lastRun ? (
                        <p className="text-[10px] text-muted-foreground">Last run {new Date(lastRun.triggered_at).toLocaleDateString()}</p>
                      ) : (
                        <p className="text-[10px] text-muted-foreground">Never run</p>
                      )}
                    </div>
                    <Button size="sm" className="h-7 text-xs" onClick={() => handleRun(agent)}>
                      <Play className="h-3 w-3 mr-1" /> Run
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Category filter */}
        <div className="flex gap-2 flex-wrap mb-6">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors border ${
                selectedCategory === cat
                  ? "bg-primary/20 text-primary border-primary/40"
                  : "bg-transparent text-muted-foreground border-border hover:text-foreground hover:border-muted"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Agent catalog */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filtered.map((agent) => (
              <AgentCard
                key={agent.id}
                agent={agent}
                lease={getLease(agent.id)}
                lastRun={getLastRun(agent.id)}
                onLease={handleLease}
                onRun={handleRun}
                leasing={leasingId === agent.id}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function Agents() {
  return (
    <AuthGate>
      <AgentsContent />
    </AuthGate>
  );
}
