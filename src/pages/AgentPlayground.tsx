import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Play, Loader2, Copy, CheckCheck, Bot, Search, FileText,
  MessageSquare, Package, ScanLine, Mail, Eye, Zap,
  Code, Image, LayoutGrid, Globe, Presentation, PenTool,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const ICON_MAP: Record<string, React.ElementType> = {
  Search, FileText, MessageSquare, Package, ScanLine, Mail, Eye, Zap, Bot,
  Code, Image, LayoutGrid, Globe, Presentation, PenTool,
};

const CATEGORY_COLORS: Record<string, string> = {
  content: "border-purple-500/40 text-purple-400",
  Content: "border-purple-500/40 text-purple-400",
  research: "border-blue-500/40 text-blue-400",
  Research: "border-blue-500/40 text-blue-400",
  outreach: "border-emerald-500/40 text-emerald-400",
  Outreach: "border-emerald-500/40 text-emerald-400",
  marketing: "border-amber-500/40 text-amber-400",
  creative: "border-pink-500/40 text-pink-400",
  automation: "border-cyan-500/40 text-cyan-400",
  productivity: "border-indigo-500/40 text-indigo-400",
  analysis: "border-orange-500/40 text-orange-400",
  Bundle: "border-amber-500/40 text-amber-400",
};

