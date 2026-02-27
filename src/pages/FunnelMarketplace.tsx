import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2, Download, Eye, Sparkles, Scale, Dumbbell, Home, Stethoscope,
  Users, Brain, Briefcase, Store,
} from "lucide-react";
import { motion } from "framer-motion";

interface Template {
  id: string;
  title: string;
  description: string | null;
  niche: string;
  quiz_config: any;
  downloads: number;
  price_cents: number;
}

const NICHE_ICONS: Record<string, any> = {
  lawyer: Scale,
  fitness: Dumbbell,
  real_estate: Home,
  dentist: Stethoscope,
  mlm: Users,
  coaching: Brain,
  affiliate: Briefcase,
  home_business: Store,
};

const NICHE_COLORS: Record<string, string> = {
  lawyer: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  fitness: "bg-green-500/10 text-green-400 border-green-500/20",
  real_estate: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  dentist: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  mlm: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  coaching: "bg-pink-500/10 text-pink-400 border-pink-500/20",
  affiliate: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  home_business: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
};

export default function FunnelMarketplace() {
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [cloning, setCloning] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) navigate("/login", { replace: true });
  }, [user, loading, navigate]);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    const { data } = await supabase
      .from("funnel_templates")
      .select("*")
      .order("downloads", { ascending: false });
    if (data) setTemplates(data as Template[]);
    setLoadingTemplates(false);
  };

  const cloneTemplate = async (template: Template) => {
    if (!user) return;
    setCloning(template.id);
    try {
      const slug = `${template.niche}-${user.id.slice(0, 8)}-${Date.now().toString(36)}`;
      
      const { error } = await supabase.from("user_funnels").insert({
        user_id: user.id,
        title: template.title,
        slug,
        template_id: template.id,
        quiz_config: template.quiz_config,
        brand_config: {
          niche: template.niche,
          headline: template.title,
          description: template.description || "Take the quiz to get your personalized results.",
          primary_color: "#d4af37",
          accent_color: "#1a1a2e",
        },
        status: "active",
        completion_action: "ai_pick",
      });

      if (error) throw error;

      // Increment download count
      await supabase.from("funnel_templates").update({
        downloads: template.downloads + 1,
      }).eq("id", template.id);

      // Update niche on profile
      await supabase.from("profiles").update({ niche: template.niche }).eq("id", user.id);

      toast({ title: "Funnel created!", description: "Your funnel is live. Customize it in the Funnels page." });
      navigate("/funnels");
    } catch (e: any) {
      toast({ title: "Clone failed", description: e.message, variant: "destructive" });
    } finally {
      setCloning(null);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
    </div>
  );
  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-20">
        <div className="container max-w-5xl">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Store className="size-5 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Funnel Templates</h1>
                <p className="text-sm text-muted-foreground">Premade quiz funnels with AI-powered completion actions. Clone and customize.</p>
              </div>
            </div>
          </motion.div>

          {/* AI Action Explainer */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8 p-4 rounded-xl border border-primary/20 bg-primary/5"
          >
            <div className="flex items-start gap-3">
              <Sparkles className="size-5 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-foreground">AI-Powered Completion Actions</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Each funnel uses AI to pick the best next step after quiz completion — book a consultation, 
                  schedule a session, send a report, or trigger a callback — all based on the lead's score and answers.
                </p>
              </div>
            </div>
          </motion.div>

          {loadingTemplates ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {templates.map((t, i) => {
                const Icon = NICHE_ICONS[t.niche] || Sparkles;
                const colorClass = NICHE_COLORS[t.niche] || "bg-muted text-muted-foreground";
                const questionCount = (t.quiz_config as any)?.questions?.length || 0;
                const actions = (t.quiz_config as any)?.completion_actions || [];

                return (
                  <motion.div
                    key={t.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08 }}
                  >
                    <Card className="border-border hover:border-primary/30 transition-all group h-full">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`size-10 rounded-lg flex items-center justify-center border ${colorClass}`}>
                              <Icon className="size-5" />
                            </div>
                            <div>
                              <CardTitle className="text-base">{t.title}</CardTitle>
                              <Badge variant="outline" className="text-[10px] mt-1 capitalize">
                                {t.niche.replace("_", " ")}
                              </Badge>
                            </div>
                          </div>
                          {t.price_cents === 0 && (
                            <Badge className="bg-green-500/10 text-green-400 border-green-500/20 text-[10px]">
                              Free
                            </Badge>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {t.description}
                        </p>

                        {/* Stats */}
                        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                          <span>{questionCount} questions</span>
                          <span>•</span>
                          <span>{actions.length} AI actions</span>
                          <span>•</span>
                          <span>{t.downloads} clones</span>
                        </div>

                        {/* AI Actions Preview */}
                        {actions.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {actions.map((a: string) => (
                              <Badge key={a} variant="secondary" className="text-[10px] font-normal capitalize">
                                {a.replace(/_/g, " ")}
                              </Badge>
                            ))}
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex items-center gap-2 pt-1">
                          <Button
                            size="sm"
                            onClick={() => cloneTemplate(t)}
                            disabled={cloning === t.id}
                            className="gap-1.5 text-xs flex-1"
                          >
                            {cloning === t.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Download className="h-3 w-3" />
                            )}
                            Clone & Customize
                          </Button>
                          <Button size="sm" variant="outline" className="gap-1.5 text-xs" asChild>
                            <a href={`/demo/${t.niche}`} target="_blank" rel="noopener noreferrer">
                              <Eye className="h-3 w-3" /> Preview
                            </a>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
