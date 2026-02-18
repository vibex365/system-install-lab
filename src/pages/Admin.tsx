import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { AuthGate } from "@/components/AuthGate";
import { StatusPill } from "@/components/StatusPill";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { format } from "date-fns";

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

  const fetchData = async () => {
    setLoading(true);
    const [appsRes, waitRes, memRes] = await Promise.all([
      supabase.from("applications").select("*").order("created_at", { ascending: false }),
      supabase.from("waitlist").select("*").order("created_at", { ascending: false }),
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
    ]);
    setApplications(appsRes.data ?? []);
    setWaitlist(waitRes.data ?? []);
    setMembers(memRes.data ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const updateAppStatus = async (app: Application, status: Application["status"]) => {
    const { error } = await supabase.from("applications").update({ status }).eq("id", app.id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }

    // If accepted and there's a user_id, activate that profile
    if (status === "accepted" && app.user_id) {
      await supabase.from("profiles").update({ member_status: "active" }).eq("id", app.user_id);
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

  return (
    <AuthGate requireAdmin>
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-24 pb-20">
          <div className="container max-w-6xl">
            <h1 className="text-2xl font-bold text-foreground mb-6">Admin Panel</h1>

            <Tabs defaultValue="applications">
              <TabsList>
                <TabsTrigger value="applications">Applications ({applications.length})</TabsTrigger>
                <TabsTrigger value="waitlist">Waitlist ({waitlist.length})</TabsTrigger>
                <TabsTrigger value="members">Members ({members.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="applications" className="mt-6">
                {selected ? (
                  <Card className="bg-card border-border">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center justify-between">
                        {selected.name}
                        <Button variant="ghost" size="sm" onClick={() => setSelected(null)}>Close</Button>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid sm:grid-cols-2 gap-4 text-sm">
                        <div><span className="text-muted-foreground">Email:</span> <span className="text-foreground">{selected.email}</span></div>
                        <div><span className="text-muted-foreground">Role:</span> <span className="text-foreground">{selected.role}</span></div>
                        <div><span className="text-muted-foreground">Stage:</span> <span className="text-foreground">{selected.stage}</span></div>
                        <div><span className="text-muted-foreground">Status:</span> <StatusPill label={selected.status} variant={statusColor(selected.status)} /></div>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">What they're building</p>
                        <p className="text-sm text-foreground">{selected.product}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Bottleneck</p>
                        <p className="text-sm text-foreground">{selected.bottleneck}</p>
                      </div>
                      {selected.why_now && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Why now</p>
                          <p className="text-sm text-foreground">{selected.why_now}</p>
                        </div>
                      )}
                      {!selected.user_id && selected.status === "accepted" && (
                        <p className="text-xs text-primary border border-primary/20 rounded-lg p-3 bg-primary/5">
                          User not registered yet. Will activate on first login via email match.
                        </p>
                      )}
                      <div className="flex gap-2 pt-2">
                        <Button size="sm" variant="outline" onClick={() => updateAppStatus(selected, "reviewing")} disabled={selected.status === "reviewing"}>Reviewing</Button>
                        <Button size="sm" onClick={() => updateAppStatus(selected, "accepted")} disabled={selected.status === "accepted"}>Accept</Button>
                        <Button size="sm" variant="destructive" onClick={() => updateAppStatus(selected, "rejected")} disabled={selected.status === "rejected"}>Reject</Button>
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
                            <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{format(new Date(app.created_at), "MMM d")}</td>
                          </tr>
                        ))}
                        {applications.length === 0 && (
                          <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No applications yet.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </TabsContent>

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

              <TabsContent value="members" className="mt-6">
                <div className="rounded-lg border border-border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr>
                        <th className="text-left px-4 py-3 text-muted-foreground font-medium">Email</th>
                        <th className="text-left px-4 py-3 text-muted-foreground font-medium">Status</th>
                        <th className="text-left px-4 py-3 text-muted-foreground font-medium hidden sm:table-cell">Joined</th>
                        <th className="text-left px-4 py-3 text-muted-foreground font-medium">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {members.map((m) => (
                        <tr key={m.id} className="border-t border-border">
                          <td className="px-4 py-3 text-foreground">{m.email}</td>
                          <td className="px-4 py-3"><StatusPill label={m.member_status} variant={statusColor(m.member_status)} /></td>
                          <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{format(new Date(m.created_at), "MMM d")}</td>
                          <td className="px-4 py-3">
                            {m.member_status === "active" ? (
                              <Button size="sm" variant="ghost" className="text-xs" onClick={() => updateMemberStatus(m.id, "inactive")}>Deactivate</Button>
                            ) : (
                              <Button size="sm" variant="ghost" className="text-xs text-primary" onClick={() => updateMemberStatus(m.id, "active")}>Activate</Button>
                            )}
                          </td>
                        </tr>
                      ))}
                      {members.length === 0 && (
                        <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">No members yet.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </main>
        <Footer />
      </div>
    </AuthGate>
  );
}
