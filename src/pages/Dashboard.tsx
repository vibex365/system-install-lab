import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Zap, Rocket, Target, ArrowRight, Mail, Phone,
  MessageSquare, Search, BarChart3, Calendar, Users,
  TrendingUp, Clock, CheckCircle2, AlertCircle, Settings2,
} from "lucide-react";
import { motion } from "framer-motion";

const nicheOptions = [
  { value: "mlm", label: "Network Marketing / MLM" },
  { value: "affiliate", label: "Affiliate Marketing" },
  { value: "coaching", label: "Online Coaching" },
  { value: "ecommerce", label: "E-Commerce" },
  { value: "home_business", label: "Home Business" },
  { value: "dental", label: "Dental Practice" },
  { value: "restaurant", label: "Restaurant / Food Service" },
  { value: "realestate", label: "Real Estate" },
  { value: "fitness", label: "Fitness / Wellness" },
  { value: "agency", label: "Marketing Agency" },
  { value: "saas", label: "SaaS / Software" },
  { value: "other", label: "Other" },
];

export default function Dashboard() {
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [goal, setGoal] = useState("");
  const [launching, setLaunching] = useState(false);
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [leadCount, setLeadCount] = useState(0);
  const [bookingCount, setBookingCount] = useState(0);
  const [agentRunCount, setAgentRunCount] = useState(0);
  const [greeting, setGreeting] = useState("Good morning");

  // Niche onboarding state
  const [userNiche, setUserNiche] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<string | null>(null);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [editNiche, setEditNiche] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    const h = new Date().getHours();
    setGreeting(h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening");
  }, []);

  useEffect(() => {
    if (!loading && !user) navigate("/login", { replace: true });
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;

    // Fetch profile for niche/location
    supabase
      .from("profiles")
      .select("niche, target_location")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          setUserNiche((data as any).niche || null);
          setUserLocation((data as any).target_location || null);
          setEditNiche((data as any).niche || "");
          setEditLocation((data as any).target_location || "");
        }
        setProfileLoaded(true);
      });

    // Fetch workflows
    supabase
      .from("workflows")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(5)
      .then(({ data }) => { if (data) setWorkflows(data); });

    // Fetch lead count
    supabase
      .from("leads")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .then(({ count }) => { if (count != null) setLeadCount(count); });

    // Fetch booking count
    supabase
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .eq("host_user_id", user.id)
      .then(({ count }) => { if (count != null) setBookingCount(count); });

    // Fetch agent run count
    supabase
      .from("agent_runs")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .then(({ count }) => { if (count != null) setAgentRunCount(count); });
  }, [user]);

  const saveNicheProfile = async () => {
    if (!user || !editNiche) return;
    setSavingProfile(true);
    const { error } = await supabase
      .from("profiles")
      .update({ niche: editNiche, target_location: editLocation || null } as any)
      .eq("id", user.id);
    if (error) {
      toast({ title: "Failed to save", description: error.message, variant: "destructive" });
    } else {
      setUserNiche(editNiche);
      setUserLocation(editLocation || null);
      toast({ title: "Profile updated!", description: "Your niche and location are saved. Agents will use this context." });
    }
    setSavingProfile(false);
  };

  const nicheLabel = nicheOptions.find(n => n.value === userNiche)?.label || userNiche || "";

  const quickGoals = [
    { label: "Find Leads", icon: Search, goal: `Find 50 ${nicheLabel || "business"} leads${userLocation ? ` in ${userLocation}` : ""}` },
    { label: "Book Calls", icon: Phone, goal: `Call my top 20 qualified ${nicheLabel || ""} leads and book discovery calls` },
    { label: "Email Campaign", icon: Mail, goal: `Send a 3-part email sequence to my uncontacted ${nicheLabel || ""} leads` },
    { label: "SMS Follow-up", icon: MessageSquare, goal: `Send SMS follow-ups to ${nicheLabel || ""} leads who haven't responded to email` },
    { label: "Build Funnel", icon: Target, goal: `Build a quiz funnel for ${nicheLabel || "my business"} that captures leads and books calls` },
    { label: "Competitor Intel", icon: BarChart3, goal: `Research my top 5 ${nicheLabel || ""} competitors${userLocation ? ` in ${userLocation}` : ""} and find positioning gaps` },
  ];

  const launchWorkflow = async (goalText: string) => {
    if (!goalText.trim() || !user) return;
    setLaunching(true);
    try {
      const { data, error } = await supabase.functions.invoke("orchestrator", {
        body: { goal: goalText.trim() },
      });
      if (error) throw error;
      toast({ title: "Workflow launched!", description: "Your agents are working on it." });
      if (data?.workflow_id) {
        navigate(`/dashboard/workflows/${data.workflow_id}`);
      }
    } catch (err: any) {
      toast({ title: "Failed to launch", description: err.message, variant: "destructive" });
    } finally {
      setLaunching(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  const needsOnboarding = profileLoaded && !userNiche;

  const statusConfig: Record<string, { color: string; icon: typeof Zap; bg: string }> = {
    planning: { color: "text-primary", icon: Clock, bg: "bg-primary/10" },
    running: { color: "text-emerald-400", icon: Zap, bg: "bg-emerald-400/10" },
    completed: { color: "text-emerald-400", icon: CheckCircle2, bg: "bg-emerald-400/10" },
    paused: { color: "text-yellow-400", icon: AlertCircle, bg: "bg-yellow-400/10" },
    failed: { color: "text-destructive", icon: AlertCircle, bg: "bg-destructive/10" },
  };

  const statCards = [
    { label: "Total Leads", value: leadCount, icon: Users, trend: null, color: "from-primary/15 to-primary/5" },
    { label: "Calls Booked", value: bookingCount, icon: Calendar, trend: null, color: "from-accent/15 to-accent/5" },
    { label: "Agent Runs", value: agentRunCount, icon: Zap, trend: null, color: "from-emerald-500/15 to-emerald-500/5" },
    { label: "Active Workflows", value: workflows.filter(w => w.status === "running").length, icon: TrendingUp, trend: null, color: "from-yellow-500/15 to-yellow-500/5" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-20">
        <div className="container max-w-6xl">

          {/* ─── Header ─── */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-1">
              {greeting}, {user.email?.split("@")[0]}
            </h1>
            <p className="text-sm text-muted-foreground">
              {userNiche ? (
                <>
                  <span className="text-primary font-medium">{nicheLabel}</span>
                  {userLocation && <> · <span>{userLocation}</span></>}
                  {" · "}
                  <button onClick={() => { setEditNiche(userNiche || ""); setEditLocation(userLocation || ""); setUserNiche(null); }} className="text-primary/70 hover:text-primary underline text-xs">
                    Change
                  </button>
                </>
              ) : (
                "Set up your niche to get started."
              )}
            </p>
          </motion.div>

          {/* ─── Niche Onboarding Card ─── */}
          {needsOnboarding && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <Card className="border-primary/30 bg-primary/5">
                <CardContent className="p-6 md:p-8">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Settings2 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-foreground">Set Up Your Business Profile</h2>
                      <p className="text-xs text-muted-foreground">This helps our AI agents find the right leads, build relevant funnels, and personalize outreach for your niche.</p>
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4 mb-5">
                    <div>
                      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Your Niche / Industry</Label>
                      <Select value={editNiche} onValueChange={setEditNiche}>
                        <SelectTrigger className="mt-1.5">
                          <SelectValue placeholder="Select your niche..." />
                        </SelectTrigger>
                        <SelectContent>
                          {nicheOptions.map((n) => (
                            <SelectItem key={n.value} value={n.value}>{n.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Target Location (optional)</Label>
                      <Input
                        value={editLocation}
                        onChange={(e) => setEditLocation(e.target.value)}
                        placeholder="e.g. Fort Lauderdale, FL"
                        className="mt-1.5"
                      />
                    </div>
                  </div>

                  <Button
                    onClick={saveNicheProfile}
                    disabled={!editNiche || savingProfile}
                    className="gold-glow-strong"
                  >
                    {savingProfile ? "Saving..." : "Save & Continue"}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* ─── Stats Grid ─── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {statCards.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="bg-card border-border hover:border-primary/20 transition-colors overflow-hidden">
                  <CardContent className="p-5 relative">
                    <div className={`absolute inset-0 bg-gradient-to-br ${s.color} opacity-50`} />
                    <div className="relative">
                      <div className="flex items-center justify-between mb-3">
                        <div className="h-9 w-9 rounded-xl bg-background/80 flex items-center justify-center">
                          <s.icon className="h-4 w-4 text-primary" />
                        </div>
                      </div>
                      <p className="text-3xl font-black text-foreground">{s.value}</p>
                      <p className="text-[11px] text-muted-foreground mt-1 uppercase tracking-wider font-medium">{s.label}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <div className="grid lg:grid-cols-5 gap-6">
            {/* ─── Goal Input (left 3 cols) ─── */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="lg:col-span-3"
            >
              <Card className="bg-card border-border overflow-hidden h-full">
                <CardContent className="p-6 md:p-8 flex flex-col h-full">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Rocket className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-foreground">Launch a Workflow</h2>
                      <p className="text-xs text-muted-foreground">Describe a goal. AI agents handle the rest.</p>
                    </div>
                  </div>

                  <Textarea
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                    placeholder={userNiche
                      ? `Find ${nicheLabel} leads${userLocation ? ` in ${userLocation}` : ""}, qualify them, and start outreach...`
                      : "Set your niche above first, then describe a goal..."
                    }
                    className="min-h-[100px] bg-background border-border resize-none text-sm flex-shrink-0 mb-4"
                  />

                  <div className="flex flex-wrap gap-2 mb-5">
                    {quickGoals.map((qg) => (
                      <button
                        key={qg.label}
                        onClick={() => setGoal(qg.goal)}
                        className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-xs text-muted-foreground hover:border-primary/30 hover:text-foreground transition-all"
                      >
                        <qg.icon className="h-3 w-3" />
                        {qg.label}
                      </button>
                    ))}
                  </div>

                  <Button
                    onClick={() => launchWorkflow(goal)}
                    disabled={!goal.trim() || launching}
                    className="w-full gold-glow-strong mt-auto"
                    size="lg"
                  >
                    {launching ? (
                      <>
                        <div className="h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2" />
                        Launching...
                      </>
                    ) : (
                      <>
                        <Rocket className="h-4 w-4 mr-2" />
                        Launch Workflow
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            {/* ─── Recent Workflows (right 2 cols) ─── */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="lg:col-span-2"
            >
              <Card className="bg-card border-border h-full">
                <CardContent className="p-6 flex flex-col h-full">
                  <div className="flex items-center justify-between mb-5">
                    <h2 className="text-lg font-bold text-foreground">Recent Workflows</h2>
                    <Button asChild variant="ghost" size="sm" className="text-primary text-xs">
                      <Link to="/dashboard/workflows">View All <ArrowRight className="h-3 w-3 ml-1" /></Link>
                    </Button>
                  </div>

                  {workflows.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
                      <div className="h-12 w-12 rounded-2xl bg-muted flex items-center justify-center mb-3">
                        <Zap className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <p className="text-sm text-muted-foreground">No workflows yet.</p>
                      <p className="text-xs text-muted-foreground/60 mt-1">Describe a goal to get started.</p>
                    </div>
                  ) : (
                    <div className="space-y-2 flex-1 overflow-y-auto">
                      {workflows.map((w) => {
                        const cfg = statusConfig[w.status] || statusConfig.planning;
                        const StatusIcon = cfg.icon;
                        return (
                          <Link
                            key={w.id}
                            to={`/dashboard/workflows/${w.id}`}
                            className="group flex items-start gap-3 rounded-xl border border-border bg-background p-4 hover:border-primary/30 transition-all"
                          >
                            <div className={`h-8 w-8 rounded-lg ${cfg.bg} flex items-center justify-center shrink-0 mt-0.5`}>
                              <StatusIcon className={`h-4 w-4 ${cfg.color}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                                {w.goal}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className={`text-[10px] font-semibold uppercase tracking-wider ${cfg.color}`}>
                                  {w.status}
                                </span>
                                <span className="text-[10px] text-muted-foreground">
                                  · {new Date(w.created_at).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                            <ArrowRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-primary shrink-0 mt-1 transition-colors" />
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* ─── Quick Links ─── */}
          <motion.div
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {[
              { label: "Quiz Funnels", to: "/funnels", icon: Target, desc: "Build & manage funnels" },
              { label: "CRM Pipeline", to: "/crm", icon: Users, desc: "Manage your leads" },
              { label: "Agents", to: "/agents", icon: Zap, desc: "View agent catalog" },
              { label: "Calendar", to: "/calendar", icon: Calendar, desc: "Upcoming calls" },
              { label: "Analytics", to: "/analytics", icon: BarChart3, desc: "Performance data" },
            ].map((link) => (
              <Link
                key={link.label}
                to={link.to}
                className="group rounded-2xl border border-border bg-card p-5 hover:border-primary/30 hover:gold-glow transition-all"
              >
                <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
                  <link.icon className="h-4 w-4 text-primary" />
                </div>
                <p className="text-sm font-semibold text-foreground">{link.label}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{link.desc}</p>
              </Link>
            ))}
          </motion.div>

        </div>
      </main>
      <Footer />
    </div>
  );
}
