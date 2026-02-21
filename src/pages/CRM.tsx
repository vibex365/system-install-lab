import { useState, useEffect, useMemo } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { AuthGate } from "@/components/AuthGate";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// Table imports removed - using card layout
import {
  Plus, Search, Loader2, Users, Phone, Mail, Globe, TrendingUp, X,
  ScanSearch, PhoneCall, MessageSquare, Send,
} from "lucide-react";

const PIPELINE_STATUSES = ["funnel_lead", "scraped", "audited", "emailed", "contacted", "called", "proposal_sent", "booked", "converted", "lost"];
const STATUS_COLORS: Record<string, string> = {
  funnel_lead: "bg-violet-500/20 text-violet-400 border-violet-500/30",
  scraped: "bg-muted text-muted-foreground",
  audited: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  emailed: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  contacted: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  called: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  proposal_sent: "bg-primary/20 text-primary border-primary/30",
  booked: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  converted: "bg-green-500/20 text-green-400 border-green-500/30",
  lost: "bg-destructive/20 text-destructive border-destructive/30",
};

interface Lead {
  id: string;
  business_name: string;
  contact_name: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  city: string | null;
  category: string | null;
  pipeline_status: string;
  source: string;
  notes: string | null;
  audit_summary: string | null;
  rating: number | null;
  website_quality_score: number | null;
  created_at: string;
}

export default function CRM() {
  return (
    <AuthGate requireActive>
      <CRMContent />
    </AuthGate>
  );
}

