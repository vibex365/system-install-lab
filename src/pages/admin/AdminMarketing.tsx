import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, Copy, BarChart3, Users, MousePointerClick, BookOpen, Loader2, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const FUNNEL_URL = "https://peoplefailsystemswork.com/intake-funnel";
const MAGAZINE_URL = "https://peoplefailsystemswork.com/magazine/inside";
const ELYT_DEMO_URL = "https://peoplefailsystemswork.com/elyt-demo";

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
