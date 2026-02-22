import { AdminShell } from "@/components/admin/AdminShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, Copy, BarChart3, Users, MousePointerClick, BookOpen } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const FUNNEL_URL = "https://peoplefailsystemswork.com/intake-funnel";
const MAGAZINE_URL = "https://peoplefailsystemswork.com/magazine/inside";

export default function AdminMarketing() {
  const { toast } = useToast();

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
              <MiniStat icon={Users} label="Leads Captured" value="—" sub="via waitlist table" />
              <MiniStat icon={BarChart3} label="Avg Score" value="—" sub="calculated" />
              <MiniStat icon={MousePointerClick} label="Conversion" value="—" sub="quiz → apply" />
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

        {/* Magazine Card */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" />
              Magazine — Authority & Lead Nurturing Asset
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Send this to prospects before the pitch call. Builds authority, demonstrates expertise, and warms leads before they ever talk to you.
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
                <p>📲 <strong>Follow-up:</strong> Send after a discovery call to reinforce credibility</p>
                <p>🔗 <strong>Social:</strong> Share as a content piece to attract inbound leads</p>
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
