import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { AuthGate } from "@/components/AuthGate";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Users, Link2, Copy, Loader2, TrendingUp } from "lucide-react";
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
