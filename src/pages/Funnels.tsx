import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Plus, Target, Trash2,
  FileText, Users, Zap, Mail, MessageSquare, PhoneCall, CalendarCheck,
  Activity, CheckCircle2, XCircle, Clock,
  History, RefreshCw, Eye, ChevronUp, Send, ExternalLink,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { format } from "date-fns";

interface QuizQuestion {
  id: string;
  question: string;
  type: "single" | "multi";
  options: string[];
}

interface FunnelData {
  id: string;
  title: string;
  slug: string;
  status: string;
  quiz_config: { questions?: QuizQuestion[] };
  brand_config: { niche?: string; headline?: string; description?: string };
  submissions_count: number;
  created_at: string;
}

interface AgentRunSummary {
  agent_slug: string;
  agent_name: string;
  total_runs: number;
  last_run_at: string | null;
  last_status: string | null;
  successes: number;
  failures: number;
}

interface UsageData {
  sms_used: number;
  voice_calls_used: number;
  campaigns_used: number;
  leads_used: number;
}

interface OutreachLogEntry {
  id: string;
  company_name: string | null;
  recipient_email: string | null;
  recipient_phone: string | null;
  email_subject: string | null;
  email_body: string | null;
  sms_body: string | null;
  channel: string;
  delivery_status: string;
  grade: string | null;
  source_url: string | null;
  niche: string | null;
  phone_found: string | null;
  open_count: number | null;
  click_count: number | null;
  opened_at: string | null;
  clicked_at: string | null;
  created_at: string;
}

interface AgentToggles {
  sms_followup: boolean;
  email_followup: boolean;
  voice_call: boolean;
  booking_agent: boolean;
}

const defaultQuestions: QuizQuestion[] = [
  { id: "q1", question: "What's your biggest challenge right now?", type: "single", options: ["Getting leads", "Closing sales", "Time management", "Building a team"] },
  { id: "q2", question: "How much time do you spend on prospecting per week?", type: "single", options: ["Less than 2 hours", "2-5 hours", "5-10 hours", "10+ hours"] },
  { id: "q3", question: "What's your monthly revenue goal?", type: "single", options: ["$1K-$3K", "$3K-$10K", "$10K-$25K", "$25K+"] },
];

const niches = [
  { value: "mlm", label: "Network Marketing" },
  { value: "affiliate", label: "Affiliate Marketing" },
  { value: "coaching", label: "Online Coaching" },
  { value: "ecommerce", label: "E-Commerce" },
  { value: "home_business", label: "Home Business" },
];

const AGENT_TOGGLES = [
  { key: "sms_followup" as keyof AgentToggles, label: "SMS Follow-up", icon: MessageSquare, description: "Auto-send SMS to new funnel leads with their quiz results" },
  { key: "email_followup" as keyof AgentToggles, label: "Email Follow-up", icon: Mail, description: "AI-generated follow-up emails via Resend from noreply@peoplefailsystemswork.com" },
  { key: "voice_call" as keyof AgentToggles, label: "AI Voice Call", icon: PhoneCall, description: "Trigger outbound AI calls to qualified leads" },
  { key: "booking_agent" as keyof AgentToggles, label: "Auto-Booking Agent", icon: CalendarCheck, description: "AI voice agent books calls directly onto your calendar during outreach calls" },
];

