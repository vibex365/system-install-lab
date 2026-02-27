import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/hooks/use-auth";
import { useUsage } from "@/hooks/use-usage";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Target, Copy, ExternalLink, Loader2, Sparkles, RefreshCw,
  Mail, MessageSquare, PhoneCall, CalendarCheck, Eye, Palette,
} from "lucide-react";
import { motion } from "framer-motion";

interface QuizQuestion {
  id: string;
  question: string;
  type: "single" | "multi";
  options: string[];
}

interface FunnelData {
  id: string;
  title: string;
  slug: string;
  status: string;
  quiz_config: { questions?: QuizQuestion[] };
  brand_config: {
    niche?: string;
    headline?: string;
    description?: string;
    primary_color?: string;
    accent_color?: string;
  };
  submissions_count: number;
  created_at: string;
}

interface AgentToggles {
  sms_followup: boolean;
  email_followup: boolean;
  voice_call: boolean;
  booking_agent: boolean;
}

const NICHES = [
  { value: "mlm", label: "Network Marketing" },
  { value: "affiliate", label: "Affiliate Marketing" },
  { value: "coaching", label: "Online Coaching" },
  { value: "home_business", label: "Home Business" },
];

const AGENT_TOGGLES = [
  { key: "sms_followup" as keyof AgentToggles, label: "SMS Follow-up", icon: MessageSquare, description: "Auto-send SMS to new funnel leads" },
  { key: "email_followup" as keyof AgentToggles, label: "Email Follow-up", icon: Mail, description: "AI-generated follow-up emails" },
  { key: "voice_call" as keyof AgentToggles, label: "AI Voice Call", icon: PhoneCall, description: "Outbound AI calls to qualified leads" },
  { key: "booking_agent" as keyof AgentToggles, label: "Auto-Booking", icon: CalendarCheck, description: "AI books calls onto your calendar" },
];

