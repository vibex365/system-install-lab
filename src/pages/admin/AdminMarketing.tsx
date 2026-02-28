import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Copy, BarChart3, Users, MousePointerClick, BookOpen, Loader2, Sparkles, Cpu, Scale, Dumbbell, Home, Stethoscope, Facebook } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const FUNNEL_URL = "https://peoplefailsystemswork.com/intake-funnel";
const MAGAZINE_URL = "https://peoplefailsystemswork.com/magazine/inside";
const ELYT_DEMO_URL = "https://peoplefailsystemswork.com/elyt-demo";
const SYSTEM_MAG_URL = "https://peoplefailsystemswork.com/magazine/system";
const GROUP_QUIZ_URL = "https://peoplefailsystemswork.com/systems-quiz";
const FB_GROUP_URL = "https://www.facebook.com/share/g/18ewsZUu7t/?mibextid=wwXIfr";
const DOMAIN = "https://peoplefailsystemswork.com";

const NICHE_MAGS = [
  { slug: "lawyers", label: "Law Firms", icon: Scale, color: "text-blue-400", blurb: "Client intake automation — qualify, book, retain." },
  { slug: "fitness", label: "Fitness / Gyms", icon: Dumbbell, color: "text-green-400", blurb: "Trial bookings + member conversion on autopilot." },
  { slug: "real-estate", label: "Real Estate", icon: Home, color: "text-amber-400", blurb: "Showings, valuations, and closings — automated pipeline." },
  { slug: "dentists", label: "Dental Practices", icon: Stethoscope, color: "text-cyan-400", blurb: "Fill every chair with AI-driven patient acquisition." },
];

