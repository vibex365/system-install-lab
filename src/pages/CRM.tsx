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
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import {
  Plus, Search, Edit2, Loader2, Users, Phone, Mail, Globe, TrendingUp, X,
} from "lucide-react";

const PIPELINE_STATUSES = ["scraped", "audited", "emailed", "contacted", "called", "proposal_sent", "booked", "converted", "lost"];
const STATUS_COLORS: Record<string, string> = {
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
    const { data } = await supabase
      .from("leads")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(500);
    setLeads((data as Lead[]) || []);
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
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-[10px]">Business</TableHead>
                        <TableHead className="text-[10px] hidden md:table-cell">Contact</TableHead>
                        <TableHead className="text-[10px] hidden lg:table-cell">Phone</TableHead>
                        <TableHead className="text-[10px] hidden lg:table-cell">Email</TableHead>
                        <TableHead className="text-[10px]">Status</TableHead>
                        <TableHead className="text-[10px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLeads.map((lead) => (
                        <TableRow key={lead.id}>
                          <TableCell className="text-xs font-medium">
                            {lead.business_name}
                            {lead.city && <span className="text-muted-foreground"> · {lead.city}</span>}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground hidden md:table-cell">{lead.contact_name || "—"}</TableCell>
                          <TableCell className="text-xs text-muted-foreground hidden lg:table-cell">{lead.phone || "—"}</TableCell>
                          <TableCell className="text-xs text-muted-foreground hidden lg:table-cell">{lead.email || "—"}</TableCell>
                          <TableCell>
                            <Select value={lead.pipeline_status} onValueChange={(v) => updateStatus(lead.id, v)}>
                              <SelectTrigger className="h-6 text-[10px] w-[110px] border-0 p-0">
                                <Badge variant="outline" className={`text-[10px] capitalize ${STATUS_COLORS[lead.pipeline_status] || ""}`}>
                                  {lead.pipeline_status}
                                </Badge>
                              </SelectTrigger>
                              <SelectContent>
                                {PIPELINE_STATUSES.map((s) => (
                                  <SelectItem key={s} value={s} className="text-xs capitalize">{s}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => deleteLead(lead.id)}>
                                <X className="h-3 w-3 text-muted-foreground" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
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
