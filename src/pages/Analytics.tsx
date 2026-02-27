import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { AuthGate } from "@/components/AuthGate";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  FunnelChart, Funnel, LabelList, Cell,
  PieChart, Pie, LineChart, Line, Area, AreaChart,
} from "recharts";
import {
  TrendingUp, Users, CalendarCheck, Bot, Zap, ArrowUpRight, ArrowDownRight,
  Target, BarChart3,
} from "lucide-react";

const FUNNEL_COLORS = [
  "hsl(217, 91%, 60%)",   // primary
  "hsl(263, 70%, 50%)",   // accent
  "hsl(190, 70%, 50%)",   // cyan
  "hsl(150, 60%, 45%)",   // emerald
  "hsl(45, 90%, 55%)",    // amber
  "hsl(340, 70%, 55%)",   // rose
];

const PIE_COLORS = [
  "hsl(217, 91%, 60%)",
  "hsl(263, 70%, 50%)",
  "hsl(150, 60%, 45%)",
  "hsl(45, 90%, 55%)",
  "hsl(340, 70%, 55%)",
  "hsl(190, 70%, 50%)",
];

interface AgentPerf {
  name: string;
  runs: number;
  completed: number;
  failed: number;
  successRate: number;
}

export default function Analytics() {
  return (
    <AuthGate requireActive>
      <AnalyticsContent />
    </AuthGate>
  );
}

