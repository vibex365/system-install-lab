import { useState, useEffect } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Loader2, CheckCircle2, XCircle, Eye, Users, Clock, Handshake,
} from "lucide-react";

interface PartnerApp {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  business_name: string | null;
  social_url: string | null;
  audience_size: string | null;
  niche: string | null;
  why_partner: string | null;
  status: string;
  admin_notes: string | null;
  created_at: string;
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-500/20 text-amber-400",
  approved: "bg-emerald-500/20 text-emerald-400",
  rejected: "bg-destructive/20 text-destructive",
};

export default function AdminPartnerApps() {
  const { toast } = useToast();
  const [apps, setApps] = useState<PartnerApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<PartnerApp | null>(null);
  const [notes, setNotes] = useState("");
  const [commission, setCommission] = useState("20");
  const [processing, setProcessing] = useState(false);

  useEffect(() => { fetchApps(); }, []);

  const fetchApps = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("partner_applications")
      .select("*")
      .order("created_at", { ascending: false });
    setApps((data as PartnerApp[]) || []);
    setLoading(false);
  };

  const generateCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";
    for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
    return code;
  };

  const handleApprove = async () => {
    if (!selected) return;
    setProcessing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Update application status
      await supabase.from("partner_applications").update({
        status: "approved",
        admin_notes: notes || null,
        reviewed_at: new Date().toISOString(),
        reviewed_by: user.id,
      }).eq("id", selected.id);

      // Create affiliate program entry
      await supabase.from("affiliate_program").insert({
        referral_code: generateCode(),
        commission_percent: parseFloat(commission) || 20,
        status: "active",
        invited_by: user.id,
        invited_email: selected.email,
      });

      // Send approval email
      try {
        await supabase.functions.invoke("send-approved-email", {
          body: {
            to: selected.email,
            subject: "🎉 You're Approved — Welcome to the PFSW Partner Program!",
            body: `Hi ${selected.name},\n\nGreat news — your partner application has been approved!\n\nYou now have access to your Affiliate Dashboard where you can find your unique referral link, track your referrals, and monitor your earnings.\n\nLog in here: https://peoplefailsystemswork.com/affiliate\n\nYour commission rate: ${commission}%\n\nWelcome aboard!\n— The PFSW Team`,
          },
        });
      } catch (emailErr) {
        console.error("Email notification failed:", emailErr);
      }

      // Send SMS if phone provided
      if (selected.phone) {
        try {
          await supabase.functions.invoke("send-sms", {
            body: {
              to: selected.phone,
              body: `🎉 ${selected.name}, you've been approved for the PFSW Partner Program! Log in to access your affiliate dashboard: https://peoplefailsystemswork.com/affiliate`,
            },
          });
        } catch (smsErr) {
          console.error("SMS notification failed:", smsErr);
        }
      }

      // Create notification for admin
      await supabase.from("user_notifications").insert({
        user_id: user.id,
        title: `Partner approved: ${selected.name}`,
        body: `${selected.email} has been approved for the partner program`,
        type: "partner_approved",
      });

      toast({ title: "Partner approved", description: `${selected.name} has been notified via email${selected.phone ? " and SMS" : ""}.` });
      setSelected(null);
      setNotes("");
      setCommission("20");
      fetchApps();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selected) return;
    setProcessing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      await supabase.from("partner_applications").update({
        status: "rejected",
        admin_notes: notes || null,
        reviewed_at: new Date().toISOString(),
        reviewed_by: user.id,
      }).eq("id", selected.id);

      toast({ title: "Application rejected" });
      setSelected(null);
      setNotes("");
      fetchApps();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setProcessing(false);
    }
  };

  const pendingCount = apps.filter((a) => a.status === "pending").length;

  return (
    <AdminShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">Partner Applications</h1>
            <p className="text-xs text-muted-foreground">
              {pendingCount > 0 ? `${pendingCount} pending review` : "No pending applications"}
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Total", value: apps.length, icon: Handshake },
            { label: "Pending", value: pendingCount, icon: Clock },
            { label: "Approved", value: apps.filter((a) => a.status === "approved").length, icon: CheckCircle2 },
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

        {/* Applications List */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Applications</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : apps.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-foreground mb-1">No applications yet</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {apps.map((a) => (
                  <div key={a.id} className="p-4 hover:bg-muted/30 transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-foreground">{a.name}</span>
                          <Badge variant="outline" className={`text-[10px] capitalize ${STATUS_COLORS[a.status] || ""}`}>
                            {a.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-[11px] text-muted-foreground flex-wrap">
                          <span>{a.email}</span>
                          {a.business_name && <span>{a.business_name}</span>}
                          {a.audience_size && <span>Audience: {a.audience_size}</span>}
                          {a.niche && <span>Niche: {a.niche}</span>}
                          <span>{new Date(a.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <Button size="sm" variant="ghost" onClick={() => { setSelected(a); setNotes(a.admin_notes || ""); }}>
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Review Dialog */}
      <Dialog open={!!selected} onOpenChange={(open) => { if (!open) setSelected(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base">Review Application</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Name</span><span className="font-medium text-foreground">{selected.name}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Email</span><span className="font-medium text-foreground">{selected.email}</span></div>
                {selected.phone && <div className="flex justify-between"><span className="text-muted-foreground">Phone</span><span className="font-medium text-foreground">{selected.phone}</span></div>}
                {selected.business_name && <div className="flex justify-between"><span className="text-muted-foreground">Business</span><span className="font-medium text-foreground">{selected.business_name}</span></div>}
                {selected.social_url && <div className="flex justify-between items-start"><span className="text-muted-foreground">Social</span><a href={selected.social_url} target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline truncate max-w-[200px]">{selected.social_url}</a></div>}
                {selected.audience_size && <div className="flex justify-between"><span className="text-muted-foreground">Audience</span><span className="font-medium text-foreground">{selected.audience_size}</span></div>}
                {selected.niche && <div className="flex justify-between"><span className="text-muted-foreground">Niche</span><span className="font-medium text-foreground">{selected.niche}</span></div>}
              </div>
              {selected.why_partner && (
                <div>
                  <Label className="text-xs text-muted-foreground">Why they want to partner</Label>
                  <p className="text-sm text-foreground mt-1 bg-muted/50 rounded p-2">{selected.why_partner}</p>
                </div>
              )}
              {selected.status === "pending" && (
                <>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Commission % (on approval)</Label>
                    <Input value={commission} onChange={(e) => setCommission(e.target.value)} type="number" min="1" max="100" className="h-9 text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Admin Notes</Label>
                    <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Internal notes..." className="text-sm min-h-[60px]" />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleApprove} disabled={processing} className="flex-1">
                      {processing ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <CheckCircle2 className="h-3 w-3 mr-1" />}
                      Approve & Notify
                    </Button>
                    <Button variant="destructive" onClick={handleReject} disabled={processing} className="flex-1">
                      <XCircle className="h-3 w-3 mr-1" /> Reject
                    </Button>
                  </div>
                </>
              )}
              {selected.status !== "pending" && (
                <Badge variant="outline" className={`text-xs capitalize ${STATUS_COLORS[selected.status] || ""}`}>
                  {selected.status}
                </Badge>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
}