export default function Funnels() {
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [funnels, setFunnels] = useState<FunnelData[]>([]);
  const [loadingFunnels, setLoadingFunnels] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreate, setShowCreate] = useState(false);

  // Create form state
  const [title, setTitle] = useState("");
  const [niche, setNiche] = useState("mlm");
  const [headline, setHeadline] = useState("");
  const [description, setDescription] = useState("");
  const [questions, setQuestions] = useState<QuizQuestion[]>(defaultQuestions);

  // Agent toggles — persisted to user_settings
  const [agentToggles, setAgentToggles] = useState<AgentToggles>({
    sms_followup: true,
    email_followup: true,
    voice_call: false,
    booking_agent: false,
  });
  const [togglesLoaded, setTogglesLoaded] = useState(false);

  // Agent stats & usage
  const [agentStats, setAgentStats] = useState<AgentRunSummary[]>([]);
  const [usageData, setUsageData] = useState<UsageData | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  // Outreach history
  const [outreachHistory, setOutreachHistory] = useState<OutreachLogEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) navigate("/login", { replace: true });
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    fetchFunnels();
    fetchAgentStats();
    fetchUsage();
    fetchAgentToggles();
  }, [user]);

  // ─── Persist agent toggles ───
  const fetchAgentToggles = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("user_settings")
      .select("agent_toggles")
      .eq("user_id", user.id)
      .maybeSingle();

    if (data?.agent_toggles) {
      const saved = data.agent_toggles as Record<string, boolean>;
      setAgentToggles({
        sms_followup: saved.sms_followup ?? true,
        email_followup: saved.email_followup ?? true,
        voice_call: saved.voice_call ?? false,
        booking_agent: saved.booking_agent ?? false,
      });
    }
    setTogglesLoaded(true);
  };

  const saveAgentToggles = useCallback(async (newToggles: AgentToggles) => {
    if (!user) return;
    const { error } = await supabase
      .from("user_settings")
      .upsert(
        { user_id: user.id, agent_toggles: newToggles as any },
        { onConflict: "user_id" }
      );
    if (error) console.error("Failed to save toggles:", error);
  }, [user]);

  const handleToggle = (key: keyof AgentToggles, checked: boolean) => {
    const updated = { ...agentToggles, [key]: checked };
    setAgentToggles(updated);
    saveAgentToggles(updated);
  };

  // ─── Outreach history ───
  const fetchOutreachHistory = useCallback(async () => {
    setHistoryLoading(true);
    const { data } = await supabase
      .from("outreach_log")
      .select("id, company_name, recipient_email, recipient_phone, email_subject, email_body, sms_body, channel, delivery_status, grade, source_url, niche, phone_found, open_count, click_count, opened_at, clicked_at, created_at")
      .order("created_at", { ascending: false })
      .limit(100);
    if (data) setOutreachHistory(data as unknown as OutreachLogEntry[]);
    setHistoryLoading(false);
  }, []);

  // ─── Existing fetchers (unchanged) ───
  const fetchFunnels = async () => {
    setLoadingFunnels(true);
    const { data, error } = await supabase
      .from("user_funnels")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) {
      setFunnels(data.map((f: any) => ({
        ...f,
        quiz_config: typeof f.quiz_config === "object" ? f.quiz_config : {},
        brand_config: typeof f.brand_config === "object" ? f.brand_config : {},
      })));
    }
    if (error) toast({ title: "Error loading funnels", description: error.message, variant: "destructive" });
    setLoadingFunnels(false);
  };

  const fetchAgentStats = async () => {
    setLoadingStats(true);
    const { data: runs } = await supabase
      .from("agent_runs")
      .select("id, status, triggered_at, agent_id")
      .order("triggered_at", { ascending: false })
      .limit(100);
    if (runs && runs.length > 0) {
      const agentIds = [...new Set(runs.map((r) => r.agent_id))];
      const { data: agents } = await supabase
        .from("agents")
        .select("id, name, slug")
        .in("id", agentIds);
      const agentMap = Object.fromEntries((agents || []).map((a) => [a.id, { name: a.name, slug: a.slug }]));
      const statsMap: Record<string, AgentRunSummary> = {};
      for (const run of runs) {
        const agent = agentMap[run.agent_id];
        if (!agent) continue;
        if (!statsMap[agent.slug]) {
          statsMap[agent.slug] = { agent_slug: agent.slug, agent_name: agent.name, total_runs: 0, last_run_at: null, last_status: null, successes: 0, failures: 0 };
        }
        const s = statsMap[agent.slug];
        s.total_runs++;
        if (!s.last_run_at) { s.last_run_at = run.triggered_at; s.last_status = run.status; }
        if (run.status === "completed") s.successes++;
        if (run.status === "failed") s.failures++;
      }
      setAgentStats(Object.values(statsMap));
    }
    setLoadingStats(false);
  };

  const fetchUsage = async () => {
    if (!user) return;
    const { data } = await supabase.rpc("get_or_create_usage", { p_user_id: user.id });
    if (data) {
      setUsageData({
        sms_used: (data as any).sms_used || 0,
        voice_calls_used: (data as any).voice_calls_used || 0,
        campaigns_used: (data as any).campaigns_used || 0,
        leads_used: (data as any).leads_used || 0,
      });
    }
  };

  // ─── CRUD helpers (unchanged) ───
  const createFunnel = async () => {
    if (!user || !title.trim()) return;
    setCreating(true);
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const { error } = await supabase.from("user_funnels").insert([{
      user_id: user.id, title: title.trim(), slug,
      quiz_config: { questions } as any,
      brand_config: { niche, headline: headline.trim(), description: description.trim() } as any,
      status: "draft",
    }]);
    if (error) toast({ title: "Failed to create funnel", description: error.message, variant: "destructive" });
    else { toast({ title: "Funnel created!" }); setShowCreate(false); resetForm(); fetchFunnels(); }
    setCreating(false);
  };

  const deleteFunnel = async (id: string, t: string) => {
    const { error } = await supabase.from("user_funnels").delete().eq("id", id);
    if (error) toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    else { toast({ title: "Funnel deleted" }); setFunnels((prev) => prev.filter((f) => f.id !== id)); }
  };

  const toggleStatus = async (id: string, current: string) => {
    const next = current === "active" ? "draft" : "active";
    const { error } = await supabase.from("user_funnels").update({ status: next }).eq("id", id);
    if (!error) { setFunnels((prev) => prev.map((f) => (f.id === id ? { ...f, status: next } : f))); toast({ title: next === "active" ? "Funnel published" : "Funnel unpublished" }); }
  };

  const resetForm = () => { setTitle(""); setNiche("mlm"); setHeadline(""); setDescription(""); setQuestions(defaultQuestions); };
  const addQuestion = () => { setQuestions((prev) => [...prev, { id: `q${Date.now()}`, question: "", type: "single", options: ["Option 1", "Option 2"] }]); };
  const updateQuestion = (idx: number, field: keyof QuizQuestion, value: any) => { setQuestions((prev) => prev.map((q, i) => (i === idx ? { ...q, [field]: value } : q))); };
  const removeQuestion = (idx: number) => { setQuestions((prev) => prev.filter((_, i) => i !== idx)); };
  const updateOption = (qIdx: number, oIdx: number, value: string) => { setQuestions((prev) => prev.map((q, i) => i === qIdx ? { ...q, options: q.options.map((o, j) => (j === oIdx ? value : o)) } : q)); };
  const addOption = (qIdx: number) => { setQuestions((prev) => prev.map((q, i) => i === qIdx ? { ...q, options: [...q.options, `Option ${q.options.length + 1}`] } : q)); };
  const removeOption = (qIdx: number, oIdx: number) => { setQuestions((prev) => prev.map((q, i) => i === qIdx ? { ...q, options: q.options.filter((_, j) => j !== oIdx) } : q)); };

  // Outreach stats
  const totalEmails = outreachHistory.filter(e => (e.channel || "email") === "email" && e.delivery_status === "sent").length;
  const totalSms = outreachHistory.filter(e => e.channel === "sms" && e.delivery_status === "sent").length;
  const totalOpened = outreachHistory.filter(e => (e.open_count || 0) > 0).length;
  const totalClicked = outreachHistory.filter(e => (e.click_count || 0) > 0).length;

  const statusBadge = (s: string) => {
    if (s === "sent") return "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
    if (s === "failed") return "bg-destructive/10 text-destructive border-destructive/30";
    if (s === "no_email") return "bg-muted text-muted-foreground";
    return "";
  };

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-20">
        <div className="container max-w-6xl">

          {/* ─── Header ─── */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">Quiz Funnels</h1>
              <p className="text-sm text-muted-foreground mt-1">Create funnels, manage agents, and track outreach.</p>
            </div>
            <Dialog open={showCreate} onOpenChange={setShowCreate}>
              <DialogTrigger asChild>
                <Button className="gold-glow-strong gap-2"><Plus className="h-4 w-4" /> New Funnel</Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                <DialogHeader><DialogTitle className="text-xl font-bold">Create Quiz Funnel</DialogTitle></DialogHeader>
                <div className="space-y-6 mt-4">
                  <div className="grid gap-4">
                    <div><Label>Funnel Name</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Health Supplement Qualifier" className="mt-1.5" /></div>
                    <div><Label>Niche</Label><Select value={niche} onValueChange={setNiche}><SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger><SelectContent>{niches.map((n) => <SelectItem key={n.value} value={n.value}>{n.label}</SelectItem>)}</SelectContent></Select></div>
                    <div><Label>Landing Headline</Label><Input value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder="e.g. Discover Your Perfect Business Strategy" className="mt-1.5" /></div>
                    <div><Label>Description</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description shown on the landing page..." className="mt-1.5 min-h-[60px] resize-none" /></div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <Label className="text-base font-semibold">Quiz Questions</Label>
                      <Button variant="outline" size="sm" onClick={addQuestion} className="gap-1.5 text-xs"><Plus className="h-3 w-3" /> Add Question</Button>
                    </div>
                    <div className="space-y-4">
                      {questions.map((q, qIdx) => (
                        <Card key={q.id} className="border-border bg-background">
                          <CardContent className="p-4 space-y-3">
                            <div className="flex items-start gap-2">
                              <span className="text-xs font-bold text-primary mt-2.5">Q{qIdx + 1}</span>
                              <div className="flex-1"><Input value={q.question} onChange={(e) => updateQuestion(qIdx, "question", e.target.value)} placeholder="Enter your question..." className="text-sm" /></div>
                              <Select value={q.type} onValueChange={(v) => updateQuestion(qIdx, "type", v)}>
                                <SelectTrigger className="w-[100px] text-xs"><SelectValue /></SelectTrigger>
                                <SelectContent><SelectItem value="single">Single</SelectItem><SelectItem value="multi">Multi</SelectItem></SelectContent>
                              </Select>
                              {questions.length > 1 && <Button variant="ghost" size="sm" onClick={() => removeQuestion(qIdx)} className="text-destructive hover:text-destructive h-9 w-9 p-0"><Trash2 className="h-3.5 w-3.5" /></Button>}
                            </div>
                            <div className="pl-6 space-y-2">
                              {q.options.map((opt, oIdx) => (
                                <div key={oIdx} className="flex items-center gap-2">
                                  <div className="h-4 w-4 rounded-full border border-border shrink-0" />
                                  <Input value={opt} onChange={(e) => updateOption(qIdx, oIdx, e.target.value)} className="text-xs h-8" />
                                  {q.options.length > 2 && <Button variant="ghost" size="sm" onClick={() => removeOption(qIdx, oIdx)} className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"><Trash2 className="h-3 w-3" /></Button>}
                                </div>
                              ))}
                              {q.options.length < 6 && <button onClick={() => addOption(qIdx)} className="text-xs text-primary hover:underline ml-6">+ Add option</button>}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                  <Button onClick={createFunnel} disabled={!title.trim() || creating} className="w-full gold-glow-strong" size="lg">{creating ? "Creating..." : "Create Funnel"}</Button>
                </div>
              </DialogContent>
            </Dialog>
          </motion.div>

          {/* ─── Tabs: Funnels | Agents | Outreach History ─── */}
          <Tabs defaultValue="funnels" className="space-y-6">
            <TabsList>
              <TabsTrigger value="funnels"><Target className="mr-2 h-4 w-4" /> Funnels</TabsTrigger>
              <TabsTrigger value="agents"><Zap className="mr-2 h-4 w-4" /> Agents & Stats</TabsTrigger>
              <TabsTrigger value="history" onClick={() => { if (outreachHistory.length === 0) fetchOutreachHistory(); }}>
                <History className="mr-2 h-4 w-4" /> Outreach History
              </TabsTrigger>
            </TabsList>

            {/* ========== FUNNELS TAB ========== */}
            <TabsContent value="funnels">
              {loadingFunnels ? (
                <div className="flex items-center justify-center py-20">
                  <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : funnels.length === 0 ? (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-20">
                  <div className="h-16 w-16 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto mb-4"><Target className="h-7 w-7 text-primary" /></div>
                  <h3 className="text-lg font-bold text-foreground mb-2">No funnels yet</h3>
                  <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">Create your first quiz funnel to start qualifying leads.</p>
                  <Button onClick={() => setShowCreate(true)} className="gold-glow-strong gap-2"><Plus className="h-4 w-4" /> Create Your First Funnel</Button>
                </motion.div>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  <AnimatePresence>
                    {funnels.map((funnel, i) => {
                      const questionCount = (funnel.quiz_config?.questions || []).length;
                      const nicheLabel = niches.find((n) => n.value === funnel.brand_config?.niche)?.label || funnel.brand_config?.niche || "General";
                      return (
                        <motion.div key={funnel.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ delay: i * 0.05 }}>
                          <Card className="bg-card border-border hover:border-primary/30 transition-all group overflow-hidden h-full">
                            <CardContent className="p-6 flex flex-col h-full">
                              <div className="flex items-center justify-between mb-4">
                                <span className={`text-[10px] uppercase tracking-[0.15em] font-semibold px-2.5 py-1 rounded-full ${funnel.status === "active" ? "text-emerald-400 bg-emerald-400/10" : "text-muted-foreground bg-muted"}`}>{funnel.status}</span>
                                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{nicheLabel}</span>
                              </div>
                              <h3 className="text-base font-bold text-foreground mb-2 group-hover:text-primary transition-colors">{funnel.title}</h3>
                              {funnel.brand_config?.headline && <p className="text-xs text-muted-foreground mb-4 line-clamp-2">{funnel.brand_config.headline}</p>}
                              <div className="flex items-center gap-4 mb-5 mt-auto">
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><FileText className="h-3.5 w-3.5" /> {questionCount} questions</div>
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Users className="h-3.5 w-3.5" /> {funnel.submissions_count} leads</div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={() => toggleStatus(funnel.id, funnel.status)}>{funnel.status === "active" ? "Unpublish" : "Publish"}</Button>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive" onClick={() => deleteFunnel(funnel.id, funnel.title)}><Trash2 className="h-3.5 w-3.5" /></Button>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              )}
            </TabsContent>

            {/* ========== AGENTS & STATS TAB ========== */}
            <TabsContent value="agents" className="space-y-6">
              {/* Global Agent Toggles — persisted */}
              <Card className="border-border bg-card">
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Zap className="h-4 w-4 text-primary" />
                    <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">Agent Automation</h2>
                    {togglesLoaded && <Badge variant="outline" className="text-[10px] ml-auto">Saved to cloud</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground mb-4">Toggle which agents auto-trigger on new leads. Settings persist across sessions.</p>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {AGENT_TOGGLES.map((agent) => {
                      const Icon = agent.icon;
                      const isOn = agentToggles[agent.key];
                      return (
                        <div key={agent.key} className={`rounded-lg border p-4 transition-all ${isOn ? "border-primary/40 bg-primary/5" : "border-border bg-muted/20"}`}>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Icon className={`h-4 w-4 ${isOn ? "text-primary" : "text-muted-foreground"}`} />
                              <span className="text-sm font-medium text-foreground">{agent.label}</span>
                            </div>
                            <Switch checked={isOn} onCheckedChange={(checked) => handleToggle(agent.key, checked)} />
                          </div>
                          <p className="text-[11px] text-muted-foreground leading-relaxed">{agent.description}</p>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Usage Stats */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border-border bg-card"><CardContent className="p-4"><div className="flex items-center gap-2 mb-2"><MessageSquare className="h-3.5 w-3.5 text-primary" /><span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">SMS Sent</span></div><p className="text-2xl font-bold text-foreground">{usageData?.sms_used ?? 0}</p><p className="text-[10px] text-muted-foreground mt-1">This billing period</p></CardContent></Card>
                <Card className="border-border bg-card"><CardContent className="p-4"><div className="flex items-center gap-2 mb-2"><PhoneCall className="h-3.5 w-3.5 text-primary" /><span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Voice Calls</span></div><p className="text-2xl font-bold text-foreground">{usageData?.voice_calls_used ?? 0}</p><p className="text-[10px] text-muted-foreground mt-1">This billing period</p></CardContent></Card>
                <Card className="border-border bg-card"><CardContent className="p-4"><div className="flex items-center gap-2 mb-2"><Mail className="h-3.5 w-3.5 text-primary" /><span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Emails Sent</span></div><p className="text-2xl font-bold text-foreground">{usageData?.campaigns_used ?? 0}</p><p className="text-[10px] text-muted-foreground mt-1">This billing period</p></CardContent></Card>
                <Card className="border-border bg-card"><CardContent className="p-4"><div className="flex items-center gap-2 mb-2"><Users className="h-3.5 w-3.5 text-primary" /><span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Leads Generated</span></div><p className="text-2xl font-bold text-foreground">{usageData?.leads_used ?? 0}</p><p className="text-[10px] text-muted-foreground mt-1">This billing period</p></CardContent></Card>
              </div>

              {/* Agent Run History */}
              {agentStats.length > 0 && (
                <Card className="border-border bg-card">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <Activity className="h-4 w-4 text-primary" />
                      <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">Agent Activity</h2>
                    </div>
                    <div className="space-y-3">
                      {agentStats.slice(0, 6).map((stat) => (
                        <div key={stat.agent_slug} className="flex items-center justify-between rounded-md border border-border bg-muted/20 p-3">
                          <div>
                            <p className="text-sm font-medium text-foreground">{stat.agent_name}</p>
                            <p className="text-[10px] text-muted-foreground">{stat.last_run_at ? `Last run: ${format(new Date(stat.last_run_at), "MMM d, h:mm a")}` : "No runs yet"}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1 text-xs"><CheckCircle2 className="h-3 w-3 text-emerald-400" /><span className="text-foreground">{stat.successes}</span></div>
                            <div className="flex items-center gap-1 text-xs"><XCircle className="h-3 w-3 text-destructive" /><span className="text-foreground">{stat.failures}</span></div>
                            <Badge variant="outline" className="text-[10px]">{stat.total_runs} runs</Badge>
                            {stat.last_status && (
                              <Badge variant="outline" className={`text-[10px] ${stat.last_status === "completed" ? "bg-emerald-500/10 text-emerald-400" : stat.last_status === "failed" ? "bg-destructive/10 text-destructive" : "bg-amber-500/10 text-amber-400"}`}>{stat.last_status}</Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* ========== OUTREACH HISTORY TAB ========== */}
            <TabsContent value="history" className="space-y-4">
              {/* Engagement stats row */}
              {outreachHistory.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <Card><CardContent className="flex items-center gap-3 p-4"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10"><Send className="h-5 w-5 text-primary" /></div><div><p className="text-2xl font-bold text-foreground">{totalEmails}</p><p className="text-xs text-muted-foreground">Emails Sent</p></div></CardContent></Card>
                  <Card><CardContent className="flex items-center gap-3 p-4"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/20"><MessageSquare className="h-5 w-5 text-accent-foreground" /></div><div><p className="text-2xl font-bold text-foreground">{totalSms}</p><p className="text-xs text-muted-foreground">SMS Sent</p></div></CardContent></Card>
                  <Card><CardContent className="flex items-center gap-3 p-4"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10"><Eye className="h-5 w-5 text-primary" /></div><div><p className="text-2xl font-bold text-foreground">{totalOpened}</p><p className="text-xs text-muted-foreground">Opens ({totalEmails ? Math.round((totalOpened / totalEmails) * 100) : 0}%)</p></div></CardContent></Card>
                  <Card><CardContent className="flex items-center gap-3 p-4"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10"><CheckCircle2 className="h-5 w-5 text-emerald-500" /></div><div><p className="text-2xl font-bold text-foreground">{totalClicked}</p><p className="text-xs text-muted-foreground">Clicks ({totalEmails ? Math.round((totalClicked / totalEmails) * 100) : 0}%)</p></div></CardContent></Card>
                </div>
              )}

              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-lg">Outreach History</CardTitle>
                  <Button size="sm" variant="outline" onClick={fetchOutreachHistory} disabled={historyLoading}>
                    {historyLoading ? <Clock className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                  </Button>
                </CardHeader>
                <CardContent className="p-0">
                  {historyLoading ? (
                    <div className="flex items-center justify-center py-20"><Clock className="h-6 w-6 animate-spin text-muted-foreground" /></div>
                  ) : outreachHistory.length === 0 ? (
                    <div className="py-20 text-center text-muted-foreground">No outreach sent yet. Outreach logs will appear here once agents start sending emails and SMS.</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Company</TableHead>
                            <TableHead>Channel</TableHead>
                            <TableHead>Recipient</TableHead>
                            <TableHead>Subject / Message</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Opens</TableHead>
                            <TableHead>Clicks</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead className="w-10"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {outreachHistory.map((entry) => {
                            const isExpanded = expandedHistoryId === entry.id;
                            const isEmail = (entry.channel || "email") === "email";
                            return (
                              <TableRow key={entry.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setExpandedHistoryId(isExpanded ? null : entry.id)}>
                                <TableCell className="font-medium">
                                  <div className="flex items-center gap-2">
                                    {entry.company_name || "—"}
                                    {entry.source_url && <a href={entry.source_url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}><ExternalLink className="h-3 w-3 text-muted-foreground hover:text-primary" /></a>}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline" className={`text-xs gap-1 ${!isEmail ? "bg-accent/10 text-accent-foreground border-accent/30" : "bg-primary/10 text-primary border-primary/30"}`}>
                                    {isEmail ? <><Mail className="h-3 w-3" /> Email</> : <><MessageSquare className="h-3 w-3" /> SMS</>}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-muted-foreground text-xs">{isEmail ? (entry.recipient_email || "—") : (entry.recipient_phone || entry.phone_found || "—")}</TableCell>
                                <TableCell className="text-muted-foreground max-w-[200px] truncate text-xs">{isEmail ? (entry.email_subject || "—") : (entry.sms_body?.slice(0, 60) || "—")}</TableCell>
                                <TableCell><Badge variant="outline" className={`capitalize text-xs ${statusBadge(entry.delivery_status)}`}>{entry.delivery_status === "no_email" ? "No Email" : entry.delivery_status}</Badge></TableCell>
                                <TableCell>{(entry.open_count || 0) > 0 ? <Badge variant="outline" className="text-xs gap-1 bg-primary/10 text-primary border-primary/30"><Eye className="h-3 w-3" /> {entry.open_count}</Badge> : <span className="text-xs text-muted-foreground">—</span>}</TableCell>
                                <TableCell>{(entry.click_count || 0) > 0 ? <Badge variant="outline" className="text-xs gap-1 bg-emerald-500/10 text-emerald-400 border-emerald-500/30"><CheckCircle2 className="h-3 w-3" /> {entry.click_count}</Badge> : <span className="text-xs text-muted-foreground">—</span>}</TableCell>
                                <TableCell className="text-muted-foreground text-xs whitespace-nowrap">{new Date(entry.created_at).toLocaleString()}</TableCell>
                                <TableCell>
                                  <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setExpandedHistoryId(isExpanded ? null : entry.id); }}>
                                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                  </Button>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
}