function CRMContent() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [editLead, setEditLead] = useState<Lead | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  // Add form
  const [formName, setFormName] = useState("");
  const [formContact, setFormContact] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formWebsite, setFormWebsite] = useState("");
  const [formCity, setFormCity] = useState("");
  const [formCategory, setFormCategory] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchLeads();
  }, [user]);

  const fetchLeads = async () => {
    if (!user) return;
    setLoading(true);
    // Fetch regular leads
    const { data: regularLeads } = await supabase
      .from("leads")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(500);
    // Fetch funnel leads
    const { data: funnelLeads } = await supabase
      .from("funnel_leads")
      .select("*")
      .eq("funnel_owner_id", user.id)
      .order("created_at", { ascending: false })
      .limit(200);
    // Merge funnel leads into the leads format
    const mappedFunnelLeads: Lead[] = ((funnelLeads as any[]) || []).map((fl: any) => ({
      id: fl.id,
      business_name: fl.name,
      contact_name: fl.name,
      phone: fl.phone,
      email: fl.email,
      website: null,
      city: null,
      category: fl.funnel_name || "Smart Funnel",
      pipeline_status: "funnel_lead",
      source: "smart_funnel",
      notes: fl.tier ? `Score: ${fl.score}/100 (${fl.tier})` : null,
      audit_summary: null,
      rating: fl.score,
      website_quality_score: null,
      created_at: fl.created_at,
    }));
    setLeads([...(regularLeads as Lead[] || []), ...mappedFunnelLeads].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
    setLoading(false);
  };

  const filteredLeads = useMemo(() => {
    let result = leads;
    if (filter !== "All") result = result.filter((l) => l.pipeline_status === filter);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((l) =>
        l.business_name.toLowerCase().includes(q) ||
        l.contact_name?.toLowerCase().includes(q) ||
        l.email?.toLowerCase().includes(q) ||
        l.city?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [leads, filter, searchQuery]);

  const stats = useMemo(() => ({
    total: leads.length,
    contacted: leads.filter((l) => ["contacted", "called", "emailed"].includes(l.pipeline_status)).length,
    booked: leads.filter((l) => l.pipeline_status === "booked").length,
    converted: leads.filter((l) => l.pipeline_status === "converted").length,
  }), [leads]);

  const conversionRate = stats.total > 0 ? ((stats.converted / stats.total) * 100).toFixed(1) : "0";

  const resetForm = () => {
    setFormName(""); setFormContact(""); setFormPhone(""); setFormEmail("");
    setFormWebsite(""); setFormCity(""); setFormCategory(""); setFormNotes("");
  };

  const handleAdd = async () => {
    if (!user || !formName.trim()) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("leads").insert({
        user_id: user.id,
        business_name: formName.trim(),
        contact_name: formContact.trim() || null,
        phone: formPhone.trim() || null,
        email: formEmail.trim() || null,
        website: formWebsite.trim() || null,
        city: formCity.trim() || null,
        category: formCategory.trim() || null,
        notes: formNotes.trim() || null,
        pipeline_status: "scraped",
        source: "manual",
      });
      if (error) throw error;
      toast({ title: "Lead added" });
      setAddOpen(false);
      resetForm();
      fetchLeads();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("leads").update({ pipeline_status: status }).eq("id", id);
    fetchLeads();
  };

  const deleteLead = async (id: string) => {
    await supabase.from("leads").delete().eq("id", id);
    fetchLeads();
    toast({ title: "Lead removed" });
  };

  const [runningAgent, setRunningAgent] = useState<string | null>(null);

  const runAgentOnLead = async (lead: Lead, agentSlug: string) => {
    if (!user) return;
    const key = `${lead.id}-${agentSlug}`;
    setRunningAgent(key);
    try {
      // Find agent
      const { data: agent } = await supabase
        .from("agents")
        .select("id")
        .eq("slug", agentSlug)
        .single();
      if (!agent) throw new Error("Agent not found");

      // Find or create lease
      let { data: lease } = await supabase
        .from("agent_leases")
        .select("id")
        .eq("agent_id", agent.id)
        .eq("user_id", user.id)
        .eq("status", "active")
        .maybeSingle();

      if (!lease) {
        const { data: newLease, error: leaseErr } = await supabase
          .from("agent_leases")
          .insert({ agent_id: agent.id, user_id: user.id, status: "active" })
          .select("id")
          .single();
        if (leaseErr) throw leaseErr;
        lease = newLease;
      }

      // Create agent run
      const inputPayload: Record<string, string | null> = {
        lead_id: lead.id,
        business_name: lead.business_name,
        website: lead.website,
        phone: lead.phone,
        email: lead.email,
        city: lead.city,
        category: lead.category,
      };

      const { data: run, error: runErr } = await supabase
        .from("agent_runs")
        .insert({
          agent_id: agent.id,
          lease_id: lease!.id,
          user_id: user.id,
          input_payload: inputPayload,
          status: "queued",
        })
        .select("id")
        .single();
      if (runErr) throw runErr;

      // Invoke run-agent
      await supabase.functions.invoke("run-agent", {
        body: {
          agent_id: agent.id,
          lease_id: lease!.id,
          input: inputPayload,
        },
      });

      toast({ title: `${agentSlug.replace(/-/g, " ")} started`, description: lead.business_name });
      fetchLeads();
    } catch (e: any) {
      toast({ title: "Agent failed", description: e.message, variant: "destructive" });
    } finally {
      setRunningAgent(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-20 pb-20">
        <div className="container max-w-7xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-xl font-bold text-foreground">CRM</h1>
              <p className="text-xs text-muted-foreground">{leads.length} leads total</p>
            </div>
            <Button size="sm" onClick={() => setAddOpen(true)}>
              <Plus className="h-3 w-3 mr-1" /> Add Lead
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {[
              { label: "Total Leads", value: stats.total, icon: Users },
              { label: "Contacted", value: stats.contacted, icon: Phone },
              { label: "Booked", value: stats.booked, icon: TrendingUp },
              { label: "Converted", value: `${stats.converted} (${conversionRate}%)`, icon: TrendingUp },
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

          {/* Filters */}
          <div className="flex gap-2 flex-wrap mb-4">
            {["All", ...PIPELINE_STATUSES].map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors capitalize ${
                  filter === s
                    ? "bg-primary/20 text-primary border-primary/40"
                    : "bg-transparent text-muted-foreground border-border hover:text-foreground"
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search leads..."
              className="pl-9 h-9 text-xs"
            />
          </div>

          {/* Table */}
          <Card className="bg-card border-border">
            <CardContent className="p-0">
              {loading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : filteredLeads.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-xs text-muted-foreground">No leads found. Add leads manually or run Lead Prospector.</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {filteredLeads.map((lead) => {
                    const isRunning = (slug: string) => runningAgent === `${lead.id}-${slug}`;
                    return (
                      <div key={lead.id} className="p-4 hover:bg-muted/30 transition-colors">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0 space-y-1.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-semibold text-foreground truncate">{lead.business_name}</span>
                              {lead.city && <span className="text-[10px] text-muted-foreground">· {lead.city}</span>}
                              <Select value={lead.pipeline_status} onValueChange={(v) => updateStatus(lead.id, v)}>
                                <SelectTrigger className="h-5 text-[10px] w-auto border-0 p-0 gap-0">
                                  <Badge variant="outline" className={`text-[10px] capitalize ${STATUS_COLORS[lead.pipeline_status] || ""}`}>
                                    {lead.pipeline_status.replace(/_/g, " ")}
                                  </Badge>
                                </SelectTrigger>
                                <SelectContent>
                                  {PIPELINE_STATUSES.map((s) => (
                                    <SelectItem key={s} value={s} className="text-xs capitalize">{s.replace(/_/g, " ")}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="flex items-center gap-4 flex-wrap text-[11px] text-muted-foreground">
                              {lead.phone && (
                                <a href={`tel:${lead.phone}`} className="flex items-center gap-1 hover:text-foreground transition-colors">
                                  <Phone className="h-3 w-3" /> {lead.phone}
                                </a>
                              )}
                              {lead.email && (
                                <a href={`mailto:${lead.email}`} className="flex items-center gap-1 hover:text-foreground transition-colors">
                                  <Mail className="h-3 w-3" /> {lead.email}
                                </a>
                              )}
                              {lead.website && (
                                <a href={lead.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-foreground transition-colors truncate max-w-[200px]">
                                  <Globe className="h-3 w-3 shrink-0" /> {lead.website.replace(/https?:\/\/(www\.)?/, "")}
                                </a>
                              )}
                              {lead.contact_name && (
                                <span className="flex items-center gap-1">
                                  <Users className="h-3 w-3" /> {lead.contact_name}
                                </span>
                              )}
                            </div>
                            {lead.notes && <p className="text-[10px] text-muted-foreground/70 truncate max-w-md">{lead.notes}</p>}
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <Button
                              size="sm" variant="outline"
                              className="h-7 px-2 text-[10px] gap-1"
                              disabled={!!runningAgent}
                              onClick={() => runAgentOnLead(lead, "site-audit")}
                            >
                              {isRunning("site-audit") ? <Loader2 className="h-3 w-3 animate-spin" /> : <ScanSearch className="h-3 w-3" />}
                              Scan
                            </Button>
                            <Button
                              size="sm" variant="outline"
                              className="h-7 px-2 text-[10px] gap-1"
                              disabled={!!runningAgent || !lead.email}
                              onClick={() => runAgentOnLead(lead, "cold-email-outreach")}
                            >
                              {isRunning("cold-email-outreach") ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                              Email
                            </Button>
                            <Button
                              size="sm" variant="outline"
                              className="h-7 px-2 text-[10px] gap-1"
                              disabled={!!runningAgent || !lead.phone}
                              onClick={() => runAgentOnLead(lead, "cold-call")}
                            >
                              {isRunning("cold-call") ? <Loader2 className="h-3 w-3 animate-spin" /> : <PhoneCall className="h-3 w-3" />}
                              Call
                            </Button>
                            <Button
                              size="sm" variant="outline"
                              className="h-7 px-2 text-[10px] gap-1"
                              disabled={!!runningAgent || !lead.phone}
                              onClick={() => runAgentOnLead(lead, "sms-outreach")}
                            >
                              {isRunning("sms-outreach") ? <Loader2 className="h-3 w-3 animate-spin" /> : <MessageSquare className="h-3 w-3" />}
                              SMS
                            </Button>
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => deleteLead(lead.id)}>
                              <X className="h-3 w-3 text-muted-foreground" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />

      {/* Add Lead Modal */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm">Add Lead</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Business Name *</Label>
              <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Atlanta Smiles Dental" className="mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Contact Name</Label>
                <Input value={formContact} onChange={(e) => setFormContact(e.target.value)} placeholder="Dr. Chen" className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">Phone</Label>
                <Input value={formPhone} onChange={(e) => setFormPhone(e.target.value)} placeholder="+14045551234" className="mt-1" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Email</Label>
                <Input value={formEmail} onChange={(e) => setFormEmail(e.target.value)} placeholder="info@business.com" className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">Website</Label>
                <Input value={formWebsite} onChange={(e) => setFormWebsite(e.target.value)} placeholder="https://..." className="mt-1" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">City</Label>
                <Input value={formCity} onChange={(e) => setFormCity(e.target.value)} placeholder="Atlanta, GA" className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">Category</Label>
                <Input value={formCategory} onChange={(e) => setFormCategory(e.target.value)} placeholder="Dental" className="mt-1" />
              </div>
            </div>
            <div>
              <Label className="text-xs">Notes</Label>
              <Textarea value={formNotes} onChange={(e) => setFormNotes(e.target.value)} placeholder="Any notes..." className="mt-1 min-h-[60px]" />
            </div>
            <Button onClick={handleAdd} disabled={saving || !formName.trim()} className="w-full">
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Plus className="h-4 w-4 mr-1" />}
              Add Lead
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
