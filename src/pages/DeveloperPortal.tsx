import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/use-auth";
import { AuthGate } from "@/components/AuthGate";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  Key, Plus, Copy, CheckCheck, Trash2, Activity, Code2,
  Zap, Shield, BarChart3, Clock, AlertTriangle, Link as LinkIcon,
  Loader2,
} from "lucide-react";
import { Link } from "react-router-dom";

interface ApiKey {
  id: string;
  key_prefix: string;
  label: string;
  permissions: string[];
  is_active: boolean;
  last_used_at: string | null;
  created_at: string;
  revoked_at: string | null;
}

interface UsageRow {
  id: string;
  endpoint: string;
  method: string;
  credits_consumed: number;
  status_code: number | null;
  response_time_ms: number | null;
  created_at: string;
}

interface CreditBalance {
  resource_type: string;
  total: number;
  remaining: number;
}

const ENDPOINTS = [
  { slug: "lead-prospector", method: "POST", desc: "Find leads in a city/category", credits: "1 lead credit", params: '{ "city": "Atlanta, GA", "category": "Dental practices" }' },
  { slug: "site-audit", method: "POST", desc: "Audit a website for issues", credits: "1 lead credit", params: '{ "url": "https://example.com" }' },
  { slug: "cold-email-outreach", method: "POST", desc: "Generate cold email sequence", credits: "1 SMS credit", params: '{ "business_name": "...", "url": "...", "pain_points": "...", "niche": "Dental" }' },
  { slug: "sms-outreach", method: "POST", desc: "Send SMS outreach", credits: "1 SMS credit", params: '{ "lead_name": "...", "phone": "+1...", "pitch_context": "..." }' },
  { slug: "cold-call", method: "POST", desc: "Initiate AI voice call", credits: "1 voice credit", params: '{ "lead_name": "...", "phone": "+1...", "pitch_context": "..." }' },
  { slug: "email-drip", method: "POST", desc: "3-email drip sequence", credits: "1 SMS credit", params: '{ "lead_name": "...", "lead_email": "...", "business_name": "...", "url": "..." }' },
  { slug: "website-proposal", method: "POST", desc: "Generate website proposal", credits: "1 lead credit", params: '{ "business_name": "...", "url": "..." }' },
  { slug: "forum-scout", method: "POST", desc: "Scout forums for intent signals", credits: "2 lead credits", params: '{ "niche": "dental", "keywords": "need website" }' },
];