// Input form config per agent slug
const AGENT_INPUTS: Record<string, { label: string; key: string; type: "text" | "textarea" | "select"; placeholder?: string; options?: string[] }[]> = {
  "site-audit": [{ label: "Website URL", key: "url", type: "text", placeholder: "https://example.com" }],
  "lead-prospector": [
    { label: "City / Market", key: "city", type: "text", placeholder: "Atlanta, GA" },
    { label: "Business Category", key: "category", type: "text", placeholder: "Dental practices" },
  ],
  "website-proposal": [
    { label: "Business Name", key: "business_name", type: "text", placeholder: "Atlanta Smiles Dental" },
    { label: "Website URL", key: "url", type: "text", placeholder: "https://atlantasmiles.com" },
  ],
  "social-media": [
    { label: "Topic", key: "topic", type: "textarea", placeholder: "Built a SaaS billing dashboard..." },
    { label: "Platform", key: "platform", type: "select", options: ["All platforms", "Twitter/X", "LinkedIn", "Instagram"] },
  ],
  "deep-researcher": [
    { label: "Research Topic", key: "topic", type: "textarea", placeholder: "Market analysis for AI scheduling tools..." },
    { label: "Depth", key: "depth", type: "select", options: ["Quick scan", "Standard", "Deep dive"] },
  ],
  "content-writer": [
    { label: "What to Write", key: "topic", type: "textarea", placeholder: "Blog post about AI for small business..." },
    { label: "Format", key: "format", type: "select", options: ["Blog post", "Landing page copy", "Email sequence", "Social media posts"] },
    { label: "Tone", key: "tone", type: "select", options: ["Professional", "Casual", "Persuasive", "Educational"] },
  ],
  "website-auditor": [
    { label: "Website URL", key: "url", type: "text", placeholder: "https://example.com" },
    { label: "Focus Area", key: "focus", type: "select", options: ["Full audit", "SEO only", "UX/Design", "Performance"] },
  ],
  "slide-generator": [
    { label: "Presentation Topic", key: "topic", type: "textarea", placeholder: "Sales pitch deck..." },
    { label: "Slide Count", key: "slide_count", type: "select", options: ["5", "10", "15", "20"] },
    { label: "Style", key: "style", type: "select", options: ["Corporate", "Startup", "Creative", "Minimal"] },
  ],
  "code-interpreter": [
    { label: "Task Description", key: "task", type: "textarea", placeholder: "Write a Python script that..." },
    { label: "Language", key: "language", type: "select", options: ["Python", "JavaScript", "TypeScript", "SQL", "Bash"] },
    { label: "Context (optional)", key: "context", type: "textarea", placeholder: "Any additional context..." },
  ],
  "carousel-generator": [
    { label: "Product / Service", key: "product", type: "text", placeholder: "AI website builder for dentists" },
    { label: "Slide Count", key: "slideCount", type: "select", options: ["3", "5", "7", "10"] },
    { label: "Platform", key: "platform", type: "select", options: ["Facebook", "Instagram", "LinkedIn", "All"] },
    { label: "Offer / CTA", key: "offer", type: "text", placeholder: "Free website audit + 30-day trial" },
    { label: "Target Audience", key: "targetAudience", type: "text", placeholder: "Dental practice owners aged 35-55" },
  ],
  "browser-operator": [
    { label: "Instruction", key: "instruction", type: "textarea", placeholder: "Extract pricing and features from competitor websites..." },
    { label: "URLs (comma-separated)", key: "urls", type: "textarea", placeholder: "https://competitor1.com, https://competitor2.com" },
    { label: "Max Pages", key: "maxPages", type: "select", options: ["3", "5", "10", "20"] },
  ],
  "image-generator": [
    { label: "Image Prompt", key: "prompt", type: "textarea", placeholder: "Modern dental office hero image..." },
    { label: "Style", key: "style", type: "select", options: ["Photorealistic", "Illustration", "Flat design", "3D render"] },
    { label: "Dimensions", key: "dimensions", type: "select", options: ["1080x1080 (Square)", "1200x628 (Facebook)", "1080x1920 (Story)", "1920x1080 (Banner)"] },
    { label: "Count", key: "count", type: "select", options: ["1", "2", "3", "4"] },
  ],
  "cold-email-outreach": [
    { label: "Business Name", key: "business_name", type: "text", placeholder: "Atlanta Smiles Dental" },
    { label: "Website URL", key: "url", type: "text", placeholder: "https://atlantasmiles.com" },
    { label: "Pain Points", key: "pain_points", type: "textarea", placeholder: "No mobile version, missing contact form..." },
    { label: "Niche", key: "niche", type: "select", options: ["Dental", "Restaurant", "Real Estate", "Law Firm", "Fitness", "Other"] },
  ],
  "sms-outreach": [
    { label: "Lead Name", key: "lead_name", type: "text", placeholder: "Dr. Chen" },
    { label: "Phone Number", key: "phone", type: "text", placeholder: "+14045551234" },
    { label: "Pitch Context", key: "pitch_context", type: "textarea", placeholder: "Dental practice in Atlanta..." },
  ],
  "cold-call": [
    { label: "Lead Name", key: "lead_name", type: "text", placeholder: "Dr. Chen" },
    { label: "Phone Number", key: "phone", type: "text", placeholder: "+14045551234" },
    { label: "Pitch Context", key: "pitch_context", type: "textarea", placeholder: "Dental practice in Atlanta..." },
  ],
  "email-drip": [
    { label: "Lead Name", key: "lead_name", type: "text", placeholder: "Dr. Chen" },
    { label: "Lead Email", key: "lead_email", type: "text", placeholder: "drchen@example.com" },
    { label: "Business Name", key: "business_name", type: "text", placeholder: "Atlanta Smiles Dental" },
    { label: "Website URL", key: "url", type: "text", placeholder: "https://atlantasmiles.com" },
  ],
  "video-content": [
    { label: "Topic", key: "topic", type: "textarea", placeholder: "Built a SaaS dashboard with Stripe billing..." },
    { label: "Platform", key: "platform", type: "select", options: ["YouTube", "TikTok", "Instagram Reels", "All"] },
    { label: "Tone", key: "tone", type: "select", options: ["Educational", "Hype / Energy", "Professional", "Behind-the-scenes"] },
  ],
  "media-buyer": [
    { label: "Campaign Name", key: "campaign_name", type: "text", placeholder: "Q1 Lead Gen Campaign" },
    { label: "Daily Budget ($)", key: "daily_budget", type: "text", placeholder: "50" },
    { label: "Target Audience", key: "target_audience", type: "textarea", placeholder: "Dental practice owners aged 35-55 in Florida..." },
  ],
};

