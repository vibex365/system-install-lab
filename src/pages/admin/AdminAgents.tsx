import { useState, useEffect } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Users, DollarSign, Zap, Plus, ChevronDown, ChevronUp } from "lucide-react";

interface Agent {
  id: string;
  name: string;
  slug: string;
  headline: string;
  category: string;
  price_cents: number;
  stripe_price_id: string | null;
  status: string;
  icon_name: string;
  job_type: string;
  what_it_does: string;
  use_cases: string[];
}

interface AgentLease {
  id: string;
  agent_id: string;
  user_id: string;
  status: string;
  leased_at: string;
}

interface LeaseSummary {
  agent_id: string;
  count: number;
}

export default function AdminAgents() {
  const { toast } = useToast();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [leases, setLeases] = useState<AgentLease[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [stripeInputs, setStripeInputs] = useState<Record<string, string>>({});
  const [savingStripe, setSavingStripe] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const [agentsRes, leasesRes] = await Promise.all([
      supabase.from("agents").select("*").order("price_cents"),
      supabase.from("agent_leases").select("*"),
    ]);
    if (agentsRes.data) {
      setAgents(agentsRes.data as Agent[]);
      // Init stripe inputs
      const inputs: Record<string, string> = {};
      agentsRes.data.forEach((a: Agent) => {
        inputs[a.id] = a.stripe_price_id || "";
      });
      setStripeInputs(inputs);
    }
    if (leasesRes.data) setLeases(leasesRes.data as AgentLease[]);
    setLoading(false);
  };

  const toggleStatus = async (agent: Agent) => {
    setToggling(agent.id);
    const newStatus = agent.status === "active" ? "coming_soon" : "active";
    const { error } = await supabase
      .from("agents")
      .update({ status: newStatus })
      .eq("id", agent.id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setAgents((prev) => prev.map((a) => a.id === agent.id ? { ...a, status: newStatus } : a));
      toast({ title: `Agent ${newStatus === "active" ? "activated" : "deactivated"}` });
    }
    setToggling(null);
  };

  const saveStripePrice = async (agentId: string) => {
    setSavingStripe(agentId);
    const { error } = await supabase
      .from("agents")
      .update({ stripe_price_id: stripeInputs[agentId] || null })
      .eq("id", agentId);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Stripe price ID saved" });
      fetchData();
    }
    setSavingStripe(null);
  };

  const leaseCountForAgent = (agentId: string) =>
    leases.filter((l) => l.agent_id === agentId && l.status === "active").length;

  const totalMonthlyRevenue = agents.reduce((sum, agent) => {
    return sum + leaseCountForAgent(agent.id) * agent.price_cents;
  }, 0);

  const totalLeases = leases.filter((l) => l.status === "active").length;
  const activeAgents = agents.filter((a) => a.status === "active").length;

  return (
    <AdminShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-foreground">Agent Manager</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage the agent catalog, Stripe price IDs, and view active leases.</p>
        </div>

        {/* Overview stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <Zap className="h-8 w-8 text-primary p-1.5 bg-primary/10 rounded-lg" />
              <div>
                <p className="text-2xl font-bold text-foreground">{activeAgents}</p>
                <p className="text-xs text-muted-foreground">Active Agents</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <Users className="h-8 w-8 text-blue-400 p-1.5 bg-blue-500/10 rounded-lg" />
              <div>
                <p className="text-2xl font-bold text-foreground">{totalLeases}</p>
                <p className="text-xs text-muted-foreground">Active Leases</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <DollarSign className="h-8 w-8 text-emerald-400 p-1.5 bg-emerald-500/10 rounded-lg" />
              <div>
                <p className="text-2xl font-bold text-foreground">${(totalMonthlyRevenue / 100).toFixed(0)}</p>
                <p className="text-xs text-muted-foreground">Monthly Agent MRR</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Agent table */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Agent Catalog</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Agent</TableHead>
                    <TableHead className="text-xs">Category</TableHead>
                    <TableHead className="text-xs">Price</TableHead>
                    <TableHead className="text-xs">Leases</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                    <TableHead className="text-xs">Stripe Price ID</TableHead>
                    <TableHead className="text-xs">Active</TableHead>
                    <TableHead className="text-xs"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {agents.map((agent) => {
                    const count = leaseCountForAgent(agent.id);
                    const isExpanded = expandedId === agent.id;
                    const agentLeases = leases.filter((l) => l.agent_id === agent.id && l.status === "active");
                    return (
                      <>
                        <TableRow key={agent.id}>
                          <TableCell className="py-3">
                            <p className="text-xs font-medium text-foreground">{agent.name}</p>
                            <p className="text-[10px] text-muted-foreground truncate max-w-[180px]">{agent.headline}</p>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-[10px]">{agent.category}</Badge>
                          </TableCell>
                          <TableCell className="text-xs font-medium">${(agent.price_cents / 100).toFixed(0)}/mo</TableCell>
                          <TableCell>
                            <button
                              onClick={() => setExpandedId(isExpanded ? null : agent.id)}
                              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                            >
                              {count} {count === 1 ? "lease" : "leases"}
                              {count > 0 && (isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                            </button>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={agent.status === "active"
                                ? "text-emerald-400 border-emerald-500/30 text-[10px]"
                                : "text-muted-foreground text-[10px]"}
                            >
                              {agent.status === "active" ? "Active" : "Coming Soon"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              <Input
                                value={stripeInputs[agent.id] || ""}
                                onChange={(e) => setStripeInputs((prev) => ({ ...prev, [agent.id]: e.target.value }))}
                                placeholder="price_..."
                                className="h-7 text-xs w-36 font-mono"
                              />
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-[10px] px-2"
                                onClick={() => saveStripePrice(agent.id)}
                                disabled={savingStripe === agent.id}
                              >
                                {savingStripe === agent.id ? <Loader2 className="h-3 w-3 animate-spin" /> : "Save"}
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Switch
                              checked={agent.status === "active"}
                              disabled={toggling === agent.id}
                              onCheckedChange={() => toggleStatus(agent)}
                            />
                          </TableCell>
                          <TableCell />
                        </TableRow>
                        {isExpanded && agentLeases.length > 0 && (
                          <TableRow key={`${agent.id}-leases`} className="bg-muted/20">
                            <TableCell colSpan={8} className="py-2 px-6">
                              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">Active Leases</p>
                              <div className="space-y-1">
                                {agentLeases.map((lease) => (
                                  <div key={lease.id} className="flex items-center gap-4 text-[11px] text-muted-foreground">
                                    <span className="font-mono">{lease.user_id.slice(0, 8)}...</span>
                                    <span>Leased {new Date(lease.leased_at).toLocaleDateString()}</span>
                                    <Badge variant="outline" className="text-[9px] text-emerald-400 border-emerald-500/30">{lease.status}</Badge>
                                  </div>
                                ))}
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  );
}
