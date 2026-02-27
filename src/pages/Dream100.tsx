import { useState, useEffect, useMemo, useCallback } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { AuthGate } from "@/components/AuthGate";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Plus, Search, Loader2, Star, Globe, Instagram, Youtube, Twitter,
  Sparkles, Trash2, ExternalLink, Users, MessageCircle, UserPlus,
  CheckCircle2, Circle, XCircle, Eye, Zap, Target, ScanSearch, BrainCircuit,
  Filter, Database, ArrowRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const PLATFORMS = ["instagram", "youtube", "twitter", "tiktok", "linkedin", "podcast", "blog", "other"];
const STATUSES = ["suggested", "approved", "researching", "engaging", "connected", "partnered", "rejected"];
const OUTREACH_STATUSES = ["not_started", "watching", "commented", "dm_sent", "replied", "meeting_set", "collaborating"];

const STATUS_COLORS: Record<string, string> = {
  suggested: "bg-muted text-muted-foreground",
  approved: "bg-primary/20 text-primary border-primary/30",
  researching: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  engaging: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  connected: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  partnered: "bg-green-500/20 text-green-400 border-green-500/30",
  rejected: "bg-destructive/20 text-destructive border-destructive/30",
};

const OUTREACH_COLORS: Record<string, string> = {
  not_started: "bg-muted text-muted-foreground",
  watching: "bg-blue-500/20 text-blue-400",
  commented: "bg-amber-500/20 text-amber-400",
  dm_sent: "bg-purple-500/20 text-purple-400",
  replied: "bg-emerald-500/20 text-emerald-400",
  meeting_set: "bg-cyan-500/20 text-cyan-400",
  collaborating: "bg-green-500/20 text-green-400",
};

const PLATFORM_ICONS: Record<string, React.ReactNode> = {
  instagram: <Instagram className="h-3.5 w-3.5" />,
  youtube: <Youtube className="h-3.5 w-3.5" />,
  twitter: <Twitter className="h-3.5 w-3.5" />,
  default: <Globe className="h-3.5 w-3.5" />,
};

// Discovery workflow step definitions
const DISCOVERY_STEPS = [
  { id: "profile", label: "Reading your niche profile", icon: Eye, description: "Analyzing your niche and target location" },
  { id: "existing", label: "Scanning existing list", icon: Database, description: "Checking for duplicates in your Dream 100" },
  { id: "search_ig", label: "Searching Instagram influencers", icon: ScanSearch, description: "Finding top creators on Instagram" },
  { id: "search_yt", label: "Searching YouTube creators", icon: Youtube, description: "Discovering relevant YouTube channels" },
  { id: "search_leaders", label: "Finding thought leaders", icon: Target, description: "Identifying niche thought leaders" },
  { id: "ai_extract", label: "AI extracting candidates", icon: BrainCircuit, description: "Using AI to extract and rank candidates" },
  { id: "dedup", label: "Deduplicating results", icon: Filter, description: "Removing duplicates and filtering quality" },
  { id: "insert", label: "Adding to your Dream 100", icon: Database, description: "Saving new suggestions to your list" },
];

interface Dream100Entry {
  id: string;
  name: string;
  platform: string;
  url: string | null;
  niche: string | null;
  status: string;
  outreach_status: string;
  notes: string | null;
  followers_estimate: number | null;
  ai_suggested: boolean;
  created_at: string;
}

interface DiscoveryStep {
  id: string;
  status: "pending" | "running" | "completed" | "failed";
  detail?: string;
}

export default function Dream100() {
  return (
    <AuthGate requireActive>
      <Dream100Content />
    </AuthGate>
  );
}