export default function AdminMarketing() {
  const { toast } = useToast();
  const [stats, setStats] = useState<{ leads: number; avgScore: string; conversions: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const [leadsRes, applicationsRes] = await Promise.all([
        supabase.from("funnel_leads").select("score", { count: "exact" }),
        supabase.from("applications").select("id", { count: "exact" }),
      ]);

      const leads = leadsRes.count || 0;
      const scores = (leadsRes.data || []).map((l: any) => l.score).filter((s: any) => s != null);
      const avgScore = scores.length > 0
        ? (scores.reduce((a: number, b: number) => a + b, 0) / scores.length).toFixed(1)
        : "—";
      const conversions = applicationsRes.count || 0;

      setStats({ leads, avgScore, conversions });
    } catch {
      setStats({ leads: 0, avgScore: "—", conversions: 0 });
    }
    setLoading(false);
  };

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast({ title: "URL copied to clipboard" });
  };

  return (
    <AdminShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-foreground">Marketing</h1>
          <p className="text-sm text-muted-foreground">Funnels, ads, and growth assets.</p>
        </div>

        {/* Intake Funnel Card */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <MousePointerClick className="h-4 w-4 text-primary" />
              Intake Funnel — "Are You Building Funnels The Hard Way?"
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Interactive quiz funnel for social media ads. Prospects take a 6-question quiz, get a Funnel Efficiency Score, and are prompted to apply.
            </p>

            <div className="flex items-center gap-2 bg-secondary rounded-lg px-3 py-2">
              <code className="text-xs text-foreground flex-1 truncate">{FUNNEL_URL}</code>
              <Button size="sm" variant="ghost" onClick={() => copyUrl(FUNNEL_URL)} className="shrink-0">
                <Copy className="h-3.5 w-3.5" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => window.open("/intake-funnel", "_blank")}
                className="shrink-0"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {loading ? (
                <div className="col-span-3 flex items-center justify-center py-4">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <>
                  <MiniStat icon={Users} label="Leads Captured" value={String(stats?.leads || 0)} sub="from quiz funnel" />
                  <MiniStat icon={BarChart3} label="Avg Score" value={stats?.avgScore || "—"} sub="funnel score" />
                  <MiniStat icon={MousePointerClick} label="Applications" value={String(stats?.conversions || 0)} sub="quiz → apply" />
                </>
              )}
            </div>

            <div className="border-t border-border pt-4">
              <h4 className="text-xs font-semibold text-foreground mb-2">Ad Copy Suggestions</h4>
              <div className="space-y-2 text-xs text-muted-foreground">
                <p>🎯 <strong>Hook:</strong> "Most agencies spend 10+ hours building a single funnel. We do it in minutes."</p>
                <p>📊 <strong>Body:</strong> "Take the 2-minute Funnel Efficiency Quiz and find out if your process is costing you clients."</p>
                <p>🔗 <strong>CTA:</strong> "Take the Quiz → {FUNNEL_URL}"</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* FB Group Quiz Funnel Card */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Facebook className="h-4 w-4 text-primary" />
              FB Group Funnel — "Your Fake Guru Mentor Lied"
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              5-question Systems Readiness Quiz promoting Dale Payne-Sizer. Drives completions into the free Facebook group. Use as the primary top-of-funnel for social ads and organic posts.
            </p>

            <div className="flex items-center gap-2 bg-secondary rounded-lg px-3 py-2">
              <code className="text-xs text-foreground flex-1 truncate">{GROUP_QUIZ_URL}</code>
              <Button size="sm" variant="ghost" onClick={() => copyUrl(GROUP_QUIZ_URL)} className="shrink-0">
                <Copy className="h-3.5 w-3.5" />
              </Button>
              <Button size="sm" variant="ghost" onClick={() => window.open("/systems-quiz", "_blank")} className="shrink-0">
                <ExternalLink className="h-3.5 w-3.5" />
              </Button>
            </div>

            <div className="flex items-center gap-2 bg-secondary rounded-lg px-3 py-2">
              <code className="text-xs text-foreground flex-1 truncate">{FB_GROUP_URL}</code>
              <Button size="sm" variant="ghost" onClick={() => copyUrl(FB_GROUP_URL)} className="shrink-0">
                <Copy className="h-3.5 w-3.5" />
              </Button>
              <Button size="sm" variant="ghost" onClick={() => window.open(FB_GROUP_URL, "_blank")} className="shrink-0">
                <ExternalLink className="h-3.5 w-3.5" />
              </Button>
            </div>

            <div className="border-t border-border pt-4">
              <h4 className="text-xs font-semibold text-foreground mb-2">Distribution Playbook</h4>
              <div className="space-y-2 text-xs text-muted-foreground">
                <p>🎯 <strong>FB Ad Hook:</strong> "Your fake guru mentor lied. People fail. Systems work. Take the 60-second quiz →"</p>
                <p>📲 <strong>Organic post:</strong> Share the quiz link in comments, DMs, and stories — the hero image is designed to stop the scroll</p>
                <p>💬 <strong>Group welcome:</strong> Pin the quiz in the FB group as the first thing new members see</p>
                <p>🔁 <strong>Retarget:</strong> Anyone who completes the quiz but doesn't join → retarget with the "Inside the Machine" magazine</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ELYT System Demo Funnel Card */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              ELYT System Demo — "Is Your Follow-Up Costing You Sign-Ups?"
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Quiz funnel for ELYT travel members. Qualifies them on lead gen, follow-up, and automation readiness — then routes to SMS callback for a live AI demo.
            </p>

            <div className="flex items-center gap-2 bg-secondary rounded-lg px-3 py-2">
              <code className="text-xs text-foreground flex-1 truncate">{ELYT_DEMO_URL}</code>
              <Button size="sm" variant="ghost" onClick={() => copyUrl(ELYT_DEMO_URL)} className="shrink-0">
                <Copy className="h-3.5 w-3.5" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => window.open("/elyt-demo", "_blank")}
                className="shrink-0"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </Button>
            </div>

            <div className="border-t border-border pt-4">
              <h4 className="text-xs font-semibold text-foreground mb-2">How to Use</h4>
              <div className="space-y-2 text-xs text-muted-foreground">
                <p>📲 <strong>Group blast:</strong> Send to all ELYT members — "Take this 2-min quiz to see how AI can automate your travel biz"</p>
                <p>💬 <strong>1-on-1:</strong> "Hey, I built something for us — check your score:" + paste URL</p>
                <p>📱 <strong>After quiz:</strong> They get a callback number → AI walks them through results → sells the system</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Magazine Card */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" />
              Magazine — The Prompt Engineer's Field Manual
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Free content asset with leaked AI system prompts & prompt engineering frameworks. Drives readers into the quiz funnel at the end.
            </p>

            <div className="flex items-center gap-2 bg-secondary rounded-lg px-3 py-2">
              <code className="text-xs text-foreground flex-1 truncate">{MAGAZINE_URL}</code>
              <Button size="sm" variant="ghost" onClick={() => copyUrl(MAGAZINE_URL)} className="shrink-0">
                <Copy className="h-3.5 w-3.5" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => window.open("/magazine/inside", "_blank")}
                className="shrink-0"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </Button>
            </div>

            <div className="border-t border-border pt-4">
              <h4 className="text-xs font-semibold text-foreground mb-2">How to Use</h4>
              <div className="space-y-2 text-xs text-muted-foreground">
                <p>📧 <strong>Pre-call:</strong> "Before our call, I put together something for you —" + paste URL</p>
                <p>📲 <strong>Social:</strong> Share as free value content → drives to quiz funnel at the end</p>
                <p>🔗 <strong>Lead magnet:</strong> Use in ads as a free guide → captures leads via quiz CTA</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* System Magazine Card */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Cpu className="h-4 w-4 text-primary" />
              Magazine — Inside the Machine (System Breakdown)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Technical hype magazine explaining how the PFSW system works — AI agents, workflow chains, voice system, CRM pipeline. No tech stack reveals. Drives readers into the ELYT demo quiz at the end.
            </p>

            <div className="flex items-center gap-2 bg-secondary rounded-lg px-3 py-2">
              <code className="text-xs text-foreground flex-1 truncate">{SYSTEM_MAG_URL}</code>
              <Button size="sm" variant="ghost" onClick={() => copyUrl(SYSTEM_MAG_URL)} className="shrink-0">
                <Copy className="h-3.5 w-3.5" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => window.open("/magazine/system", "_blank")}
                className="shrink-0"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </Button>
            </div>

            <div className="border-t border-border pt-4">
              <h4 className="text-xs font-semibold text-foreground mb-2">How to Use</h4>
              <div className="space-y-2 text-xs text-muted-foreground">
                <p>📲 <strong>ELYT group blast:</strong> "Want to see exactly how our AI system works? Read this 5-min breakdown:" + paste URL</p>
                <p>💬 <strong>1-on-1 DM:</strong> "Before our call, check this out — it shows how everything connects:" + paste URL</p>
                <p>🎯 <strong>After quiz:</strong> Send as a follow-up to ELYT demo quiz completions to build conviction</p>
              </div>
            </div>
          </CardContent>
        </Card>
        {/* ─── NICHE MAGAZINES ─── */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Niche Marketing Magazines — Before/After Case Studies
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Niche-targeted editorial pages showing how PFSW transforms each vertical. Before/after format with agent stack breakdown. Share directly with prospects.
            </p>

            <div className="space-y-3">
              {NICHE_MAGS.map((nm) => (
                <div key={nm.slug} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-secondary/30">
                  <nm.icon className={`h-5 w-5 shrink-0 ${nm.color}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{nm.label}</p>
                    <p className="text-[11px] text-muted-foreground">{nm.blurb}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button size="sm" variant="ghost" onClick={() => copyUrl(`${DOMAIN}/for/${nm.slug}`)} className="h-7 w-7 p-0">
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => window.open(`/for/${nm.slug}`, "_blank")} className="h-7 w-7 p-0">
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-border pt-4">
              <h4 className="text-xs font-semibold text-foreground mb-2">How to Use</h4>
              <div className="space-y-2 text-xs text-muted-foreground">
                <p>💬 <strong>DM/SMS:</strong> "I put together a breakdown of how AI automation works for [niche] — check it out:" + paste link</p>
                <p>📧 <strong>Email outreach:</strong> Include in agent-generated emails as a case study link</p>
                <p>📲 <strong>Post-call follow-up:</strong> Send after a discovery call to reinforce the value prop</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  );
}

function MiniStat({ icon: Icon, label, value, sub }: { icon: any; label: string; value: string; sub: string }) {
  return (
    <div className="bg-secondary rounded-lg p-3 text-center">
      <Icon className="h-4 w-4 text-primary mx-auto mb-1" />
      <p className="text-lg font-bold text-foreground">{value}</p>
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p className="text-[9px] text-muted-foreground/60">{sub}</p>
    </div>
  );
}