interface Agent {
  id: string;
  name: string;
  slug: string;
  headline: string;
  category: string;
  icon_name: string;
  status: string;
  included_with_membership: boolean;
}

interface AgentLease {
  id: string;
  agent_id: string;
  status: string;
}

export default function AgentPlayground() {
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [leases, setLeases] = useState<AgentLease[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (!loading && !user) navigate("/login", { replace: true });
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase.from("agents").select("id, name, slug, headline, category, icon_name, status, included_with_membership").eq("status", "active").order("name"),
      supabase.from("agent_leases").select("id, agent_id, status").eq("user_id", user.id).eq("status", "active"),
    ]).then(([agentsRes, leasesRes]) => {
      if (agentsRes.data) {
        // Filter out bundles, keep individual agents
        const individual = (agentsRes.data as Agent[]).filter(a => a.category.toLowerCase() !== "bundle");
        setAgents(individual);
        if (individual.length > 0 && !selectedAgent) setSelectedAgent(individual[0]);
      }
      if (leasesRes.data) setLeases(leasesRes.data as AgentLease[]);
    });
  }, [user]);

  const filteredAgents = agents.filter(a =>
    a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const leaseForAgent = (agentId: string) => leases.find(l => l.agent_id === agentId);

  const handleSelectAgent = (agent: Agent) => {
    setSelectedAgent(agent);
    setFormValues({});
    setResult(null);
  };

  const handleRun = async () => {
    if (!selectedAgent || !user) return;
    const lease = leaseForAgent(selectedAgent.id);
    if (!lease && !selectedAgent.included_with_membership) {
      toast({ title: "Agent not leased", description: "Go to the Agents page to lease this agent first.", variant: "destructive" });
      return;
    }
    setRunning(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("run-agent", {
        body: { agent_id: selectedAgent.id, lease_id: lease?.id || "membership", input: formValues },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setResult(data.result);
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

  if (loading || !user) return null;

  const inputConfigs = selectedAgent ? (AGENT_INPUTS[selectedAgent.slug] || []) : [];
  const Icon = selectedAgent ? (ICON_MAP[selectedAgent.icon_name] || Bot) : Bot;
  const catColor = selectedAgent ? (CATEGORY_COLORS[selectedAgent.category] || "border-border text-muted-foreground") : "";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-20 pb-20">
        <div className="container max-w-7xl">
          {/* Header */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Agent Playground</h1>
            <p className="text-sm text-muted-foreground mt-1">Try any agent individually. Fill in the form and see results in real-time.</p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Agent Selector - Left Panel */}
            <div className="lg:col-span-3">
              <Card className="bg-card border-border sticky top-24">
                <CardContent className="p-3">
                  <div className="mb-3">
                    <Input
                      placeholder="Search agents..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                  <ScrollArea className="h-[60vh] lg:h-[65vh]">
                    <div className="space-y-1 pr-2">
                      {filteredAgents.map((agent) => {
                        const isSelected = selectedAgent?.id === agent.id;
                        const hasLease = !!leaseForAgent(agent.id) || agent.included_with_membership;
                        const AgentIcon = ICON_MAP[agent.icon_name] || Bot;
                        return (
                          <button
                            key={agent.id}
                            onClick={() => handleSelectAgent(agent)}
                            className={`w-full text-left px-3 py-2.5 rounded-lg transition-all text-xs group ${
                              isSelected
                                ? "bg-primary/10 border border-primary/30"
                                : "hover:bg-muted/50 border border-transparent"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <AgentIcon className={`h-3.5 w-3.5 shrink-0 ${isSelected ? "text-primary" : "text-muted-foreground group-hover:text-foreground"}`} />
                              <span className={`font-medium truncate ${isSelected ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"}`}>
                                {agent.name}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 mt-1 ml-5">
                              <Badge variant="outline" className={`text-[9px] py-0 h-4 ${CATEGORY_COLORS[agent.category] || ""}`}>
                                {agent.category}
                              </Badge>
                              {!hasLease && (
                                <Badge variant="outline" className="text-[9px] py-0 h-4 text-yellow-500 border-yellow-500/30">
                                  Not leased
                                </Badge>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>

            {/* Main Panel */}
            <div className="lg:col-span-9">
              <AnimatePresence mode="wait">
                {selectedAgent && (
                  <motion.div
                    key={selectedAgent.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card className="bg-card border-border">
                      <CardContent className="p-6 md:p-8">
                        {/* Agent Header */}
                        <div className="flex items-start gap-3 mb-6">
                          <div className={`p-2.5 rounded-xl border ${catColor}`}>
                            <Icon className="h-5 w-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h2 className="text-lg font-bold text-foreground">{selectedAgent.name}</h2>
                            <p className="text-xs text-muted-foreground mt-0.5">{selectedAgent.headline}</p>
                          </div>
                          <Badge variant="outline" className={`shrink-0 text-[10px] ${catColor}`}>
                            {selectedAgent.category}
                          </Badge>
                        </div>

                        {/* Input Form */}
                        {!result ? (
                          <div className="space-y-4">
                            {inputConfigs.length === 0 ? (
                              <div className="bg-muted/30 rounded-lg p-6 text-center text-sm text-muted-foreground">
                                This agent runs automatically — no inputs required.
                              </div>
                            ) : (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {inputConfigs.map((config) => (
                                  <div key={config.key} className={`space-y-1.5 ${config.type === "textarea" ? "md:col-span-2" : ""}`}>
                                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{config.label}</Label>
                                    {config.type === "textarea" ? (
                                      <Textarea
                                        placeholder={config.placeholder}
                                        value={formValues[config.key] || ""}
                                        onChange={(e) => setFormValues(p => ({ ...p, [config.key]: e.target.value }))}
                                        className="text-sm min-h-[80px] bg-background"
                                      />
                                    ) : config.type === "select" ? (
                                      <Select
                                        value={formValues[config.key] || ""}
                                        onValueChange={(v) => setFormValues(p => ({ ...p, [config.key]: v }))}
                                      >
                                        <SelectTrigger className="text-sm h-9 bg-background">
                                          <SelectValue placeholder={`Select ${config.label}`} />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {config.options?.map((opt) => (
                                            <SelectItem key={opt} value={opt} className="text-sm">{opt}</SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    ) : (
                                      <Input
                                        placeholder={config.placeholder}
                                        value={formValues[config.key] || ""}
                                        onChange={(e) => setFormValues(p => ({ ...p, [config.key]: e.target.value }))}
                                        className="text-sm h-9 bg-background"
                                      />
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}

                            <Button onClick={handleRun} disabled={running} className="w-full" size="lg">
                              {running ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Running {selectedAgent.name}...
                                </>
                              ) : (
                                <>
                                  <Play className="h-4 w-4 mr-2" />
                                  Run {selectedAgent.name}
                                </>
                              )}
                            </Button>
                          </div>
                        ) : (
                          /* Result View */
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 text-emerald-400">
                                <Zap className="h-4 w-4" />
                                <span className="text-sm font-semibold">Agent completed</span>
                              </div>
                              <div className="flex gap-2">
                                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={handleCopy}>
                                  {copied ? <CheckCheck className="h-3 w-3 mr-1 text-emerald-400" /> : <Copy className="h-3 w-3 mr-1" />}
                                  {copied ? "Copied!" : "Copy"}
                                </Button>
                                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => { setResult(null); setFormValues({}); }}>
                                  Run Again
                                </Button>
                              </div>
                            </div>

                            <div className="bg-muted/30 rounded-lg border border-border p-4 max-h-[60vh] overflow-y-auto">
                              <pre className="text-xs text-foreground whitespace-pre-wrap font-mono leading-relaxed">{result}</pre>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