export default function Funnels() {
  const { user, loading, profile } = useAuth();
  const { canUse, incrementUsage } = useUsage();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [funnel, setFunnel] = useState<FunnelData | null>(null);
  const [loadingFunnel, setLoadingFunnel] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedNiche, setSelectedNiche] = useState(profile?.niche || "mlm");
  const [primaryColor, setPrimaryColor] = useState("#d4af37");
  const [accentColor, setAccentColor] = useState("#1a1a2e");

  // Agent toggles
  const [agentToggles, setAgentToggles] = useState<AgentToggles>({
    sms_followup: true, email_followup: true, voice_call: false, booking_agent: false,
  });

  useEffect(() => {
    if (!loading && !user) navigate("/login", { replace: true });
  }, [user, loading, navigate]);

  useEffect(() => {
    if (profile?.niche) setSelectedNiche(profile.niche);
  }, [profile]);

  useEffect(() => {
    if (user) {
      fetchFunnel();
      fetchToggles();
    }
  }, [user]);

  const fetchFunnel = async () => {
    if (!user) return;
    setLoadingFunnel(true);
    const { data } = await supabase
      .from("user_funnels")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (data) {
      const f: FunnelData = {
        ...data,
        quiz_config: typeof data.quiz_config === "object" ? (data.quiz_config as any) : {},
        brand_config: typeof data.brand_config === "object" ? (data.brand_config as any) : {},
      };
      setFunnel(f);
      if (f.brand_config.primary_color) setPrimaryColor(f.brand_config.primary_color);
      if (f.brand_config.accent_color) setAccentColor(f.brand_config.accent_color);
      if (f.brand_config.niche) setSelectedNiche(f.brand_config.niche);
    }
    setLoadingFunnel(false);
  };

  const fetchToggles = async () => {
    if (!user) return;
    const { data } = await supabase.from("user_settings").select("agent_toggles").eq("user_id", user.id).maybeSingle();
    if (data?.agent_toggles) {
      const saved = data.agent_toggles as Record<string, boolean>;
      setAgentToggles({
        sms_followup: saved.sms_followup ?? true,
        email_followup: saved.email_followup ?? true,
        voice_call: saved.voice_call ?? false,
        booking_agent: saved.booking_agent ?? false,
      });
    }
  };

  const saveToggles = useCallback(async (t: AgentToggles) => {
    if (!user) return;
    await supabase.from("user_settings").upsert({ user_id: user.id, agent_toggles: t as any }, { onConflict: "user_id" });
  }, [user]);

  const handleToggle = (key: keyof AgentToggles, val: boolean) => {
    const updated = { ...agentToggles, [key]: val };
    setAgentToggles(updated);
    saveToggles(updated);
  };

  /** Generate or regenerate funnel questions using AI based on niche */
  const generateFunnel = async () => {
    if (!user) return;
    if (!canUse("funnels")) return;

    setGenerating(true);
    try {
      const nicheLabel = NICHES.find(n => n.value === selectedNiche)?.label || selectedNiche;

      // Use AI to generate niche-specific quiz questions
      const { data: aiData, error: aiError } = await supabase.functions.invoke("generate-prompt", {
        body: {
          system: `You are a quiz funnel expert for the ${nicheLabel} niche. Generate exactly 5 qualifying quiz questions that help identify how ready a prospect is for automation/growth services. Each question should have 4 options ordered from least ready to most ready. Return ONLY valid JSON in this exact format: {"questions":[{"id":"q1","question":"...","type":"single","options":["option1","option2","option3","option4"]},...],"headline":"...","description":"..."}`,
          message: `Generate a lead-qualifying quiz funnel for the ${nicheLabel} niche. Questions should uncover pain points, current situation, and readiness to invest in automation. Make the headline compelling and the description create urgency.`,
        },
      });

      if (aiError) throw aiError;

      let parsed;
      try {
        const text = aiData?.text || "";
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
      } catch {
        throw new Error("Failed to parse AI response");
      }

      if (!parsed?.questions?.length) throw new Error("No questions generated");

      const slug = `${selectedNiche}-quiz-${user.id.slice(0, 8)}`;
      const brand_config = {
        niche: selectedNiche,
        headline: parsed.headline || `${nicheLabel} Growth Assessment`,
        description: parsed.description || "Answer a few questions to get your personalized growth plan.",
        primary_color: primaryColor,
        accent_color: accentColor,
      };
      const quiz_config = { questions: parsed.questions };

      if (funnel) {
        // Update existing
        await supabase.from("user_funnels").update({
          quiz_config: quiz_config as any,
          brand_config: brand_config as any,
          title: `${nicheLabel} Quiz Funnel`,
        }).eq("id", funnel.id);
      } else {
        // Create new
        await supabase.from("user_funnels").insert({
          user_id: user.id,
          title: `${nicheLabel} Quiz Funnel`,
          slug,
          quiz_config: quiz_config as any,
          brand_config: brand_config as any,
          status: "active",
        });
        await incrementUsage("funnels");
      }

      // Update niche on profile
      await supabase.from("profiles").update({ niche: selectedNiche }).eq("id", user.id);

      toast({ title: funnel ? "Funnel regenerated!" : "Funnel created!" });
      fetchFunnel();
    } catch (e: any) {
      toast({ title: "Generation failed", description: e.message, variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  const updateColors = async () => {
    if (!funnel) return;
    const brand = { ...funnel.brand_config, primary_color: primaryColor, accent_color: accentColor };
    await supabase.from("user_funnels").update({ brand_config: brand as any }).eq("id", funnel.id);
    toast({ title: "Colors updated!" });
    fetchFunnel();
  };

  const toggleStatus = async () => {
    if (!funnel) return;
    const next = funnel.status === "active" ? "draft" : "active";
    await supabase.from("user_funnels").update({ status: next }).eq("id", funnel.id);
    toast({ title: next === "active" ? "Funnel published!" : "Funnel unpublished" });
    fetchFunnel();
  };

  const copyLink = () => {
    if (!funnel) return;
    navigator.clipboard.writeText(`${window.location.origin}/f/${funnel.slug}`);
    toast({ title: "Link copied!" });
  };

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-20">
        <div className="container max-w-4xl">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-2xl font-bold text-foreground mb-1">Your Quiz Funnel</h1>
            <p className="text-sm text-muted-foreground mb-8">AI-generated quiz funnel tailored to your niche. One funnel, fully dynamic.</p>
          </motion.div>

          <Tabs defaultValue="funnel" className="space-y-6">
            <TabsList>
              <TabsTrigger value="funnel">Funnel</TabsTrigger>
              <TabsTrigger value="agents">Agents</TabsTrigger>
              <TabsTrigger value="branding">Branding</TabsTrigger>
            </TabsList>

            {/* ─── FUNNEL TAB ─── */}
            <TabsContent value="funnel" className="space-y-6">
              {/* Niche selector + generate */}
              <Card className="border-border">
                <CardHeader>
                  <CardTitle className="text-base">Niche & Questions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-end gap-3">
                    <div className="flex-1">
                      <Label className="text-xs">Your Niche</Label>
                      <Select value={selectedNiche} onValueChange={setSelectedNiche}>
                        <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {NICHES.map(n => <SelectItem key={n.value} value={n.value}>{n.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button onClick={generateFunnel} disabled={generating} className="gap-2">
                      {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                      {funnel ? "Regenerate" : "Generate Funnel"}
                    </Button>
                  </div>

                  {generating && (
                    <div className="py-8 text-center space-y-3">
                      <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                      <p className="text-sm text-muted-foreground animate-pulse">AI is crafting your quiz questions...</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Current funnel details */}
              {loadingFunnel ? (
                <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
              ) : funnel ? (
                <Card className="border-border">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-base">{funnel.title}</CardTitle>
                        <p className="text-xs text-muted-foreground mt-1">{funnel.brand_config.headline}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={funnel.status === "active" ? "default" : "outline"} className="text-xs">
                          {funnel.status === "active" ? "Live" : "Draft"}
                        </Badge>
                        <Button size="sm" variant="outline" onClick={toggleStatus} className="text-xs h-7">
                          {funnel.status === "active" ? "Unpublish" : "Publish"}
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Stats */}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>{funnel.quiz_config.questions?.length || 0} questions</span>
                      <span>{funnel.submissions_count} submissions</span>
                      <span>Niche: {funnel.brand_config.niche}</span>
                    </div>

                    {/* Questions preview */}
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold">Questions</Label>
                      {funnel.quiz_config.questions?.map((q, i) => (
                        <div key={q.id} className="p-3 rounded-md border border-border bg-muted/30">
                          <p className="text-xs font-medium text-foreground"><span className="text-primary mr-1">Q{i + 1}.</span>{q.question}</p>
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {q.options.map((opt, j) => (
                              <Badge key={j} variant="outline" className="text-[10px] font-normal">{opt}</Badge>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-2">
                      <Button size="sm" variant="outline" onClick={copyLink} className="gap-1.5 text-xs">
                        <Copy className="h-3 w-3" /> Copy Link
                      </Button>
                      <Button size="sm" variant="outline" asChild className="gap-1.5 text-xs">
                        <a href={`/f/${funnel.slug}`} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-3 w-3" /> Preview
                        </a>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="border-dashed border-2 border-border">
                  <CardContent className="py-12 text-center space-y-3">
                    <Target className="h-10 w-10 text-muted-foreground mx-auto" />
                    <p className="text-sm text-muted-foreground">Select your niche and click "Generate Funnel" to create your AI-powered quiz.</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* ─── AGENTS TAB ─── */}
            <TabsContent value="agents" className="space-y-4">
              <Card className="border-border">
                <CardHeader><CardTitle className="text-base">Automation Agents</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  {AGENT_TOGGLES.map((a) => (
                    <div key={a.key} className="flex items-center justify-between p-3 rounded-md border border-border">
                      <div className="flex items-center gap-3">
                        <a.icon className="h-4 w-4 text-primary shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-foreground">{a.label}</p>
                          <p className="text-[11px] text-muted-foreground">{a.description}</p>
                        </div>
                      </div>
                      <Switch checked={agentToggles[a.key]} onCheckedChange={(v) => handleToggle(a.key, v)} />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ─── BRANDING TAB ─── */}
            <TabsContent value="branding" className="space-y-4">
              <Card className="border-border">
                <CardHeader><CardTitle className="text-base flex items-center gap-2"><Palette className="h-4 w-4" /> Brand Colors</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs">Primary Color</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="h-9 w-12 rounded border border-border cursor-pointer" />
                        <Input value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="flex-1 text-xs" />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs">Accent Color</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <input type="color" value={accentColor} onChange={(e) => setAccentColor(e.target.value)} className="h-9 w-12 rounded border border-border cursor-pointer" />
                        <Input value={accentColor} onChange={(e) => setAccentColor(e.target.value)} className="flex-1 text-xs" />
                      </div>
                    </div>
                  </div>

                  {/* Live preview card */}
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-muted-foreground">Live Preview</Label>
                    <div className="rounded-xl overflow-hidden border border-border" style={{ background: accentColor }}>
                      <div className="p-5 space-y-3">
                        <div className="flex items-center gap-2">
                          <div className="size-8 rounded-full flex items-center justify-center" style={{ background: primaryColor }}>
                            <Sparkles className="size-4 text-white" />
                          </div>
                          <span className="text-sm font-bold" style={{ color: primaryColor }}>
                            {funnel?.brand_config?.headline || "Your Quiz Funnel"}
                          </span>
                        </div>
                        <p className="text-xs opacity-70" style={{ color: "#fff" }}>
                          {funnel?.brand_config?.description || "Answer a few questions to get your personalized score."}
                        </p>
                        <div className="flex gap-2">
                          <div className="h-7 rounded-md px-3 flex items-center text-[11px] font-medium text-white" style={{ background: primaryColor }}>
                            Begin Assessment →
                          </div>
                          <div className="h-7 rounded-md px-3 flex items-center text-[11px] border" style={{ borderColor: primaryColor, color: primaryColor }}>
                            Learn More
                          </div>
                        </div>
                        <div className="h-1.5 rounded-full overflow-hidden bg-white/10 mt-2">
                          <div className="h-full rounded-full w-2/3 transition-all" style={{ background: primaryColor }} />
                        </div>
                      </div>
                      {/* Swatch strip */}
                      <div className="flex border-t border-white/10">
                        <div className="flex-1 py-2 text-center text-[10px] font-medium text-white/60">
                          Primary
                          <div className="mx-auto mt-1 size-5 rounded-full border border-white/20" style={{ background: primaryColor }} />
                        </div>
                        <div className="flex-1 py-2 text-center text-[10px] font-medium text-white/60">
                          Accent
                          <div className="mx-auto mt-1 size-5 rounded-full border border-white/20" style={{ background: accentColor }} />
                        </div>
                        <div className="flex-1 py-2 text-center text-[10px] font-medium text-white/60">
                          Contrast
                          <div className="mx-auto mt-1 size-5 rounded-full border border-white/20" style={{ background: "#ffffff" }} />
                        </div>
                      </div>
                    </div>
                  </div>

                  <Button onClick={updateColors} disabled={!funnel} className="gap-2">
                    <Palette className="h-4 w-4" /> Save Colors
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
}
