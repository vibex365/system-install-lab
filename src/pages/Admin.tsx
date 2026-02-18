import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { AuthGate } from "@/components/AuthGate";
import { StatusPill } from "@/components/StatusPill";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { format } from "date-fns";
import { Users, FileText, Clock, CheckCircle, XCircle, MessageSquare, DollarSign, Settings } from "lucide-react";

type Application = Tables<"applications">;
type WaitlistEntry = Tables<"waitlist">;
type Profile = Tables<"profiles">;

export default function Admin() {
  const { toast } = useToast();
  const [applications, setApplications] = useState<Application[]>([]);
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([]);
  const [members, setMembers] = useState<Profile[]>([]);
  const [selected, setSelected] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [smsStatus, setSmsStatus] = useState<Record<string, string>>({});
  const [systemMeta, setSystemMeta] = useState<{ version: string; founding_access_open: boolean; base_price: number } | null>(null);

  const fetchData = async () => {
    setLoading(true);
    const [appsRes, waitRes, memRes, metaRes] = await Promise.all([
      supabase.from("applications").select("*").order("created_at", { ascending: false }),
      supabase.from("waitlist").select("*").order("created_at", { ascending: false }),
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("system_meta").select("*").limit(1).single(),
    ]);
    setApplications(appsRes.data ?? []);
    setWaitlist(waitRes.data ?? []);
    setMembers(memRes.data ?? []);
    if (metaRes.data) setSystemMeta(metaRes.data as any);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const sendSms = async (phone: string, message: string, appId: string) => {
    setSmsStatus((prev) => ({ ...prev, [appId]: "sending" }));
    try {
      const { data, error } = await supabase.functions.invoke("send-sms", {
        body: { phone, message },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setSmsStatus((prev) => ({ ...prev, [appId]: "sent" }));
      toast({ title: "SMS sent" });
    } catch (err: any) {
      setSmsStatus((prev) => ({ ...prev, [appId]: "failed" }));
      toast({ title: "SMS failed", description: err.message, variant: "destructive" });
    }
  };

  const updateAppStatus = async (app: Application, status: Application["status"]) => {
    const { error } = await supabase.from("applications").update({ status }).eq("id", app.id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }

    if (status === "accepted") {
      // Set profile to accepted_pending_payment if user exists
      if (app.user_id) {
        await supabase.from("profiles").update({ member_status: "accepted_pending_payment" as any }).eq("id", app.user_id);
      }
      // Send acceptance SMS
      if (app.phone_number) {
        await sendSms(app.phone_number, "You've been accepted into PFSW. Log in to view your acceptance.", app.id);
      }
    } else if (status === "rejected") {
      if (app.phone_number) {
        await sendSms(app.phone_number, "Your PFSW application was reviewed but not approved at this time.", app.id);
      }
    }

    toast({ title: `Application ${status}` });
    fetchData();
    setSelected(null);
  };

  const updateMemberStatus = async (id: string, member_status: Profile["member_status"]) => {
    const { error } = await supabase.from("profiles").update({ member_status }).eq("id", id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: `Member ${member_status}` });
    fetchData();
  };

  const statusColor = (s: string) => {
    if (s === "accepted" || s === "active") return "active";
    if (s === "rejected" || s === "inactive") return "muted";
    return "default";
  };

  const stats = {
    total: applications.length,
    submitted: applications.filter((a) => a.status === "submitted").length,
    reviewing: applications.filter((a) => a.status === "reviewing").length,
    accepted: applications.filter((a) => a.status === "accepted").length,
    rejected: applications.filter((a) => a.status === "rejected").length,
    paid: applications.filter((a) => a.payment_status === "paid").length,
    activeMembers: members.filter((m) => m.member_status === "active").length,
    pendingMembers: members.filter((m) => (m.member_status as string) === "accepted_pending_payment").length,
  };

  return (
    <AuthGate requireAdmin>
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-24 pb-20">
          <div className="container max-w-6xl">
            <h1 className="text-2xl font-bold text-foreground mb-2">Admin Panel</h1>
            <p className="text-sm text-muted-foreground mb-6">Manage applications, members, and system configuration.</p>

            {/* Stats row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              <StatCard icon={FileText} label="Applications" value={stats.total} sub={`${stats.submitted} pending`} />
              <StatCard icon={CheckCircle} label="Accepted" value={stats.accepted} sub={`${stats.rejected} rejected`} />
              <StatCard icon={Users} label="Active Members" value={stats.activeMembers} sub={`${stats.pendingMembers} awaiting payment`} />
              <StatCard icon={DollarSign} label="Paid Apps" value={stats.paid} sub={`$${stats.paid * 5} collected`} />
            </div>

            <Tabs defaultValue="applications">
              <TabsList>
                <TabsTrigger value="applications">Applications ({applications.length})</TabsTrigger>
                <TabsTrigger value="waitlist">Waitlist ({waitlist.length})</TabsTrigger>
                <TabsTrigger value="members">Members ({members.length})</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>

              {/* Applications Tab */}
              <TabsContent value="applications" className="mt-6">
                {selected ? (
                  <Card className="bg-card border-border">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          {selected.name}
                          <StatusPill label={selected.status} variant={statusColor(selected.status)} />
                        </span>
                        <Button variant="ghost" size="sm" onClick={() => setSelected(null)}>Close</Button>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 max-h-[70vh] overflow-y-auto">
                      <div className="grid sm:grid-cols-2 gap-4 text-sm">
                        <InfoItem label="Email" value={selected.email} />
                        <InfoItem label="Phone" value={selected.phone_number} />
                        <InfoItem label="Role" value={selected.role} className="capitalize" />
                        <InfoItem label="Stage" value={selected.stage} className="capitalize" />
                        <InfoItem label="Payment" value={selected.payment_status} />
                        <InfoItem label="Revenue" value={selected.monthly_revenue} />
                        <InfoItem label="Hours/wk" value={selected.hours_per_week} />
                        <InfoItem label="Team" value={selected.team_status} className="capitalize" />
                        <InfoItem label="Structure" value={selected.willing_structure === true ? "Yes" : selected.willing_structure === false ? "No" : "—"} />
                        <InfoItem label="Reviews" value={selected.willing_reviews === true ? "Yes" : selected.willing_reviews === false ? "No" : "—"} />
                        <InfoItem label="Emotion" value={selected.disruptive_emotion} className="capitalize" />
                        <InfoItem label="Stripe Session" value={selected.stripe_session_id ? "✓ Paid" : "—"} />
                      </div>

                      <div className="border-t border-border pt-4 space-y-4">
                        <h3 className="text-sm font-semibold text-foreground">Detailed Responses</h3>
                        <AdminField label="What they're building" value={selected.product} />
                        <AdminField label="Bottleneck" value={selected.bottleneck} />
                        <AdminField label="Failed projects (12mo)" value={selected.failed_projects} />
                        <AdminField label="Why they didn't follow through" value={selected.failure_reason} />
                        <AdminField label="What they're avoiding" value={selected.avoiding} />
                        <AdminField label="Why now" value={selected.why_now} />
                        <AdminField label="Consequence of no systems" value={selected.consequence} />
                        <AdminField label="Peak productivity" value={selected.peak_productivity} />
                        <AdminField label="Momentum loss" value={selected.momentum_loss} />
                      </div>

                      {!selected.user_id && selected.status === "accepted" && (
                        <p className="text-xs text-primary border border-primary/20 rounded-lg p-3 bg-primary/5">
                          User not registered yet. Will activate on first login via email match.
                        </p>
                      )}

                      {smsStatus[selected.id] && (
                        <p className={`text-xs rounded-lg p-3 border ${
                          smsStatus[selected.id] === "sent" ? "text-green-500 border-green-500/20 bg-green-500/5" :
                          smsStatus[selected.id] === "sending" ? "text-primary border-primary/20 bg-primary/5" :
                          "text-destructive border-destructive/20 bg-destructive/5"
                        }`}>
                          {smsStatus[selected.id] === "sent" && "✓ SMS sent successfully"}
                          {smsStatus[selected.id] === "sending" && "Sending SMS..."}
                          {smsStatus[selected.id] === "failed" && "✗ SMS failed to send"}
                        </p>
                      )}

                      <div className="flex gap-2 pt-2">
                        <Button size="sm" variant="outline" onClick={() => updateAppStatus(selected, "reviewing")} disabled={selected.status === "reviewing"}>
                          <Clock className="h-3 w-3 mr-1" /> Reviewing
                        </Button>
                        <Button size="sm" onClick={() => updateAppStatus(selected, "accepted")} disabled={selected.status === "accepted"}>
                          <CheckCircle className="h-3 w-3 mr-1" /> Accept
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => updateAppStatus(selected, "rejected")} disabled={selected.status === "rejected"}>
                          <XCircle className="h-3 w-3 mr-1" /> Reject
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="rounded-lg border border-border overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-muted">
                        <tr>
                          <th className="text-left px-4 py-3 text-muted-foreground font-medium">Name</th>
                          <th className="text-left px-4 py-3 text-muted-foreground font-medium hidden sm:table-cell">Email</th>
                          <th className="text-left px-4 py-3 text-muted-foreground font-medium hidden md:table-cell">Role</th>
                          <th className="text-left px-4 py-3 text-muted-foreground font-medium">Status</th>
                          <th className="text-left px-4 py-3 text-muted-foreground font-medium hidden md:table-cell">Payment</th>
                          <th className="text-left px-4 py-3 text-muted-foreground font-medium hidden md:table-cell">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {applications.map((app) => (
                          <tr key={app.id} className="border-t border-border hover:bg-muted/50 cursor-pointer" onClick={() => setSelected(app)}>
                            <td className="px-4 py-3 text-foreground">{app.name}</td>
                            <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{app.email}</td>
                            <td className="px-4 py-3 text-muted-foreground hidden md:table-cell capitalize">{app.role}</td>
                            <td className="px-4 py-3"><StatusPill label={app.status} variant={statusColor(app.status)} /></td>
                            <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                              <span className={app.payment_status === "paid" ? "text-green-500" : "text-muted-foreground"}>
                                {app.payment_status || "—"}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{format(new Date(app.created_at), "MMM d")}</td>
                          </tr>
                        ))}
                        {applications.length === 0 && (
                          <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No applications yet.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </TabsContent>

              {/* Waitlist Tab */}
              <TabsContent value="waitlist" className="mt-6">
                <div className="rounded-lg border border-border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr>
                        <th className="text-left px-4 py-3 text-muted-foreground font-medium">Email</th>
                        <th className="text-left px-4 py-3 text-muted-foreground font-medium hidden sm:table-cell">Note</th>
                        <th className="text-left px-4 py-3 text-muted-foreground font-medium">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {waitlist.map((w) => (
                        <tr key={w.id} className="border-t border-border">
                          <td className="px-4 py-3 text-foreground">{w.email}</td>
                          <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{w.note || "—"}</td>
                          <td className="px-4 py-3 text-muted-foreground">{format(new Date(w.created_at), "MMM d")}</td>
                        </tr>
                      ))}
                      {waitlist.length === 0 && (
                        <tr><td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">No waitlist entries yet.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </TabsContent>

              {/* Members Tab */}
              <TabsContent value="members" className="mt-6">
                <div className="rounded-lg border border-border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr>
                        <th className="text-left px-4 py-3 text-muted-foreground font-medium">Email</th>
                        <th className="text-left px-4 py-3 text-muted-foreground font-medium">Status</th>
                        <th className="text-left px-4 py-3 text-muted-foreground font-medium hidden sm:table-cell">Tier</th>
                        <th className="text-left px-4 py-3 text-muted-foreground font-medium hidden sm:table-cell">Joined</th>
                        <th className="text-left px-4 py-3 text-muted-foreground font-medium">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {members.map((m) => (
                        <tr key={m.id} className="border-t border-border">
                          <td className="px-4 py-3 text-foreground">{m.email}</td>
                          <td className="px-4 py-3"><StatusPill label={m.member_status} variant={statusColor(m.member_status)} /></td>
                          <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell capitalize">{(m as any).member_tier || "—"}</td>
                          <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{format(new Date(m.created_at), "MMM d")}</td>
                          <td className="px-4 py-3">
                            {m.member_status === "active" ? (
                              <Button size="sm" variant="ghost" className="text-xs" onClick={() => updateMemberStatus(m.id, "inactive")}>Deactivate</Button>
                            ) : (m.member_status as string) === "accepted_pending_payment" ? (
                              <span className="text-xs text-primary">Awaiting payment</span>
                            ) : (
                              <Button size="sm" variant="ghost" className="text-xs text-primary" onClick={() => updateMemberStatus(m.id, "active")}>Activate</Button>
                            )}
                          </td>
                        </tr>
                      ))}
                      {members.length === 0 && (
                        <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No members yet.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </TabsContent>

              {/* Settings Tab */}
              <TabsContent value="settings" className="mt-6">
                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Settings className="h-4 w-4 text-primary" /> System Configuration
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 text-sm">
                    {systemMeta ? (
                      <>
                        <div className="grid sm:grid-cols-2 gap-4">
                          <InfoItem label="Version" value={systemMeta.version} />
                          <InfoItem label="Founding Access" value={systemMeta.founding_access_open ? "Open" : "Closed"} />
                          <InfoItem label="Base Price" value={`$${(systemMeta.base_price / 100).toFixed(2)}`} />
                        </div>
                        <p className="text-xs text-muted-foreground mt-4">
                          To update system settings, modify the system_meta table in the backend.
                        </p>
                      </>
                    ) : (
                      <p className="text-muted-foreground">Loading configuration...</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
        <Footer />
      </div>
    </AuthGate>
  );
}

function StatCard({ icon: Icon, label, value, sub }: { icon: any; label: string; value: number; sub: string }) {
  return (
    <Card className="bg-card border-border">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-1">
          <Icon className="h-4 w-4 text-primary" />
          <span className="text-xs text-muted-foreground">{label}</span>
        </div>
        <p className="text-2xl font-bold text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground">{sub}</p>
      </CardContent>
    </Card>
  );
}

function InfoItem({ label, value, className = "" }: { label: string; value: string | null | undefined; className?: string }) {
  return (
    <div>
      <span className="text-muted-foreground">{label}:</span>{" "}
      <span className={`text-foreground ${className}`}>{value || "—"}</span>
    </div>
  );
}

function AdminField({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className="text-sm text-foreground bg-muted/50 rounded-lg p-3">{value}</p>
    </div>
  );
}