function Dream100Content() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [entries, setEntries] = useState<Dream100Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [addOpen, setAddOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Discovery workflow state
  const [discovering, setDiscovering] = useState(false);
  const [discoverySteps, setDiscoverySteps] = useState<DiscoveryStep[]>([]);
  const [discoveryResult, setDiscoveryResult] = useState<{ count: number; error?: string } | null>(null);

  // Form state
  const [formName, setFormName] = useState("");
  const [formPlatform, setFormPlatform] = useState("instagram");
  const [formUrl, setFormUrl] = useState("");
  const [formNiche, setFormNiche] = useState("");
  const [formFollowers, setFormFollowers] = useState("");
  const [formNotes, setFormNotes] = useState("");

  useEffect(() => { fetchEntries(); }, [user]);

  const fetchEntries = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("dream_100")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setEntries((data as Dream100Entry[]) || []);
    setLoading(false);
  };

  const filtered = useMemo(() => {
    let result = entries;
    if (statusFilter !== "All") result = result.filter((e) => e.status === statusFilter);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((e) =>
        e.name.toLowerCase().includes(q) ||
        e.niche?.toLowerCase().includes(q) ||
        e.platform.toLowerCase().includes(q)
      );
    }
    return result;
  }, [entries, statusFilter, searchQuery]);

  const stats = useMemo(() => ({
    total: entries.length,
    aiSuggested: entries.filter((e) => e.ai_suggested).length,
    engaging: entries.filter((e) => ["engaging", "connected", "partnered"].includes(e.status)).length,
    partnered: entries.filter((e) => e.status === "partnered").length,
  }), [entries]);

  const resetForm = () => {
    setFormName(""); setFormPlatform("instagram"); setFormUrl("");
    setFormNiche(""); setFormFollowers(""); setFormNotes("");
  };

  const handleAdd = async () => {
    if (!user || !formName.trim()) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("dream_100").insert({
        user_id: user.id,
        name: formName.trim(),
        platform: formPlatform,
        url: formUrl.trim() || null,
        niche: formNiche.trim() || null,
        followers_estimate: formFollowers ? parseInt(formFollowers) : null,
        notes: formNotes.trim() || null,
        status: "approved",
        ai_suggested: false,
      });
      if (error) throw error;
      toast({ title: "Added to Dream 100" });
      setAddOpen(false);
      resetForm();
      fetchEntries();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const updateEntry = async (id: string, updates: Partial<Dream100Entry>) => {
    await supabase.from("dream_100").update(updates).eq("id", id);
    fetchEntries();
  };

  const deleteEntry = async (id: string) => {
    await supabase.from("dream_100").delete().eq("id", id);
    fetchEntries();
    toast({ title: "Removed from Dream 100" });
  };

  // Simulate step-by-step discovery workflow
  const advanceStep = useCallback((stepIndex: number, detail?: string) => {
    setDiscoverySteps((prev) => {
      const next = [...prev];
      // Complete previous step
      if (stepIndex > 0 && next[stepIndex - 1]) {
        next[stepIndex - 1] = { ...next[stepIndex - 1], status: "completed" };
      }
      // Start current step
      if (next[stepIndex]) {
        next[stepIndex] = { ...next[stepIndex], status: "running", detail };
      }
      return next;
    });
  }, []);

  const runDiscovery = async () => {
    if (!user) return;
    setDiscovering(true);
    setDiscoveryResult(null);

    // Initialize steps
    const initialSteps: DiscoveryStep[] = DISCOVERY_STEPS.map((s) => ({
      id: s.id,
      status: "pending" as const,
    }));
    setDiscoverySteps(initialSteps);

    // Simulate step progression while the real function runs
    const stepTimings = [300, 800, 1500, 3000, 5000, 7500, 10000, 13000];

    const timers: number[] = [];
    stepTimings.forEach((ms, i) => {
      const timer = window.setTimeout(() => {
        advanceStep(i, DISCOVERY_STEPS[i].description);
      }, ms);
      timers.push(timer);
    });

    try {
      const { data, error } = await supabase.functions.invoke("agent-dream100-discover", {
        body: { user_id: user.id },
      });

      // Clear remaining timers
      timers.forEach((t) => clearTimeout(t));

      if (error) throw error;

      // Mark all steps completed
      setDiscoverySteps((prev) =>
        prev.map((s) => ({ ...s, status: "completed" as const }))
      );

      setDiscoveryResult({ count: data?.count || 0 });
      toast({ title: "Discovery complete", description: `Found ${data?.count || 0} new suggestions` });
      fetchEntries();
    } catch (e: any) {
      timers.forEach((t) => clearTimeout(t));
      setDiscoverySteps((prev) =>
        prev.map((s) =>
          s.status === "running" ? { ...s, status: "failed" as const, detail: e.message } : s
        )
      );
      setDiscoveryResult({ count: 0, error: e.message });
      toast({ title: "Discovery failed", description: e.message, variant: "destructive" });
    } finally {
      setDiscovering(false);
    }
  };

  const formatFollowers = (n: number | null) => {
    if (!n) return "—";
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
    return n.toString();
  };

  const stepIcons: Record<string, React.ReactNode> = {
    pending: <Circle className="h-4 w-4 text-muted-foreground" />,
    running: <Loader2 className="h-4 w-4 text-primary animate-spin" />,
    completed: <CheckCircle2 className="h-4 w-4 text-emerald-400" />,
    failed: <XCircle className="h-4 w-4 text-destructive" />,
  };

  const completedSteps = discoverySteps.filter((s) => s.status === "completed").length;
  const showWorkflow = discoverySteps.length > 0;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-20 pb-20">
        <div className="container max-w-6xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-xl font-bold text-foreground">Dream 100</h1>
              <p className="text-xs text-muted-foreground">Your strategic relationship-building list</p>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={runDiscovery} disabled={discovering}>
                {discovering ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Sparkles className="h-3 w-3 mr-1" />}
                AI Discover
              </Button>
              <Button size="sm" onClick={() => setAddOpen(true)}>
                <Plus className="h-3 w-3 mr-1" /> Add
              </Button>
            </div>
          </div>

          {/* Discovery Workflow Panel */}
          <AnimatePresence>
            {showWorkflow && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="mb-6"
              >
                <Card className="bg-card border-border overflow-hidden">
                  <CardHeader className="pb-3 pt-4 px-5">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <Zap className="h-4 w-4 text-primary" />
                        Dream 100 Discovery Agent
                        {discovering && (
                          <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/30 animate-pulse">
                            Running
                          </Badge>
                        )}
                        {!discovering && discoveryResult && !discoveryResult.error && (
                          <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                            Complete — {discoveryResult.count} found
                          </Badge>
                        )}
                        {!discovering && discoveryResult?.error && (
                          <Badge variant="outline" className="text-[10px] bg-destructive/10 text-destructive border-destructive/30">
                            Failed
                          </Badge>
                        )}
                      </CardTitle>
                      <span className="text-[10px] text-muted-foreground">
                        {completedSteps}/{DISCOVERY_STEPS.length} steps
                      </span>
                    </div>
                    {/* Progress bar */}
                    <div className="h-1 bg-muted rounded-full mt-2 overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
                        initial={{ width: "0%" }}
                        animate={{ width: `${(completedSteps / DISCOVERY_STEPS.length) * 100}%` }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                  </CardHeader>
                  <CardContent className="px-5 pb-4">
                    <div className="space-y-1.5">
                      {DISCOVERY_STEPS.map((stepDef, i) => {
                        const step = discoverySteps[i];
                        if (!step) return null;
                        const StepIcon = stepDef.icon;
                        return (
                          <motion.div
                            key={stepDef.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-colors ${
                              step.status === "running"
                                ? "bg-primary/5 border border-primary/20"
                                : step.status === "completed"
                                ? "bg-emerald-500/5"
                                : step.status === "failed"
                                ? "bg-destructive/5"
                                : "opacity-50"
                            }`}
                          >
                            <div className="shrink-0">{stepIcons[step.status]}</div>
                            <StepIcon className={`h-3.5 w-3.5 shrink-0 ${
                              step.status === "running" ? "text-primary" :
                              step.status === "completed" ? "text-emerald-400" :
                              step.status === "failed" ? "text-destructive" :
                              "text-muted-foreground"
                            }`} />
                            <div className="flex-1 min-w-0">
                              <span className={`text-xs font-medium ${
                                step.status === "running" ? "text-foreground" :
                                step.status === "completed" ? "text-emerald-400" :
                                step.status === "failed" ? "text-destructive" :
                                "text-muted-foreground"
                              }`}>
                                {stepDef.label}
                              </span>
                              {step.status === "running" && (
                                <p className="text-[10px] text-muted-foreground mt-0.5">{stepDef.description}</p>
                              )}
                              {step.status === "failed" && step.detail && (
                                <p className="text-[10px] text-destructive mt-0.5">{step.detail}</p>
                              )}
                            </div>
                            {step.status === "running" && (
                              <div className="flex gap-0.5">
                                {[0, 1, 2].map((d) => (
                                  <motion.div
                                    key={d}
                                    className="w-1 h-1 rounded-full bg-primary"
                                    animate={{ opacity: [0.3, 1, 0.3] }}
                                    transition={{ duration: 1, repeat: Infinity, delay: d * 0.2 }}
                                  />
                                ))}
                              </div>
                            )}
                          </motion.div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {[
              { label: "Total", value: stats.total, icon: Users },
              { label: "AI Suggested", value: stats.aiSuggested, icon: Sparkles },
              { label: "Engaging", value: stats.engaging, icon: MessageCircle },
              { label: "Partnered", value: stats.partnered, icon: UserPlus },
            ].map((s) => (
              <Card key={s.label} className="bg-card border-border">
                <CardContent className="p-4 flex items-center gap-3">
                  <s.icon className="h-4 w-4 text-primary shrink-0" />
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{s.label}</p>
                    <p className="text-sm font-bold text-foreground">{s.value}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Filters */}
          <div className="flex gap-2 flex-wrap mb-4">
            {["All", ...STATUSES].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors capitalize ${
                  statusFilter === s
                    ? "bg-primary/20 text-primary border-primary/40"
                    : "bg-transparent text-muted-foreground border-border hover:text-foreground"
                }`}
              >
                {s.replace(/_/g, " ")}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Dream 100..."
              className="pl-9 h-9 text-xs"
            />
          </div>

          {/* List */}
          <Card className="bg-card border-border">
            <CardContent className="p-0">
              {loading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-12">
                  <Star className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm font-medium text-foreground mb-1">Your Dream 100 is empty</p>
                  <p className="text-xs text-muted-foreground mb-4">Add manually or hit AI Discover to find niche influencers automatically.</p>
                  <div className="flex items-center justify-center gap-2">
                    <Button size="sm" variant="outline" onClick={runDiscovery} disabled={discovering}>
                      <Sparkles className="h-3 w-3 mr-1" /> AI Discover
                    </Button>
                    <Button size="sm" onClick={() => setAddOpen(true)}>
                      <Plus className="h-3 w-3 mr-1" /> Add Manually
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {filtered.map((entry) => (
                    <motion.div
                      key={entry.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="p-4 hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0 space-y-1.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-muted-foreground">
                              {PLATFORM_ICONS[entry.platform] || PLATFORM_ICONS.default}
                            </span>
                            <span className="text-sm font-semibold text-foreground truncate">{entry.name}</span>
                            {entry.ai_suggested && (
                              <Badge variant="outline" className="text-[10px] bg-accent/10 text-accent-foreground border-accent/30">
                                <Sparkles className="h-2.5 w-2.5 mr-0.5" /> AI
                              </Badge>
                            )}
                            <Select value={entry.status} onValueChange={(v) => updateEntry(entry.id, { status: v })}>
                              <SelectTrigger className="h-5 text-[10px] w-auto border-0 p-0 gap-0">
                                <Badge variant="outline" className={`text-[10px] capitalize ${STATUS_COLORS[entry.status] || ""}`}>
                                  {entry.status.replace(/_/g, " ")}
                                </Badge>
                              </SelectTrigger>
                              <SelectContent>
                                {STATUSES.map((s) => (
                                  <SelectItem key={s} value={s} className="text-xs capitalize">{s.replace(/_/g, " ")}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex items-center gap-4 flex-wrap text-[11px] text-muted-foreground">
                            {entry.niche && <span className="capitalize">{entry.niche}</span>}
                            <span className="capitalize">{entry.platform}</span>
                            <span>{formatFollowers(entry.followers_estimate)} followers</span>
                            <Select value={entry.outreach_status} onValueChange={(v) => updateEntry(entry.id, { outreach_status: v })}>
                              <SelectTrigger className="h-4 text-[10px] w-auto border-0 p-0 gap-0">
                                <Badge variant="outline" className={`text-[9px] capitalize ${OUTREACH_COLORS[entry.outreach_status] || ""}`}>
                                  {entry.outreach_status.replace(/_/g, " ")}
                                </Badge>
                              </SelectTrigger>
                              <SelectContent>
                                {OUTREACH_STATUSES.map((s) => (
                                  <SelectItem key={s} value={s} className="text-xs capitalize">{s.replace(/_/g, " ")}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          {entry.notes && <p className="text-[11px] text-muted-foreground line-clamp-1">{entry.notes}</p>}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {entry.url && (
                            <a href={entry.url} target="_blank" rel="noopener noreferrer" className="p-1.5 text-muted-foreground hover:text-foreground transition-colors">
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          )}
                          <button onClick={() => deleteEntry(entry.id)} className="p-1.5 text-muted-foreground hover:text-destructive transition-colors">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />

      {/* Add Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base">Add to Dream 100</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Name *</Label>
              <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Influencer / Partner name" className="h-9 text-xs" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Platform</Label>
                <Select value={formPlatform} onValueChange={setFormPlatform}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PLATFORMS.map((p) => (
                      <SelectItem key={p} value={p} className="text-xs capitalize">{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Est. Followers</Label>
                <Input value={formFollowers} onChange={(e) => setFormFollowers(e.target.value)} placeholder="10000" type="number" className="h-9 text-xs" />
              </div>
            </div>
            <div>
              <Label className="text-xs">Profile URL</Label>
              <Input value={formUrl} onChange={(e) => setFormUrl(e.target.value)} placeholder="https://..." className="h-9 text-xs" />
            </div>
            <div>
              <Label className="text-xs">Niche</Label>
              <Input value={formNiche} onChange={(e) => setFormNiche(e.target.value)} placeholder="fitness, real estate..." className="h-9 text-xs" />
            </div>
            <div>
              <Label className="text-xs">Notes</Label>
              <Textarea value={formNotes} onChange={(e) => setFormNotes(e.target.value)} placeholder="Why this person?" className="text-xs min-h-[60px]" />
            </div>
            <Button onClick={handleAdd} disabled={saving || !formName.trim()} className="w-full">
              {saving ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Plus className="h-3 w-3 mr-1" />}
              Add to List
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