function AnalyticsContent() {
  const { user } = useAuth();
  const [leads, setLeads] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [agentRuns, setAgentRuns] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase.from("leads").select("id, pipeline_status, created_at, source, category").eq("user_id", user.id),
      supabase.from("bookings").select("id, scheduled_at, status, created_at").eq("host_user_id", user.id),
      supabase.from("agent_runs").select("id, agent_id, status, triggered_at").eq("user_id", user.id),
      supabase.from("agents").select("id, name, slug"),
    ]).then(([ld, bk, ar, ag]) => {
      if (ld.data) setLeads(ld.data);
      if (bk.data) setBookings(bk.data);
      if (ar.data) setAgentRuns(ar.data);
      if (ag.data) setAgents(ag.data);
      setLoading(false);
    });
  }, [user]);

  // Pipeline funnel
  const funnelData = useMemo(() => {
    const stages = ["scraped", "qualified", "contacted", "sms_sent", "booked", "converted"];
    const counts: Record<string, number> = {};
    leads.forEach((l) => {
      const idx = stages.indexOf(l.pipeline_status);
      // Count lead in its stage AND all prior stages (cumulative funnel)
      if (idx >= 0) {
        for (let i = 0; i <= idx; i++) {
          counts[stages[i]] = (counts[stages[i]] || 0) + 1;
        }
      } else {
        // Non-standard status — count in scraped
        counts["scraped"] = (counts["scraped"] || 0) + 1;
      }
    });
    return stages.map((s) => ({
      name: s.replace(/_/g, " "),
      value: counts[s] || 0,
    }));
  }, [leads]);

  // Conversion rates
  const conversionRates = useMemo(() => {
    if (funnelData.length < 2) return [];
    return funnelData.slice(1).map((stage, i) => ({
      name: stage.name,
      rate: funnelData[i].value > 0
        ? Math.round((stage.value / funnelData[i].value) * 100)
        : 0,
    }));
  }, [funnelData]);

  // Agent performance
  const agentPerf = useMemo<AgentPerf[]>(() => {
    const agentMap = new Map(agents.map((a) => [a.id, a.name]));
    const perf: Record<string, { runs: number; completed: number; failed: number }> = {};
    agentRuns.forEach((r) => {
      const name = agentMap.get(r.agent_id) || "Unknown";
      if (!perf[name]) perf[name] = { runs: 0, completed: 0, failed: 0 };
      perf[name].runs++;
      if (r.status === "completed" || r.status === "success") perf[name].completed++;
      if (r.status === "failed" || r.status === "error") perf[name].failed++;
    });
    return Object.entries(perf).map(([name, d]) => ({
      name,
      ...d,
      successRate: d.runs > 0 ? Math.round((d.completed / d.runs) * 100) : 0,
    })).sort((a, b) => b.runs - a.runs);
  }, [agentRuns, agents]);

  // Bookings over time (last 30 days)
  const bookingTrend = useMemo(() => {
    const days: Record<string, number> = {};
    const now = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      days[d.toISOString().split("T")[0]] = 0;
    }
    bookings.forEach((b) => {
      const day = new Date(b.created_at).toISOString().split("T")[0];
      if (days[day] !== undefined) days[day]++;
    });
    return Object.entries(days).map(([date, count]) => ({
      date: new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      bookings: count,
    }));
  }, [bookings]);

  // Lead sources
  const sourceDist = useMemo(() => {
    const counts: Record<string, number> = {};
    leads.forEach((l) => {
      const src = l.source || "unknown";
      counts[src] = (counts[src] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [leads]);

  // KPI stats
  const totalLeads = leads.length;
  const totalBookings = bookings.length;
  const confirmedBookings = bookings.filter((b) => b.status === "confirmed").length;
  const bookingRate = totalLeads > 0 ? ((totalBookings / totalLeads) * 100).toFixed(1) : "0";
  const totalRuns = agentRuns.length;
  const avgSuccessRate = agentPerf.length > 0
    ? Math.round(agentPerf.reduce((s, a) => s + a.successRate, 0) / agentPerf.length)
    : 0;

  const customTooltipStyle = {
    backgroundColor: "hsl(240, 12%, 7%)",
    border: "1px solid hsl(240, 8%, 16%)",
    borderRadius: "8px",
    color: "hsl(240, 5%, 96%)",
    fontSize: "12px",
    padding: "8px 12px",
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-20 pb-20">
        <div className="container max-w-7xl">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Analytics
            </h1>
            <p className="text-xs text-muted-foreground mt-1">Pipeline performance, agent metrics, and booking trends</p>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
            {[
              { label: "Total Leads", value: totalLeads, icon: Users, color: "text-primary" },
              { label: "Bookings", value: totalBookings, sub: `${confirmedBookings} confirmed`, icon: CalendarCheck, color: "text-emerald-400" },
              { label: "Booking Rate", value: `${bookingRate}%`, icon: Target, color: "text-accent" },
              { label: "Agent Runs", value: totalRuns, sub: `${avgSuccessRate}% success`, icon: Bot, color: "text-primary" },
            ].map((kpi) => (
              <Card key={kpi.label} className="bg-card border-border">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <kpi.icon className={`h-4 w-4 ${kpi.color} shrink-0`} />
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{kpi.label}</span>
                  </div>
                  <p className="text-2xl font-bold text-foreground">{kpi.value}</p>
                  {kpi.sub && <p className="text-[10px] text-muted-foreground mt-0.5">{kpi.sub}</p>}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Row 1: Funnel + Conversion Rates */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
            {/* Pipeline Funnel */}
            <Card className="bg-card border-border">
              <CardHeader className="pb-2 pt-4 px-5">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  Pipeline Funnel
                </CardTitle>
              </CardHeader>
              <CardContent className="px-5 pb-4">
                {funnelData.every((d) => d.value === 0) ? (
                  <div className="py-12 text-center text-xs text-muted-foreground">No lead data yet</div>
                ) : (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={funnelData} layout="vertical" margin={{ left: 10, right: 20, top: 5, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(240, 8%, 16%)" horizontal={false} />
                      <XAxis type="number" tick={{ fill: "hsl(240, 5%, 74%)", fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis
                        dataKey="name"
                        type="category"
                        tick={{ fill: "hsl(240, 5%, 74%)", fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                        width={80}
                        className="capitalize"
                      />
                      <Tooltip contentStyle={customTooltipStyle} cursor={{ fill: "hsl(240, 8%, 12%)" }} />
                      <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={20}>
                        {funnelData.map((_, i) => (
                          <Cell key={i} fill={FUNNEL_COLORS[i % FUNNEL_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Conversion rates */}
            <Card className="bg-card border-border">
              <CardHeader className="pb-2 pt-4 px-5">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Zap className="h-4 w-4 text-accent" />
                  Stage Conversion Rates
                </CardTitle>
              </CardHeader>
              <CardContent className="px-5 pb-4">
                {conversionRates.length === 0 ? (
                  <div className="py-12 text-center text-xs text-muted-foreground">No data yet</div>
                ) : (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={conversionRates} margin={{ left: 0, right: 10, top: 5, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(240, 8%, 16%)" />
                      <XAxis dataKey="name" tick={{ fill: "hsl(240, 5%, 74%)", fontSize: 10 }} axisLine={false} tickLine={false} className="capitalize" />
                      <YAxis tick={{ fill: "hsl(240, 5%, 74%)", fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                      <Tooltip contentStyle={customTooltipStyle} formatter={(val: number) => [`${val}%`, "Rate"]} cursor={{ fill: "hsl(240, 8%, 12%)" }} />
                      <Bar dataKey="rate" fill="hsl(263, 70%, 50%)" radius={[6, 6, 0, 0]} barSize={32} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Row 2: Booking trend + Agent performance */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
            {/* Booking trend */}
            <Card className="bg-card border-border">
              <CardHeader className="pb-2 pt-4 px-5">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <CalendarCheck className="h-4 w-4 text-emerald-400" />
                  Bookings (30 days)
                </CardTitle>
              </CardHeader>
              <CardContent className="px-5 pb-4">
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={bookingTrend} margin={{ left: 0, right: 10, top: 5, bottom: 5 }}>
                    <defs>
                      <linearGradient id="bookingGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(150, 60%, 45%)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(150, 60%, 45%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(240, 8%, 16%)" />
                    <XAxis dataKey="date" tick={{ fill: "hsl(240, 5%, 74%)", fontSize: 9 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                    <YAxis tick={{ fill: "hsl(240, 5%, 74%)", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip contentStyle={customTooltipStyle} />
                    <Area type="monotone" dataKey="bookings" stroke="hsl(150, 60%, 45%)" fillOpacity={1} fill="url(#bookingGrad)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Agent performance */}
            <Card className="bg-card border-border">
              <CardHeader className="pb-2 pt-4 px-5">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Bot className="h-4 w-4 text-primary" />
                  Agent Performance
                </CardTitle>
              </CardHeader>
              <CardContent className="px-5 pb-4">
                {agentPerf.length === 0 ? (
                  <div className="py-12 text-center text-xs text-muted-foreground">No agent runs yet</div>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={agentPerf} margin={{ left: 0, right: 10, top: 5, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(240, 8%, 16%)" />
                      <XAxis dataKey="name" tick={{ fill: "hsl(240, 5%, 74%)", fontSize: 9 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: "hsl(240, 5%, 74%)", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                      <Tooltip contentStyle={customTooltipStyle} />
                      <Bar dataKey="completed" stackId="a" fill="hsl(150, 60%, 45%)" radius={[0, 0, 0, 0]} barSize={24} name="Completed" />
                      <Bar dataKey="failed" stackId="a" fill="hsl(0, 84%, 60%)" radius={[6, 6, 0, 0]} barSize={24} name="Failed" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Row 3: Lead sources + Agent success table */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Lead sources */}
            <Card className="bg-card border-border">
              <CardHeader className="pb-2 pt-4 px-5">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  Lead Sources
                </CardTitle>
              </CardHeader>
              <CardContent className="px-5 pb-4">
                {sourceDist.length === 0 ? (
                  <div className="py-12 text-center text-xs text-muted-foreground">No data yet</div>
                ) : (
                  <div className="flex items-center gap-6">
                    <ResponsiveContainer width={160} height={160}>
                      <PieChart>
                        <Pie
                          data={sourceDist}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={70}
                          paddingAngle={3}
                          strokeWidth={0}
                        >
                          {sourceDist.map((_, i) => (
                            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={customTooltipStyle} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex-1 space-y-2">
                      {sourceDist.slice(0, 6).map((s, i) => (
                        <div key={s.name} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                            <span className="text-muted-foreground capitalize">{s.name.replace(/_/g, " ")}</span>
                          </div>
                          <span className="font-semibold text-foreground">{s.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Agent success rates table */}
            <Card className="bg-card border-border">
              <CardHeader className="pb-2 pt-4 px-5">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Zap className="h-4 w-4 text-accent" />
                  Agent Success Rates
                </CardTitle>
              </CardHeader>
              <CardContent className="px-5 pb-4">
                {agentPerf.length === 0 ? (
                  <div className="py-12 text-center text-xs text-muted-foreground">No agent data yet</div>
                ) : (
                  <div className="space-y-3">
                    {agentPerf.map((agent) => (
                      <div key={agent.name} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-foreground font-medium truncate">{agent.name}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">{agent.runs} runs</span>
                            <Badge
                              variant="outline"
                              className={`text-[10px] ${
                                agent.successRate >= 80
                                  ? "text-emerald-400 border-emerald-500/30"
                                  : agent.successRate >= 50
                                  ? "text-amber-400 border-amber-500/30"
                                  : "text-destructive border-destructive/30"
                              }`}
                            >
                              {agent.successRate}%
                            </Badge>
                          </div>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${agent.successRate}%`,
                              background: agent.successRate >= 80
                                ? "hsl(150, 60%, 45%)"
                                : agent.successRate >= 50
                                ? "hsl(45, 90%, 55%)"
                                : "hsl(0, 84%, 60%)",
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
