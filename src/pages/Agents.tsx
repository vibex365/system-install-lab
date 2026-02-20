import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { AuthGate } from "@/components/AuthGate";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Share2, Search, FileText, MessageSquare, Package, ScanLine,
  CalendarDays, Mail, Eye, UserCheck, ChevronDown, ChevronUp,
  Play, Zap, CheckCircle2, Clock, Loader2, History, Copy, CheckCheck,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const ICON_MAP: Record<string, React.ElementType> = {
  Share2, Search, FileText, MessageSquare, Package, ScanLine,
  CalendarDays, Mail, Eye, UserCheck,
};

const CATEGORY_COLORS: Record<string, string> = {
  Content: "bg-primary/20 text-primary border-primary/30",
  Research: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  Outreach: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
};

// Input form config per agent slug
const AGENT_INPUTS: Record<string, { label: string; key: string; type: "text" | "textarea" | "select"; placeholder?: string; options?: string[] }[]> = {
  "site-audit": [{ label: "Your Live App URL", key: "url", type: "text", placeholder: "https://your-app.lovable.app" }],
  "lead-prospector": [
    { label: "City / Market", key: "city", type: "text", placeholder: "Atlanta, GA" },
    { label: "Business Category", key: "category", type: "text", placeholder: "Dental practices" },
  ],
  "website-proposal": [
    { label: "Business Name", key: "business_name", type: "text", placeholder: "Atlanta Smiles Dental" },
    { label: "Their Website URL", key: "url", type: "text", placeholder: "https://atlantasmiles.com" },
  ],
  "social-media": [
    { label: "What did you build?", key: "topic", type: "textarea", placeholder: "Built a SaaS billing dashboard with Stripe integration..." },
    { label: "Platform", key: "platform", type: "select", options: ["All platforms", "Twitter/X", "LinkedIn", "Instagram"] },
  ],
  "competitor-intel": [{ label: "Competitor URL", key: "url", type: "text", placeholder: "https://competitor.com" }],
  "prompt-packager": [{ label: "Your Raw Prompt", key: "raw_prompt", type: "textarea", placeholder: "Build a dashboard that shows..." }],
  "weekly-recap": [{ label: "What did you work on this week?", key: "builds", type: "textarea", placeholder: "Built a lead capture form, prototyped a booking system..." }],
  "sms-followup": [
    { label: "Applicant Name", key: "applicant_name", type: "text", placeholder: "John Martinez" },
    { label: "Status", key: "status", type: "select", options: ["accepted", "waitlisted", "rejected"] },
    { label: "Additional context (optional)", key: "custom_message", type: "textarea", placeholder: "Any special notes..." },
  ],
  "onboarding": [
    { label: "Member Name", key: "member_name", type: "text", placeholder: "Sarah Chen" },
    { label: "Their product / idea", key: "product_idea", type: "textarea", placeholder: "SaaS tool for dental practice management..." },
  ],
  "email-drip": [
    { label: "Lead Name", key: "lead_name", type: "text", placeholder: "Dr. Chen" },
    { label: "Business Name", key: "business_name", type: "text", placeholder: "Atlanta Smiles Dental" },
  ],
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
  id: string;
  agent_id: string;
  lease_id: string;
  triggered_at: string;
  status: string;
  result_summary: string | null;
  input_payload: Record<string, string> | null;
}

