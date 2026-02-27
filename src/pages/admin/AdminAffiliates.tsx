import { useState, useEffect } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Users, DollarSign, Link2, Loader2, Plus, Copy, Pause, Play, XCircle,
  TrendingUp, UserPlus,
} from "lucide-react";

interface Affiliate {
  id: string;
  user_id: string | null;
  referral_code: string;
  commission_percent: number;
  status: string;
  invited_email: string;
  total_earned: number;
  total_referrals: number;
  created_at: string;
}

const STATUS_COLORS: Record<string, string> = {
  invited: "bg-amber-500/20 text-amber-400",
  active: "bg-emerald-500/20 text-emerald-400",
  paused: "bg-muted text-muted-foreground",
  revoked: "bg-destructive/20 text-destructive",
};

export default function AdminAffiliates() {
  const { toast } = useToast();
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [commission, setCommission] = useState("20");
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchAffiliates(); }, []);

  const fetchAffiliates = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("affiliate_program")
      .select("*")
      .order("created_at", { ascending: false });
    setAffiliates((data as Affiliate[]) || []);
    setLoading(false);
  };

  const generateCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";
    for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
    return code;
  };

  const inviteAffiliate = async () => {
    if (!inviteEmail.trim()) return;
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("affiliate_program").insert({
        referral_code: generateCode(),
        commission_percent: parseFloat(commission) || 20,
        status: "invited",
        invited_by: user.id,
        invited_email: inviteEmail.trim(),
      });
      if (error) throw error;

      toast({ title: "Affiliate invited", description: `Invitation sent to ${inviteEmail}` });
      setInviteOpen(false);
      setInviteEmail("");
      setCommission("20");
      fetchAffiliates();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("affiliate_program").update({ status }).eq("id", id);
    fetchAffiliates();
    toast({ title: `Affiliate ${status}` });
  };

  const copyLink = (code: string) => {
    navigator.clipboard.writeText(`https://peoplefailsystemswork.com/?ref=${code}`);
    toast({ title: "Referral link copied" });
  };

  const stats = {
    total: affiliates.length,
    active: affiliates.filter((a) => a.status === "active").length,
    totalEarned: affiliates.reduce((s, a) => s + Number(a.total_earned), 0),
    totalReferrals: affiliates.reduce((s, a) => s + a.total_referrals, 0),
  };

  return (
    <AdminShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">Affiliate Program</h1>
            <p className="text-xs text-muted-foreground">Invite-only partner compensation</p>
          </div>
          <Button size="sm" onClick={() => setInviteOpen(true)}>
            <Plus className="h-3 w-3 mr-1" /> Invite Affiliate
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Total Affiliates", value: stats.total, icon: Users },
            { label: "Active", value: stats.active, icon: UserPlus },
            { label: "Total Earned", value: `$${stats.totalEarned.toFixed(0)}`, icon: DollarSign },
            { label: "Total Referrals", value: stats.totalReferrals, icon: TrendingUp },
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

        {/* Affiliates List */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Affiliates</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : affiliates.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-foreground mb-1">No affiliates yet</p>
                <p className="text-xs text-muted-foreground">Invite influencers from your Dream 100 list</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {affiliates.map((a) => (
                  <div key={a.id} className="p-4 hover:bg-muted/30 transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-foreground">{a.invited_email}</span>
                          <Badge variant="outline" className={`text-[10px] capitalize ${STATUS_COLORS[a.status] || ""}`}>
                            {a.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
                          <span>Code: <code className="bg-muted px-1 rounded">{a.referral_code}</code></span>
                          <span>{a.commission_percent}% commission</span>
                          <span>{a.total_referrals} referrals</span>
                          <span>${Number(a.total_earned).toFixed(0)} earned</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button onClick={() => copyLink(a.referral_code)} className="p-1.5 text-muted-foreground hover:text-foreground transition-colors" title="Copy link">
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                        {a.status === "active" && (
                          <button onClick={() => updateStatus(a.id, "paused")} className="p-1.5 text-muted-foreground hover:text-amber-400 transition-colors" title="Pause">
                            <Pause className="h-3.5 w-3.5" />
                          </button>
                        )}
                        {(a.status === "paused" || a.status === "invited") && (
                          <button onClick={() => updateStatus(a.id, "active")} className="p-1.5 text-muted-foreground hover:text-emerald-400 transition-colors" title="Activate">
                            <Play className="h-3.5 w-3.5" />
                          </button>
                        )}
                        {a.status !== "revoked" && (
                          <button onClick={() => updateStatus(a.id, "revoked")} className="p-1.5 text-muted-foreground hover:text-destructive transition-colors" title="Revoke">
                            <XCircle className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Invite Dialog */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base">Invite Affiliate</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Email *</Label>
              <Input value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="influencer@example.com" className="h-9 text-xs" />
            </div>
            <div>
              <Label className="text-xs">Commission %</Label>
              <Input value={commission} onChange={(e) => setCommission(e.target.value)} type="number" min="1" max="100" className="h-9 text-xs" />
            </div>
            <Button onClick={inviteAffiliate} disabled={saving || !inviteEmail.trim()} className="w-full">
              {saving ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <UserPlus className="h-3 w-3 mr-1" />}
              Send Invitation
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
}