function DeveloperPortalContent() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [usage, setUsage] = useState<UsageRow[]>([]);
  const [credits, setCredits] = useState<CreditBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [newKeyLabel, setNewKeyLabel] = useState("Default");
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [revoking, setRevoking] = useState<string | null>(null);

  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
  const baseUrl = `https://${projectId}.supabase.co/functions/v1/api-gateway`;

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [keysRes, usageRes, creditsRes] = await Promise.all([
        supabase.from("api_keys").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("api_usage_log").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(100),
        supabase.from("credit_purchases").select("*").eq("user_id", user.id).gt("credits_remaining", 0),
      ]);
      if (keysRes.data) setKeys(keysRes.data as ApiKey[]);
      if (usageRes.data) setUsage(usageRes.data as UsageRow[]);
      if (creditsRes.data) {
        const grouped: Record<string, CreditBalance> = {};
        for (const c of creditsRes.data) {
          if (!grouped[c.resource_type]) {
            grouped[c.resource_type] = { resource_type: c.resource_type, total: 0, remaining: 0 };
          }
          grouped[c.resource_type].total += c.credits_total;
          grouped[c.resource_type].remaining += c.credits_remaining;
        }
        setCredits(Object.values(grouped));
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCreateKey = async () => {
    if (!user) return;
    setCreating(true);
    try {
      // Generate key client-side
      const randomBytes = new Uint8Array(32);
      crypto.getRandomValues(randomBytes);
      const rawKey = Array.from(randomBytes).map((b) => b.toString(16).padStart(2, "0")).join("");
      const fullKey = `oc_live_${rawKey}`;
      const prefix = fullKey.substring(0, 16) + "...";

      // Hash
      const encoder = new TextEncoder();
      const hashBuffer = await crypto.subtle.digest("SHA-256", encoder.encode(fullKey));
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const keyHash = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

      const { error } = await supabase.from("api_keys").insert({
        user_id: user.id,
        key_hash: keyHash,
        key_prefix: prefix,
        label: newKeyLabel || "Default",
        permissions: ["all"],
        is_active: true,
      });

      if (error) throw error;
      setCreatedKey(fullKey);
      toast({ title: "API key created", description: "Copy it now — it won't be shown again." });
      fetchData();
    } catch (e: any) {
      toast({ title: "Error creating key", description: e.message, variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  const handleRevoke = async (keyId: string) => {
    setRevoking(keyId);
    try {
      const { error } = await supabase
        .from("api_keys")
        .update({ is_active: false, revoked_at: new Date().toISOString() })
        .eq("id", keyId);
      if (error) throw error;
      toast({ title: "Key revoked" });
      fetchData();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setRevoking(null);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  // Usage stats
  const today = new Date().toISOString().split("T")[0];
  const callsToday = usage.filter((u) => u.created_at.startsWith(today)).length;
  const callsThisMonth = usage.length;
  const creditsUsedToday = usage.filter((u) => u.created_at.startsWith(today)).reduce((s, u) => s + u.credits_consumed, 0);
  const topEndpoints = Object.entries(
    usage.reduce<Record<string, number>>((acc, u) => { acc[u.endpoint] = (acc[u.endpoint] || 0) + 1; return acc; }, {})
  ).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const activeKeys = keys.filter((k) => k.is_active && !k.revoked_at);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16 px-4 container max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <p className="text-xs tracking-[0.2em] text-primary uppercase font-semibold mb-2">Developer API</p>
          <h1 className="text-3xl font-bold text-foreground mb-3">API Portal</h1>
          <p className="text-muted-foreground max-w-2xl text-sm">
            Integrate our agents into your platform. Every API call is powered by credits — no subscriptions required.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Active Keys", value: activeKeys.length, icon: Key },
            { label: "Calls Today", value: callsToday, icon: Activity },
            { label: "Credits Used Today", value: creditsUsedToday, icon: Zap },
            { label: "Calls This Month", value: callsThisMonth, icon: BarChart3 },
          ].map((stat) => (
            <Card key={stat.label} className="bg-card border-border">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                  <stat.icon className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-lg font-bold text-foreground">{stat.value}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Credit Balances */}
        {credits.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs tracking-[0.15em] text-muted-foreground uppercase font-semibold">Credit Balances</p>
              <Button asChild size="sm" variant="outline" className="h-7 text-xs">
                <Link to="/upgrade">Buy More Credits</Link>
              </Button>
            </div>
            <div className="flex gap-3 flex-wrap">
              {credits.map((c) => (
                <div key={c.resource_type} className="flex items-center gap-2 bg-card border border-border rounded-lg px-4 py-2.5">
                  <Zap className="h-3.5 w-3.5 text-primary" />
                  <div>
                    <p className="text-sm font-bold text-foreground">{c.remaining}</p>
                    <p className="text-[10px] text-muted-foreground capitalize">{c.resource_type} credits</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <Tabs defaultValue="keys" className="space-y-6">
          <TabsList>
            <TabsTrigger value="keys" className="text-xs">API Keys</TabsTrigger>
            <TabsTrigger value="docs" className="text-xs">Endpoints</TabsTrigger>
            <TabsTrigger value="usage" className="text-xs">Usage Log</TabsTrigger>
            <TabsTrigger value="examples" className="text-xs">Code Examples</TabsTrigger>
          </TabsList>

          {/* ─── API Keys Tab ─── */}
          <TabsContent value="keys" className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">Manage your API keys. Keys are shown only once on creation.</p>
              <Button size="sm" onClick={() => { setCreateOpen(true); setCreatedKey(null); setNewKeyLabel("Default"); }} className="h-8 text-xs gap-1.5">
                <Plus className="h-3.5 w-3.5" /> Create Key
              </Button>
            </div>

            {loading ? (
              <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
            ) : keys.length === 0 ? (
              <Card className="bg-card border-border">
                <CardContent className="p-8 text-center">
                  <Key className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground">No API keys yet. Create one to get started.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {keys.map((k) => (
                  <Card key={k.id} className={`bg-card ${k.is_active && !k.revoked_at ? "border-border" : "border-destructive/30 opacity-60"}`}>
                    <CardContent className="p-4 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <Key className={`h-4 w-4 shrink-0 ${k.is_active ? "text-primary" : "text-muted-foreground"}`} />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-xs font-semibold text-foreground">{k.label}</p>
                            {k.revoked_at && <Badge variant="destructive" className="text-[9px] h-4">Revoked</Badge>}
                          </div>
                          <p className="text-[11px] text-muted-foreground font-mono truncate">{k.key_prefix}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 shrink-0">
                        <div className="text-right hidden sm:block">
                          <p className="text-[10px] text-muted-foreground">
                            {k.last_used_at ? `Last used ${new Date(k.last_used_at).toLocaleDateString()}` : "Never used"}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            Created {new Date(k.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        {k.is_active && !k.revoked_at && (
                          <Button size="sm" variant="ghost" className="h-7 text-xs text-destructive hover:text-destructive" onClick={() => handleRevoke(k.id)} disabled={revoking === k.id}>
                            {revoking === k.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ─── Endpoints Tab ─── */}
          <TabsContent value="docs" className="space-y-4">
            <p className="text-xs text-muted-foreground">All endpoints accept POST requests. Authenticate with your API key in the Authorization header.</p>
            <div className="space-y-3">
              {ENDPOINTS.map((ep) => (
                <Card key={ep.slug} className="bg-card border-border">
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px] h-5 font-mono bg-primary/10 text-primary border-primary/30">{ep.method}</Badge>
                        <code className="text-xs text-foreground font-mono">/api-gateway?agent={ep.slug}</code>
                      </div>
                      <Badge variant="outline" className="text-[10px] h-5">{ep.credits}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{ep.desc}</p>
                    <div className="bg-muted/50 rounded-md p-3 relative">
                      <pre className="text-[11px] text-muted-foreground font-mono whitespace-pre-wrap">{ep.params}</pre>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="absolute top-1 right-1 h-6 w-6 p-0"
                        onClick={() => handleCopy(ep.params, ep.slug)}
                      >
                        {copied === ep.slug ? <CheckCheck className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* ─── Usage Log Tab ─── */}
          <TabsContent value="usage" className="space-y-4">
            {usage.length === 0 ? (
              <Card className="bg-card border-border">
                <CardContent className="p-8 text-center">
                  <Activity className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground">No API calls yet.</p>
                </CardContent>
              </Card>
            ) : (
              <>
                {topEndpoints.length > 0 && (
                  <div className="flex gap-2 flex-wrap mb-2">
                    {topEndpoints.map(([ep, count]) => (
                      <Badge key={ep} variant="outline" className="text-[10px]">{ep}: {count} calls</Badge>
                    ))}
                  </div>
                )}
                <Card className="bg-card border-border">
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-border bg-muted/40">
                            <th className="text-left p-3 text-[10px] font-semibold text-muted-foreground">Endpoint</th>
                            <th className="text-left p-3 text-[10px] font-semibold text-muted-foreground">Status</th>
                            <th className="text-left p-3 text-[10px] font-semibold text-muted-foreground">Credits</th>
                            <th className="text-left p-3 text-[10px] font-semibold text-muted-foreground hidden sm:table-cell">Time</th>
                            <th className="text-left p-3 text-[10px] font-semibold text-muted-foreground">When</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {usage.slice(0, 50).map((row) => (
                            <tr key={row.id} className="hover:bg-muted/20 transition-colors">
                              <td className="p-3 font-mono text-foreground">{row.endpoint}</td>
                              <td className="p-3">
                                <Badge variant="outline" className={`text-[10px] h-5 ${
                                  (row.status_code || 0) < 400 ? "text-emerald-400 border-emerald-500/30" : "text-destructive border-destructive/30"
                                }`}>
                                  {row.status_code || "—"}
                                </Badge>
                              </td>
                              <td className="p-3 text-muted-foreground">{row.credits_consumed}</td>
                              <td className="p-3 text-muted-foreground hidden sm:table-cell">{row.response_time_ms ? `${row.response_time_ms}ms` : "—"}</td>
                              <td className="p-3 text-muted-foreground">{new Date(row.created_at).toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          {/* ─── Code Examples Tab ─── */}
          <TabsContent value="examples" className="space-y-6">
            {[
              {
                title: "cURL",
                lang: "bash",
                code: `curl -X POST "${baseUrl}?agent=lead-prospector" \\
  -H "Authorization: Bearer oc_live_YOUR_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"city": "Atlanta, GA", "category": "Dental practices"}'`,
              },
              {
                title: "JavaScript (fetch)",
                lang: "javascript",
                code: `const response = await fetch(
  "${baseUrl}?agent=lead-prospector",
  {
    method: "POST",
    headers: {
      "Authorization": "Bearer oc_live_YOUR_KEY",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      city: "Atlanta, GA",
      category: "Dental practices",
    }),
  }
);

const data = await response.json();
console.log(data);`,
              },
              {
                title: "Python (requests)",
                lang: "python",
                code: `import requests

response = requests.post(
    "${baseUrl}?agent=lead-prospector",
    headers={
        "Authorization": "Bearer oc_live_YOUR_KEY",
        "Content-Type": "application/json",
    },
    json={
        "city": "Atlanta, GA",
        "category": "Dental practices",
    },
)

print(response.json())`,
              },
            ].map((example) => (
              <Card key={example.title} className="bg-card border-border">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Code2 className="h-4 w-4 text-primary" />
                      <p className="text-sm font-semibold text-foreground">{example.title}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs gap-1"
                      onClick={() => handleCopy(example.code, example.title)}
                    >
                      {copied === example.title ? <CheckCheck className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                      {copied === example.title ? "Copied!" : "Copy"}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted/50 border border-border rounded-md p-4 overflow-x-auto">
                    <pre className="text-[11px] text-foreground font-mono whitespace-pre leading-relaxed">{example.code}</pre>
                  </div>
                </CardContent>
              </Card>
            ))}

            <Card className="bg-card border-primary/20">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary" />
                  <p className="text-sm font-semibold text-foreground">Authentication</p>
                </div>
                <ul className="space-y-1.5 text-xs text-muted-foreground">
                  <li className="flex items-start gap-2"><Zap className="h-3 w-3 text-primary shrink-0 mt-0.5" />All requests require a Bearer token: <code className="font-mono text-foreground">Authorization: Bearer oc_live_xxx</code></li>
                  <li className="flex items-start gap-2"><Zap className="h-3 w-3 text-primary shrink-0 mt-0.5" />Rate limit: 60 requests per minute per API key</li>
                  <li className="flex items-start gap-2"><Zap className="h-3 w-3 text-primary shrink-0 mt-0.5" />Credits are deducted per call. Check balance via <code className="font-mono text-foreground">/upgrade</code></li>
                  <li className="flex items-start gap-2"><AlertTriangle className="h-3 w-3 text-amber-400 shrink-0 mt-0.5" />API keys are shown once on creation. Store securely.</li>
                </ul>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Create Key Dialog */}
      <Dialog open={createOpen} onOpenChange={(o) => { if (!o) { setCreateOpen(false); setCreatedKey(null); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm font-semibold">
              <Key className="h-4 w-4 text-primary" />
              {createdKey ? "API Key Created" : "Create API Key"}
            </DialogTitle>
          </DialogHeader>

          {createdKey ? (
            <div className="space-y-4">
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-md p-3 flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-300">Copy this key now. It will not be shown again.</p>
              </div>
              <div className="bg-muted/50 border border-border rounded-md p-3 relative">
                <code className="text-xs font-mono text-foreground break-all">{createdKey}</code>
                <Button
                  size="sm"
                  variant="ghost"
                  className="absolute top-1 right-1 h-7 text-xs gap-1"
                  onClick={() => handleCopy(createdKey, "new-key")}
                >
                  {copied === "new-key" ? <CheckCheck className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                </Button>
              </div>
              <DialogFooter>
                <Button size="sm" onClick={() => { setCreateOpen(false); setCreatedKey(null); }}>Done</Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs">Key Label</Label>
                <Input
                  value={newKeyLabel}
                  onChange={(e) => setNewKeyLabel(e.target.value)}
                  placeholder="e.g. Production, Staging"
                  className="text-xs h-9"
                />
              </div>
              <DialogFooter>
                <Button size="sm" variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
                <Button size="sm" onClick={handleCreateKey} disabled={creating}>
                  {creating ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Plus className="h-3.5 w-3.5 mr-1.5" />}
                  Generate Key
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function DeveloperPortal() {
  return (
    <AuthGate>
      <DeveloperPortalContent />
    </AuthGate>
  );
}