function RunAgentModal({
  agent,
  lease,
  open,
  onClose,
  onRunComplete,
}: {
  agent: Agent;
  lease: AgentLease;
  open: boolean;
  onClose: () => void;
  onRunComplete: () => void;
}) {
  const { toast } = useToast();
  const inputConfigs = AGENT_INPUTS[agent.slug] || [];
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleReset = () => {
    setResult(null);
    setFormValues({});
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handleRun = async () => {
    setRunning(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("run-agent", {
        body: { agent_id: agent.id, lease_id: lease.id, input: formValues },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setResult(data.result);
      onRunComplete();
    } catch (e: any) {
      toast({ title: "Agent error", description: e.message, variant: "destructive" });
    } finally {
      setRunning(false);
    }
  };

  const handleCopy = () => {
    if (result) {
      navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm font-semibold">
            <div className={`p-1.5 rounded-md border ${CATEGORY_COLORS[agent.category] || ""}`}>
              {(() => { const Icon = ICON_MAP[agent.icon_name] || Package; return <Icon className="h-4 w-4" />; })()}
            </div>
            Run {agent.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {!result ? (
            <>
              <p className="text-xs text-muted-foreground">{agent.headline}</p>

              {inputConfigs.length === 0 ? (
                <div className="bg-muted/30 rounded-md p-4 text-xs text-muted-foreground">
                  This agent runs automatically — no inputs required. Click Run to start.
                </div>
              ) : (
                <div className="space-y-3">
                  {inputConfigs.map((config) => (
                    <div key={config.key} className="space-y-1.5">
                      <Label className="text-xs">{config.label}</Label>
                      {config.type === "textarea" ? (
                        <Textarea
                          placeholder={config.placeholder}
                          value={formValues[config.key] || ""}
                          onChange={(e) => setFormValues((p) => ({ ...p, [config.key]: e.target.value }))}
                          className="text-xs min-h-[80px]"
                        />
                      ) : config.type === "select" ? (
                        <Select
                          value={formValues[config.key] || ""}
                          onValueChange={(v) => setFormValues((p) => ({ ...p, [config.key]: v }))}
                        >
                          <SelectTrigger className="text-xs h-8">
                            <SelectValue placeholder={`Select ${config.label}`} />
                          </SelectTrigger>
                          <SelectContent>
                            {config.options?.map((opt) => (
                              <SelectItem key={opt} value={opt} className="text-xs">{opt}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          placeholder={config.placeholder}
                          value={formValues[config.key] || ""}
                          onChange={(e) => setFormValues((p) => ({ ...p, [config.key]: e.target.value }))}
                          className="text-xs h-8"
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}

              <Button onClick={handleRun} disabled={running} className="w-full">
                {running ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Agent Running...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Run {agent.name}
                  </>
                )}
              </Button>
            </>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  <span className="text-xs font-semibold text-foreground">Agent completed</span>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="h-7 text-xs" onClick={handleCopy}>
                    {copied ? <CheckCheck className="h-3 w-3 mr-1 text-emerald-400" /> : <Copy className="h-3 w-3 mr-1" />}
                    {copied ? "Copied!" : "Copy"}
                  </Button>
                  <Button size="sm" variant="outline" className="h-7 text-xs" onClick={handleReset}>
                    Run Again
                  </Button>
                </div>
              </div>
              <div className="bg-muted/50 border border-border rounded-md p-4 max-h-[400px] overflow-y-auto">
                <pre className="text-xs text-foreground whitespace-pre-wrap leading-relaxed font-mono">
                  {result}
                </pre>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
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
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1.5">What This Agent Does</p>
          <p className="text-xs text-muted-foreground leading-relaxed">{agent.what_it_does}</p>
        </div>

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

        {isActive && lastRun && (
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <Clock className="h-3 w-3" />
            Last run: {new Date(lastRun.triggered_at).toLocaleDateString()}
          </div>
        )}

        <div className="mt-auto pt-2">
          {isActive ? (
            <Button size="sm" className="w-full" onClick={() => onRun(agent)}>
              <Play className="h-3.5 w-3.5 mr-1.5" /> Run Agent
            </Button>
          ) : canLease ? (
            <Button size="sm" className="w-full" onClick={() => onLease(agent)} disabled={leasing}>
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

const STATUS_COLORS: Record<string, string> = {
  completed: "text-emerald-400 border-emerald-500/30",
  running: "text-blue-400 border-blue-500/30",
  queued: "text-primary border-primary/30",
  failed: "text-destructive border-destructive/30",
};

function RunHistory({ runs, agents }: { runs: AgentRun[]; agents: Agent[] }) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  if (runs.length === 0) return null;

  return (
    <div className="mt-12">
      <div className="flex items-center gap-2 mb-4">
        <History className="h-4 w-4 text-muted-foreground" />
        <p className="text-xs tracking-[0.15em] text-muted-foreground uppercase font-semibold">Run History</p>
      </div>
      <Card className="bg-card border-border">
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {runs.map((run) => {
              const agent = agents.find((a) => a.id === run.agent_id);
              const isExpanded = expanded === run.id;
              const Icon = agent ? (ICON_MAP[agent.icon_name] || Package) : Package;
              return (
                <div key={run.id} className="p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {agent && (
                        <div className={`p-1.5 rounded-md border shrink-0 ${CATEGORY_COLORS[agent.category] || ""}`}>
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-foreground">{agent?.name || "Unknown Agent"}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {new Date(run.triggered_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge
                        variant="outline"
                        className={`text-[10px] capitalize ${STATUS_COLORS[run.status] || "text-muted-foreground"}`}
                      >
                        {run.status}
                      </Badge>
                      {run.result_summary && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 text-[10px] px-2"
                          onClick={() => setExpanded(isExpanded ? null : run.id)}
                        >
                          {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                          {isExpanded ? "Hide" : "View"}
                        </Button>
                      )}
                    </div>
                  </div>

                  {isExpanded && run.result_summary && (
                    <div className="mt-3 space-y-2">
                      {run.input_payload && Object.keys(run.input_payload).length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(run.input_payload).map(([k, v]) => (
                            <span key={k} className="text-[10px] bg-muted/50 border border-border rounded px-2 py-0.5 text-muted-foreground">
                              {k}: {String(v).slice(0, 40)}{String(v).length > 40 ? "..." : ""}
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="relative">
                        <div className="bg-muted/50 border border-border rounded-md p-3 max-h-60 overflow-y-auto">
                          <pre className="text-[11px] text-foreground whitespace-pre-wrap font-mono leading-relaxed">
                            {run.result_summary}
                          </pre>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="absolute top-2 right-2 h-6 text-[10px] px-2"
                          onClick={() => handleCopy(run.id, run.result_summary!)}
                        >
                          {copied === run.id ? <CheckCheck className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
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
  const [runModalAgent, setRunModalAgent] = useState<Agent | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [agentsRes, leasesRes, runsRes] = await Promise.all([
        supabase.from("agents").select("*").order("price_cents"),
        user ? supabase.from("agent_leases").select("*").eq("user_id", user.id) : Promise.resolve({ data: [], error: null }),
        user
          ? supabase.from("agent_runs").select("*").eq("user_id", user.id).order("triggered_at", { ascending: false }).limit(50)
          : Promise.resolve({ data: [], error: null }),
      ]);
      if (agentsRes.data) setAgents(agentsRes.data as Agent[]);
      if (leasesRes.data) setLeases(leasesRes.data as AgentLease[]);
      if (runsRes.data) setRuns(runsRes.data as AgentRun[]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
    const leaseSuccess = searchParams.get("lease_success");
    const agentId = searchParams.get("agent_id");
    if (leaseSuccess === "true" && agentId) verifyLease(agentId);
  }, []);

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

  const categories = ["All", ...Array.from(new Set(agents.map((a) => a.category)))];
  const filtered = selectedCategory === "All" ? agents : agents.filter((a) => a.category === selectedCategory);
  const activeLeases = leases.filter((l) => l.status === "active");

  const getLastRun = (agentId: string) => runs.find((r) => r.agent_id === agentId) || null;
  const getLease = (agentId: string) => leases.find((l) => l.agent_id === agentId) || null;
  const getActiveLease = (agentId: string) => leases.find((l) => l.agent_id === agentId && l.status === "active") || null;

  const runModalLease = runModalAgent ? getActiveLease(runModalAgent.id) : null;

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
                    <Button size="sm" className="h-7 text-xs" onClick={() => setRunModalAgent(agent)}>
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
                onRun={(a) => setRunModalAgent(a)}
                leasing={leasingId === agent.id}
              />
            ))}
          </div>
        )}

        {/* Run History */}
        <RunHistory runs={runs} agents={agents} />
      </div>

      {/* Run Agent Modal */}
      {runModalAgent && runModalLease && (
        <RunAgentModal
          agent={runModalAgent}
          lease={runModalLease}
          open={!!runModalAgent}
          onClose={() => setRunModalAgent(null)}
          onRunComplete={fetchData}
        />
      )}
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
