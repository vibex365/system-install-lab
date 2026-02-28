import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { AuthGate } from "@/components/AuthGate";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Users, Link2, Copy, Loader2, TrendingUp, Download, FileText, Image, Mail } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

interface AffiliateInfo {
  id: string;
  referral_code: string;
  commission_percent: number;
  status: string;
  total_earned: number;
  total_referrals: number;
  created_at: string;
}

interface Referral {
  id: string;
  referred_email: string;
  commission_amount: number;
  status: string;
  created_at: string;
}

export default function AffiliateDashboard() {
  return (
    <AuthGate>
      <AffiliateDashboardContent />
    </AuthGate>
  );
}

function AffiliateDashboardContent() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [affiliate, setAffiliate] = useState<AffiliateInfo | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);

    const { data: aff } = await supabase
      .from("affiliate_program")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (aff) {
      setAffiliate(aff as AffiliateInfo);

      const { data: refs } = await supabase
        .from("affiliate_referrals")
        .select("*")
        .eq("affiliate_id", aff.id)
        .order("created_at", { ascending: false });

      setReferrals((refs as Referral[]) || []);
    }
    setLoading(false);
  };

  const copyLink = () => {
    if (!affiliate) return;
    navigator.clipboard.writeText(`https://peoplefailsystemswork.com/?ref=${affiliate.referral_code}`);
    toast({ title: "Referral link copied!" });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-20 pb-20 flex justify-center items-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </main>
      </div>
    );
  }

  if (!affiliate) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-20 pb-20">
          <div className="container max-w-2xl text-center py-20">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-xl font-bold text-foreground mb-2">Affiliate Program</h1>
            <p className="text-sm text-muted-foreground">
              This program is invite-only. If you've been invited, make sure you're logged in with the same email.
            </p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const referralLink = `https://peoplefailsystemswork.com/?ref=${affiliate.referral_code}`;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-20 pb-20">
        <div className="container max-w-4xl">
          <div className="mb-6">
            <h1 className="text-xl font-bold text-foreground">Your Affiliate Dashboard</h1>
            <p className="text-xs text-muted-foreground">Track your referrals and earnings</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {[
              { label: "Commission", value: `${affiliate.commission_percent}%`, icon: DollarSign },
              { label: "Total Referrals", value: affiliate.total_referrals, icon: Users },
              { label: "Total Earned", value: `$${Number(affiliate.total_earned).toFixed(0)}`, icon: TrendingUp },
              { label: "Status", value: affiliate.status, icon: Link2 },
            ].map((s) => (
              <Card key={s.label} className="bg-card border-border">
                <CardContent className="p-4 flex items-center gap-3">
                  <s.icon className="h-4 w-4 text-primary shrink-0" />
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{s.label}</p>
                    <p className="text-sm font-bold text-foreground capitalize">{s.value}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Referral Link */}
          <Card className="bg-card border-border mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Your Referral Link</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-muted px-3 py-2 rounded text-xs text-foreground truncate">
                  {referralLink}
                </code>
                <Button size="sm" variant="outline" onClick={copyLink}>
                  <Copy className="h-3 w-3 mr-1" /> Copy
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Marketing Assets */}
          <Card className="bg-card border-border mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Marketing Assets</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="swipe" className="space-y-4">
                <TabsList className="h-8">
                  <TabsTrigger value="swipe" className="text-xs gap-1.5"><FileText className="h-3 w-3" /> Swipe Copy</TabsTrigger>
                  <TabsTrigger value="banners" className="text-xs gap-1.5"><Image className="h-3 w-3" /> Banners</TabsTrigger>
                  <TabsTrigger value="emails" className="text-xs gap-1.5"><Mail className="h-3 w-3" /> Email Templates</TabsTrigger>
                </TabsList>

                <TabsContent value="swipe" className="space-y-3">
                  {[
                    { title: "Social Media Post — Pain Point", copy: "Still spending hours chasing leads? Our AI agents do the prospecting, outreach, and follow-up for you — 24/7. No hiring. No training. Just results.\n\n→ [Your Referral Link]" },
                    { title: "DM Script — Cold Outreach", copy: "Hey [Name], quick question — are you manually prospecting for clients right now?\n\nI've been using an AI system that finds leads, audits their websites, and sends outreach automatically. It's saved me 20+ hours/week.\n\nWant me to send you the link? [Your Referral Link]" },
                    { title: "Story/Reel Hook", copy: "POV: You stopped chasing leads and let AI agents close deals while you sleep 💰\n\nLink in bio 👆" },
                  ].map((item, i) => (
                    <div key={i} className="bg-muted/30 border border-border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-semibold text-foreground">{item.title}</p>
                        <Button size="sm" variant="ghost" className="h-6 text-xs gap-1" onClick={() => { navigator.clipboard.writeText(item.copy.replace("[Your Referral Link]", referralLink)); toast({ title: "Copied!" }); }}>
                          <Copy className="h-3 w-3" /> Copy
                        </Button>
                      </div>
                      <pre className="text-[11px] text-muted-foreground whitespace-pre-wrap font-sans">{item.copy}</pre>
                    </div>
                  ))}
                </TabsContent>

                <TabsContent value="banners" className="space-y-3">
                  {[
                    { title: "Instagram Story (1080×1920)", size: "1080 × 1920", desc: "Vertical banner for IG/TikTok stories" },
                    { title: "Facebook Ad (1200×628)", size: "1200 × 628", desc: "Landscape banner for FB/LinkedIn ads" },
                    { title: "Twitter Header (1500×500)", size: "1500 × 500", desc: "Profile header banner" },
                  ].map((banner, i) => (
                    <div key={i} className="flex items-center justify-between bg-muted/30 border border-border rounded-lg p-4">
                      <div>
                        <p className="text-xs font-semibold text-foreground">{banner.title}</p>
                        <p className="text-[10px] text-muted-foreground">{banner.desc} — {banner.size}</p>
                      </div>
                      <Badge variant="outline" className="text-[10px]">Coming Soon</Badge>
                    </div>
                  ))}
                </TabsContent>

                <TabsContent value="emails" className="space-y-3">
                  {[
                    { title: "Welcome Email Template", subject: "The future of client acquisition is here", body: "Hi [Name],\n\nI wanted to share something that's completely changed how I get clients.\n\nIt's an AI-powered system that handles prospecting, outreach, follow-ups, and even cold calls — all on autopilot.\n\nNo more:\n❌ Cold calling for hours\n❌ Writing outreach emails manually\n❌ Paying for leads that go nowhere\n\nInstead, you get a team of AI agents working around the clock.\n\n→ Check it out here: [Your Referral Link]\n\nLet me know if you have questions!" },
                    { title: "Follow-Up Email", subject: "Quick follow-up — did you see this?", body: "Hey [Name],\n\nJust checking in — did you get a chance to look at the AI client acquisition system I mentioned?\n\nPeople are already using it to book 10-20 calls per week without lifting a finger.\n\nHere's the link again: [Your Referral Link]\n\nHappy to walk you through it if you want!" },
                  ].map((email, i) => (
                    <div key={i} className="bg-muted/30 border border-border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="text-xs font-semibold text-foreground">{email.title}</p>
                          <p className="text-[10px] text-muted-foreground">Subject: {email.subject}</p>
                        </div>
                        <Button size="sm" variant="ghost" className="h-6 text-xs gap-1" onClick={() => { navigator.clipboard.writeText(`Subject: ${email.subject}\n\n${email.body}`.replace(/\[Your Referral Link\]/g, referralLink)); toast({ title: "Copied!" }); }}>
                          <Copy className="h-3 w-3" /> Copy
                        </Button>
                      </div>
                      <pre className="text-[11px] text-muted-foreground whitespace-pre-wrap font-sans">{email.body}</pre>
                    </div>
                  ))}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Referrals */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Referral History</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {referrals.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-foreground mb-1">No referrals yet</p>
                  <p className="text-xs text-muted-foreground">Share your link to start earning</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {referrals.map((r) => (
                    <div key={r.id} className="p-4 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-foreground">{r.referred_email}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {new Date(r.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-foreground">${Number(r.commission_amount).toFixed(0)}</span>
                        <Badge variant="outline" className={`text-[10px] capitalize ${
                          r.status === "paid" ? "bg-emerald-500/20 text-emerald-400" :
                          r.status === "pending" ? "bg-amber-500/20 text-amber-400" :
                          "bg-muted text-muted-foreground"
                        }`}>
                          {r.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
