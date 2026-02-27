import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Plus, Target, Trash2,
  FileText, Users, Zap, Mail, MessageSquare, PhoneCall,
  Activity, CheckCircle2, XCircle, Clock,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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

const defaultQuestions: QuizQuestion[] = [
  {
    id: "q1",
    question: "What's your biggest challenge right now?",
    type: "single",
    options: ["Getting leads", "Closing sales", "Time management", "Building a team"],
  },
  {
    id: "q2",
    question: "How much time do you spend on prospecting per week?",
    type: "single",
    options: ["Less than 2 hours", "2-5 hours", "5-10 hours", "10+ hours"],
  },
  {
    id: "q3",
    question: "What's your monthly revenue goal?",
    type: "single",
    options: ["$1K-$3K", "$3K-$10K", "$10K-$25K", "$25K+"],
  },
];

const niches = [
  { value: "mlm", label: "Network Marketing" },
  { value: "affiliate", label: "Affiliate Marketing" },
  { value: "coaching", label: "Online Coaching" },
  { value: "ecommerce", label: "E-Commerce" },
  { value: "home_business", label: "Home Business" },
];

const AGENT_TOGGLES = [
  { key: "sms_followup", label: "SMS Follow-up", icon: MessageSquare, description: "Auto-send SMS to new funnel leads with their quiz results" },
  { key: "email_followup", label: "Email Follow-up", icon: Mail, description: "AI-generated follow-up emails via Resend" },
  { key: "voice_call", label: "AI Voice Call", icon: PhoneCall, description: "Trigger outbound Twilio AI calls to qualified leads" },
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

  // Agent toggles (stored locally, persisted to user preferences later)
  const [agentToggles, setAgentToggles] = useState<Record<string, boolean>>({
    sms_followup: true,
    email_followup: true,
    voice_call: false,
  });

  // Agent stats
  const [agentStats, setAgentStats] = useState<AgentRunSummary[]>([]);
  const [usageData, setUsageData] = useState<UsageData | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate("/login", { replace: true });
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    fetchFunnels();
    fetchAgentStats();
    fetchUsage();
  }, [user]);

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
    if (error) {
      toast({ title: "Error loading funnels", description: error.message, variant: "destructive" });
    }
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
          statsMap[agent.slug] = {
            agent_slug: agent.slug,
            agent_name: agent.name,
            total_runs: 0,
            last_run_at: null,
            last_status: null,
            successes: 0,
            failures: 0,
          };
        }
        const s = statsMap[agent.slug];
        s.total_runs++;
        if (!s.last_run_at) {
          s.last_run_at = run.triggered_at;
          s.last_status = run.status;
        }
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

  const createFunnel = async () => {
    if (!user || !title.trim()) return;
    setCreating(true);

    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

    const { error } = await supabase.from("user_funnels").insert([{
      user_id: user.id,
      title: title.trim(),
      slug,
      quiz_config: { questions } as any,
      brand_config: { niche, headline: headline.trim(), description: description.trim() } as any,
      status: "draft",
    }]);

    if (error) {
      toast({ title: "Failed to create funnel", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Funnel created!", description: `"${title}" is ready to customize.` });
      setShowCreate(false);
      resetForm();
      fetchFunnels();
    }
    setCreating(false);
  };

  const deleteFunnel = async (id: string, funnelTitle: string) => {
    const { error } = await supabase.from("user_funnels").delete().eq("id", id);
    if (error) {
      toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Funnel deleted", description: `"${funnelTitle}" removed.` });
      setFunnels((prev) => prev.filter((f) => f.id !== id));
    }
  };

  const toggleStatus = async (id: string, current: string) => {
    const next = current === "active" ? "draft" : "active";
    const { error } = await supabase.from("user_funnels").update({ status: next }).eq("id", id);
    if (!error) {
      setFunnels((prev) => prev.map((f) => (f.id === id ? { ...f, status: next } : f)));
      toast({ title: next === "active" ? "Funnel published" : "Funnel unpublished" });
    }
  };

  const resetForm = () => {
    setTitle("");
    setNiche("mlm");
    setHeadline("");
    setDescription("");
    setQuestions(defaultQuestions);
  };

  const addQuestion = () => {
    setQuestions((prev) => [
      ...prev,
      { id: `q${Date.now()}`, question: "", type: "single", options: ["Option 1", "Option 2"] },
    ]);
  };

  const updateQuestion = (idx: number, field: keyof QuizQuestion, value: any) => {
    setQuestions((prev) => prev.map((q, i) => (i === idx ? { ...q, [field]: value } : q)));
  };

  const removeQuestion = (idx: number) => {
    setQuestions((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateOption = (qIdx: number, oIdx: number, value: string) => {
    setQuestions((prev) =>
      prev.map((q, i) =>
        i === qIdx ? { ...q, options: q.options.map((o, j) => (j === oIdx ? value : o)) } : q
      )
    );
  };

  const addOption = (qIdx: number) => {
    setQuestions((prev) =>
      prev.map((q, i) =>
        i === qIdx ? { ...q, options: [...q.options, `Option ${q.options.length + 1}`] } : q
      )
    );
  };

  const removeOption = (qIdx: number, oIdx: number) => {
    setQuestions((prev) =>
      prev.map((q, i) =>
        i === qIdx ? { ...q, options: q.options.filter((_, j) => j !== oIdx) } : q
      )
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-20">
        <div className="container max-w-6xl">

          {/* ─── Header ─── */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between mb-8"
          >
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">Quiz Funnels</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Create funnels that qualify prospects and feed your pipeline.
              </p>
            </div>

            <Dialog open={showCreate} onOpenChange={setShowCreate}>
              <DialogTrigger asChild>
                <Button className="gold-glow-strong gap-2">
                  <Plus className="h-4 w-4" />
                  New Funnel
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold">Create Quiz Funnel</DialogTitle>
                </DialogHeader>

                <div className="space-y-6 mt-4">
                  {/* Basic Info */}
                  <div className="grid gap-4">
                    <div>
                      <Label>Funnel Name</Label>
                      <Input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g. Health Supplement Qualifier"
                        className="mt-1.5"
                      />
                    </div>
                    <div>
                      <Label>Niche</Label>
                      <Select value={niche} onValueChange={setNiche}>
                        <SelectTrigger className="mt-1.5">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {niches.map((n) => (
                            <SelectItem key={n.value} value={n.value}>{n.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Landing Headline</Label>
                      <Input
                        value={headline}
                        onChange={(e) => setHeadline(e.target.value)}
                        placeholder="e.g. Discover Your Perfect Business Strategy"
                        className="mt-1.5"
                      />
                    </div>
                    <div>
                      <Label>Description</Label>
                      <Textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Brief description shown on the landing page..."
                        className="mt-1.5 min-h-[60px] resize-none"
                      />
                    </div>
                  </div>

                  {/* Questions Builder */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <Label className="text-base font-semibold">Quiz Questions</Label>
                      <Button variant="outline" size="sm" onClick={addQuestion} className="gap-1.5 text-xs">
                        <Plus className="h-3 w-3" />
                        Add Question
                      </Button>
                    </div>

                    <div className="space-y-4">
                      {questions.map((q, qIdx) => (
                        <Card key={q.id} className="border-border bg-background">
                          <CardContent className="p-4 space-y-3">
                            <div className="flex items-start gap-2">
                              <span className="text-xs font-bold text-primary mt-2.5">Q{qIdx + 1}</span>
                              <div className="flex-1">
                                <Input
                                  value={q.question}
                                  onChange={(e) => updateQuestion(qIdx, "question", e.target.value)}
                                  placeholder="Enter your question..."
                                  className="text-sm"
                                />
                              </div>
                              <Select
                                value={q.type}
                                onValueChange={(v) => updateQuestion(qIdx, "type", v)}
                              >
                                <SelectTrigger className="w-[100px] text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="single">Single</SelectItem>
                                  <SelectItem value="multi">Multi</SelectItem>
                                </SelectContent>
                              </Select>
                              {questions.length > 1 && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeQuestion(qIdx)}
                                  className="text-destructive hover:text-destructive h-9 w-9 p-0"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              )}
                            </div>

                            <div className="pl-6 space-y-2">
                              {q.options.map((opt, oIdx) => (
                                <div key={oIdx} className="flex items-center gap-2">
                                  <div className="h-4 w-4 rounded-full border border-border shrink-0" />
                                  <Input
                                    value={opt}
                                    onChange={(e) => updateOption(qIdx, oIdx, e.target.value)}
                                    className="text-xs h-8"
                                  />
                                  {q.options.length > 2 && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => removeOption(qIdx, oIdx)}
                                      className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  )}
                                </div>
                              ))}
                              {q.options.length < 6 && (
                                <button
                                  onClick={() => addOption(qIdx)}
                                  className="text-xs text-primary hover:underline ml-6"
                                >
                                  + Add option
                                </button>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>

                  <Button
                    onClick={createFunnel}
                    disabled={!title.trim() || creating}
                    className="w-full gold-glow-strong"
                    size="lg"
                  >
                    {creating ? "Creating..." : "Create Funnel"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </motion.div>

          {/* ─── Agent Settings & Status Dashboard ─── */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="mb-8 space-y-4"
          >
            {/* Global Agent Toggles */}
            <Card className="border-border bg-card">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Zap className="h-4 w-4 text-primary" />
                  <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">Agent Automation</h2>
                </div>
                <p className="text-xs text-muted-foreground mb-4">
                  Toggle which agents auto-trigger when a new lead completes a quiz funnel.
                </p>
                <div className="grid sm:grid-cols-3 gap-4">
                  {AGENT_TOGGLES.map((agent) => {
                    const Icon = agent.icon;
                    const isOn = agentToggles[agent.key];
                    return (
                      <div
                        key={agent.key}
                        className={`rounded-lg border p-4 transition-all ${
                          isOn ? "border-primary/40 bg-primary/5" : "border-border bg-muted/20"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Icon className={`h-4 w-4 ${isOn ? "text-primary" : "text-muted-foreground"}`} />
                            <span className="text-sm font-medium text-foreground">{agent.label}</span>
                          </div>
                          <Switch
                            checked={isOn}
                            onCheckedChange={(checked) =>
                              setAgentToggles((prev) => ({ ...prev, [agent.key]: checked }))
                            }
                          />
                        </div>
                        <p className="text-[11px] text-muted-foreground leading-relaxed">{agent.description}</p>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Agent Status Dashboard */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Usage Stats Cards */}
              <Card className="border-border bg-card">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquare className="h-3.5 w-3.5 text-primary" />
                    <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">SMS Sent</span>
                  </div>
                  <p className="text-2xl font-bold text-foreground">{usageData?.sms_used ?? 0}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">This billing period</p>
                </CardContent>
              </Card>
              <Card className="border-border bg-card">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <PhoneCall className="h-3.5 w-3.5 text-primary" />
                    <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Voice Calls</span>
                  </div>
                  <p className="text-2xl font-bold text-foreground">{usageData?.voice_calls_used ?? 0}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">This billing period</p>
                </CardContent>
              </Card>
              <Card className="border-border bg-card">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Mail className="h-3.5 w-3.5 text-primary" />
                    <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Emails Sent</span>
                  </div>
                  <p className="text-2xl font-bold text-foreground">{usageData?.campaigns_used ?? 0}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">This billing period</p>
                </CardContent>
              </Card>
              <Card className="border-border bg-card">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="h-3.5 w-3.5 text-primary" />
                    <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Leads Generated</span>
                  </div>
                  <p className="text-2xl font-bold text-foreground">{usageData?.leads_used ?? 0}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">This billing period</p>
                </CardContent>
              </Card>
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
                          <p className="text-[10px] text-muted-foreground">
                            {stat.last_run_at ? `Last run: ${format(new Date(stat.last_run_at), "MMM d, h:mm a")}` : "No runs yet"}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1 text-xs">
                            <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                            <span className="text-foreground">{stat.successes}</span>
                          </div>
                          <div className="flex items-center gap-1 text-xs">
                            <XCircle className="h-3 w-3 text-destructive" />
                            <span className="text-foreground">{stat.failures}</span>
                          </div>
                          <Badge variant="outline" className="text-[10px]">
                            {stat.total_runs} runs
                          </Badge>
                          {stat.last_status && (
                            <Badge
                              variant="outline"
                              className={`text-[10px] ${
                                stat.last_status === "completed"
                                  ? "bg-emerald-500/10 text-emerald-400"
                                  : stat.last_status === "failed"
                                  ? "bg-destructive/10 text-destructive"
                                  : "bg-amber-500/10 text-amber-400"
                              }`}
                            >
                              {stat.last_status}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>

          {/* ─── Funnel Grid ─── */}
          {loadingFunnels ? (
            <div className="flex items-center justify-center py-20">
              <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : funnels.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-20"
            >
              <div className="h-16 w-16 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Target className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">No funnels yet</h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                Create your first quiz funnel to start qualifying leads and filling your pipeline automatically.
              </p>
              <Button onClick={() => setShowCreate(true)} className="gold-glow-strong gap-2">
                <Plus className="h-4 w-4" />
                Create Your First Funnel
              </Button>
            </motion.div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              <AnimatePresence>
                {funnels.map((funnel, i) => {
                  const questionCount = (funnel.quiz_config?.questions || []).length;
                  const nicheLabel = niches.find((n) => n.value === funnel.brand_config?.niche)?.label || funnel.brand_config?.niche || "General";

                  return (
                    <motion.div
                      key={funnel.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <Card className="bg-card border-border hover:border-primary/30 transition-all group overflow-hidden h-full">
                        <CardContent className="p-6 flex flex-col h-full">
                          {/* Status + Niche */}
                          <div className="flex items-center justify-between mb-4">
                            <span className={`text-[10px] uppercase tracking-[0.15em] font-semibold px-2.5 py-1 rounded-full ${
                              funnel.status === "active"
                                ? "text-emerald-400 bg-emerald-400/10"
                                : "text-muted-foreground bg-muted"
                            }`}>
                              {funnel.status}
                            </span>
                            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                              {nicheLabel}
                            </span>
                          </div>

                          {/* Title */}
                          <h3 className="text-base font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                            {funnel.title}
                          </h3>

                          {funnel.brand_config?.headline && (
                            <p className="text-xs text-muted-foreground mb-4 line-clamp-2">
                              {funnel.brand_config.headline}
                            </p>
                          )}

                          {/* Stats row */}
                          <div className="flex items-center gap-4 mb-5 mt-auto">
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <FileText className="h-3.5 w-3.5" />
                              {questionCount} questions
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Users className="h-3.5 w-3.5" />
                              {funnel.submissions_count} leads
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1 text-xs"
                              onClick={() => toggleStatus(funnel.id, funnel.status)}
                            >
                              {funnel.status === "active" ? "Unpublish" : "Publish"}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                              onClick={() => deleteFunnel(funnel.id, funnel.title)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
