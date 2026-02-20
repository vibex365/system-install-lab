import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { AuthGate } from "@/components/AuthGate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, RefreshCw, Minimize2, Plus, Save, Copy, Loader2, Trash2, Download } from "lucide-react";

const SYSTEM_PROMPT = `You are PFSW — People Fail, Systems Work. You are an elite prompt architect.

Rules:
- Tone: disciplined, premium, direct.
- No hype. No emojis.
- Output MUST follow this EXACT structure in this EXACT order. Include ALL sections. No extra commentary before or after.

1. Objective
2. Stack
3. Routes
4. Database Schema
5. RLS Policies
6. Core User Flows
7. UI/UX Requirements (black/gold editorial)
8. Integrations
9. Acceptance Criteria
10. Build Order

Use stored session context as truth unless overridden.
Keep MVP minimal. Remove unnecessary features.
Return only the final build prompt — nothing else.`;

const DAILY_LIMIT = 50;

export default function Engine() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Left panel fields
  const [productName, setProductName] = useState("");
  const [targetUser, setTargetUser] = useState("");
  const [offer, setOffer] = useState("");
  const [monetization, setMonetization] = useState("");
  const [integrations, setIntegrations] = useState("");
  const [constraints, setConstraints] = useState("");
  const [category, setCategory] = useState("");
  const [packages, setPackages] = useState<{ id: string; slug: string; name: string }[]>([]);

  // Right panel
  const [output, setOutput] = useState("");
  const [generating, setGenerating] = useState(false);

  // Sessions
  const [sessions, setSessions] = useState<any[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  // Usage
  const [usageCount, setUsageCount] = useState(0);

  useEffect(() => {
    supabase.from("prompt_packages").select("id, slug, name").then(({ data }) => setPackages(data || []));
    loadSessions();
    checkUsage();
  }, []);

  // After payment verification, redirect to choose-cohort if no cohort assigned
  useEffect(() => {
    const membershipSessionId = searchParams.get("membership_session_id");
    if (membershipSessionId && profile && !profile.cohort_id) {
      // Give a moment for payment verification to complete, then redirect
      const timer = setTimeout(() => {
        navigate("/choose-cohort", { replace: true });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [searchParams, profile, navigate]);

  // Load library prompt into engine if navigated with ?loadPrompt=<id>
  useEffect(() => {
    const loadPromptId = searchParams.get("loadPrompt");
    if (loadPromptId) {
      supabase
        .from("prompts")
        .select("*, package:prompt_packages!prompts_package_id_fkey(slug)")
        .eq("id", loadPromptId)
        .single()
        .then(({ data }) => {
          if (data) {
            setOutput(data.prompt_text);
            setCategory(data.package?.slug || "");
            setActiveSessionId(null);
            toast({ title: "Prompt loaded from Library" });
          }
        });
    }
  }, [searchParams]);

  const checkUsage = async () => {
    if (!user) return;
    const since = new Date(Date.now() - 86400000).toISOString();
    const { count } = await supabase
      .from("prompt_generations")
      .select("id", { count: "exact" })
      .eq("user_id", user.id)
      .gte("created_at", since);
    setUsageCount(count || 0);
  };

  const loadSessions = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("prompt_sessions")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(20);
    setSessions(data || []);
  };

  const loadSession = (session: any) => {
    setActiveSessionId(session.id);
    const ctx = session.context_json as Record<string, string> || {};
    setProductName(ctx.productName || "");
    setTargetUser(ctx.targetUser || "");
    setOffer(ctx.offer || "");
    setMonetization(ctx.monetization || "");
    setIntegrations(ctx.integrations || "");
    setConstraints(ctx.constraints || "");
    setCategory(ctx.category || "");
    setOutput(session.last_output || "");
  };

  const saveSession = async () => {
    if (!user) return;
    const ctx = { productName, targetUser, offer, monetization, integrations, constraints, category };
    if (activeSessionId) {
      await supabase.from("prompt_sessions").update({
        title: productName || "Untitled",
        context_json: ctx,
        last_output: output,
        updated_at: new Date().toISOString(),
      }).eq("id", activeSessionId);
    } else {
      const { data } = await supabase.from("prompt_sessions").insert({
        user_id: user.id,
        title: productName || "Untitled",
        context_json: ctx,
        last_output: output,
      }).select().single();
      if (data) setActiveSessionId(data.id);
    }
    toast({ title: "Session saved" });
    loadSessions();
  };

  const deleteSession = async (id: string) => {
    await supabase.from("prompt_sessions").delete().eq("id", id);
    if (activeSessionId === id) {
      setActiveSessionId(null);
      newSession();
    }
    toast({ title: "Session deleted" });
    loadSessions();
  };

  const newSession = () => {
    setActiveSessionId(null);
    setProductName(""); setTargetUser(""); setOffer(""); setMonetization("");
    setIntegrations(""); setConstraints(""); setCategory(""); setOutput("");
  };

  const exportOutput = () => {
    const blob = new Blob([output], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${productName || "prompt"}-blueprint.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const generate = async (refinement?: string) => {
    if (usageCount >= DAILY_LIMIT) {
      toast({ title: "Usage temporarily limited", description: "Try again later.", variant: "destructive" });
      return;
    }
    setGenerating(true);
    try {
      const userMessage = `
Product: ${productName}
Target User: ${targetUser}
Offer: ${offer}
Monetization: ${monetization}
Integrations: ${integrations}
Constraints: ${constraints}
Category: ${category}
${refinement ? `\nRefinement: ${refinement}` : ""}
${output ? `\nPrevious Output:\n${output}` : ""}

Generate a complete Lovable-ready build prompt following the exact 10-section structure.`;

      const response = await supabase.functions.invoke("generate-prompt", {
        body: { system: SYSTEM_PROMPT, message: userMessage },
      });

      if (response.error) throw response.error;
      const result = response.data?.text || response.data?.content || "Generation failed.";
      setOutput(result);

      // Log usage
      await supabase.from("prompt_generations").insert({
        user_id: user!.id,
        session_id: activeSessionId,
        tokens_estimate: result.length,
      });
      setUsageCount((c) => c + 1);
    } catch (err: any) {
      toast({ title: "Generation failed", description: err.message, variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  const copyOutput = () => {
    navigator.clipboard.writeText(output);
    toast({ title: "Copied to clipboard" });
  };

  return (
    <AuthGate requireActive>
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-20 pb-20">
          <div className="container max-w-7xl">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-xl font-bold text-foreground">Prompt Engine</h1>
                <p className="text-xs text-muted-foreground">{usageCount}/{DAILY_LIMIT} generations today</p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={newSession} className="text-xs border-border">
                  <Plus className="h-3 w-3 mr-1" /> New
                </Button>
                <Button size="sm" variant="outline" onClick={saveSession} className="text-xs border-border">
                  <Save className="h-3 w-3 mr-1" /> Save
                </Button>
                {output && (
                  <Button size="sm" variant="outline" onClick={exportOutput} className="text-xs border-border">
                    <Download className="h-3 w-3 mr-1" /> Export
                  </Button>
                )}
              </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              {/* Left — Context */}
              <div className="space-y-4">
                <Card className="bg-card border-border">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Build Context</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Field label="Product Name">
                      <Input value={productName} onChange={(e) => setProductName(e.target.value)} placeholder="e.g. TaskFlow" className="bg-background border-border" />
                    </Field>
                    <Field label="Target User">
                      <Input value={targetUser} onChange={(e) => setTargetUser(e.target.value)} placeholder="e.g. Solo founders building SaaS" className="bg-background border-border" />
                    </Field>
                    <Field label="Offer">
                      <Textarea value={offer} onChange={(e) => setOffer(e.target.value)} placeholder="What does this product deliver?" className="bg-background border-border min-h-[60px]" />
                    </Field>
                    <Field label="Monetization">
                      <Input value={monetization} onChange={(e) => setMonetization(e.target.value)} placeholder="e.g. $29/mo subscription" className="bg-background border-border" />
                    </Field>
                    <Field label="Integrations">
                      <Input value={integrations} onChange={(e) => setIntegrations(e.target.value)} placeholder="e.g. Stripe, Supabase, Twilio" className="bg-background border-border" />
                    </Field>
                    <Field label="Constraints">
                      <Input value={constraints} onChange={(e) => setConstraints(e.target.value)} placeholder="e.g. No webhooks, MVP only" className="bg-background border-border" />
                    </Field>
                    <Field label="Category">
                      <Select value={category} onValueChange={setCategory}>
                        <SelectTrigger className="bg-background border-border"><SelectValue placeholder="Select package" /></SelectTrigger>
                        <SelectContent>
                          {packages.map((p) => (
                            <SelectItem key={p.id} value={p.slug}>{p.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                  </CardContent>
                </Card>

                {/* Sessions */}
                <Card className="bg-card border-border">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Sessions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {sessions.length === 0 ? (
                      <p className="text-xs text-muted-foreground py-2">No saved sessions yet.</p>
                    ) : (
                      <div className="space-y-1">
                        {sessions.map((s) => (
                          <div key={s.id} className="flex items-center gap-1">
                            <button
                              onClick={() => loadSession(s)}
                              className={`flex-1 text-left px-3 py-2 rounded text-xs transition-colors ${
                                s.id === activeSessionId ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted"
                              }`}
                            >
                              {s.title || "Untitled"}
                            </button>
                            <Button size="icon" variant="ghost" className="h-6 w-6 shrink-0" onClick={() => deleteSession(s.id)}>
                              <Trash2 className="h-3 w-3 text-muted-foreground" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Right — Output */}
              <div className="space-y-4">
                <Card className="bg-card border-border">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">Generated Prompt</CardTitle>
                      {output && (
                        <Button size="sm" variant="ghost" onClick={copyOutput} className="text-xs h-7">
                          <Copy className="h-3 w-3 mr-1" /> Copy
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      value={output}
                      onChange={(e) => setOutput(e.target.value)}
                      placeholder="Your Lovable-ready build prompt will appear here..."
                      className="bg-background border-border min-h-[400px] font-mono text-xs leading-relaxed"
                    />
                  </CardContent>
                </Card>

                <div className="flex flex-wrap gap-2">
                  <Button onClick={() => generate()} disabled={generating || !productName} className="gold-glow-strong">
                    {generating ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Sparkles className="h-4 w-4 mr-1" />}
                    Generate
                  </Button>
                  <Button variant="outline" onClick={() => generate("Refine and improve the output. Keep the same 10-section structure.")} disabled={generating || !output} className="border-border">
                    <RefreshCw className="h-3 w-3 mr-1" /> Refine
                  </Button>
                  <Button variant="outline" onClick={() => generate("Simplify. Remove unnecessary complexity. Keep the same 10-section structure.")} disabled={generating || !output} className="border-border">
                    <Minimize2 className="h-3 w-3 mr-1" /> Simplify
                  </Button>
                  <Button variant="outline" onClick={() => generate("Add Stripe integration with checkout sessions. Keep the same 10-section structure.")} disabled={generating || !output} className="border-border">
                    <Plus className="h-3 w-3 mr-1" /> + Stripe
                  </Button>
                  <Button variant="outline" onClick={() => generate("Add Supabase Auth + RLS policies. Keep the same 10-section structure.")} disabled={generating || !output} className="border-border">
                    <Plus className="h-3 w-3 mr-1" /> + Supabase
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </AuthGate>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs text-muted-foreground mb-1 block">{label}</label>
      {children}
    </div>
  );
}
