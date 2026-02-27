import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Copy, Check, Loader2, Rocket, Link2, UserPlus, Zap } from "lucide-react";
import { motion } from "framer-motion";

export default function Partner() {
  const { user, loading, signup, login } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [affiliateUrl, setAffiliateUrl] = useState("");
  const [isLogin, setIsLogin] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [funnelUrl, setFunnelUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleAuth = async () => {
    if (!email || !password) {
      toast({ title: "Missing fields", description: "Enter email and password.", variant: "destructive" });
      return;
    }
    if (!affiliateUrl.includes("elyt")) {
      toast({ title: "Invalid link", description: "Paste your ELYT affiliate/referral link.", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await signup(email, password);
        toast({ title: "Check your email", description: "Confirm your account then come back to this page." });
        setSubmitting(false);
        return;
      }

      // Wait for session
      await new Promise((r) => setTimeout(r, 1500));

      // Save affiliate URL to profile
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      await supabase
        .from("profiles")
        .update({ affiliate_url: affiliateUrl, niche: "travel_mlm" })
        .eq("id", session.user.id);

      // Create or get partner funnel
      const slug = `elyt-${session.user.id.slice(0, 8)}`;

      const { data: existing } = await supabase
        .from("user_funnels")
        .select("slug")
        .eq("user_id", session.user.id)
        .eq("partner_mode", true)
        .maybeSingle();

      if (!existing) {
        await supabase.from("user_funnels").insert({
          user_id: session.user.id,
          title: "ELYT Travel Quiz",
          slug,
          partner_mode: true,
          affiliate_url: affiliateUrl,
          completion_action: "callback",
          brand_config: {
            niche: "travel_mlm",
            headline: "Discover Your Dream Travel Lifestyle",
            description: "Take the quiz to see if the ELYT travel membership is right for you.",
            primary_color: "#d4af37",
            accent_color: "#1a1a2e",
          },
          quiz_config: {
            questions: [
              { id: "q1", question: "How often do you travel per year?", type: "single", options: ["0-1 times", "2-4 times", "5+ times"] },
              { id: "q2", question: "Are you open to earning income while you travel?", type: "single", options: ["Absolutely", "Maybe", "Not interested"] },
              { id: "q3", question: "What's your ideal monthly travel budget?", type: "single", options: ["Under $500", "$500-$1500", "$1500+"] },
              { id: "q4", question: "Would you share travel deals with friends for commissions?", type: "single", options: ["Yes, definitely", "I'd consider it", "Probably not"] },
              { id: "q5", question: "What matters most to you?", type: "single", options: ["Luxury for less", "Building passive income", "Both equally"] },
            ],
          },
          status: "active",
        });
      }

      const finalSlug = existing?.slug || slug;
      const url = `https://peoplefailsystemswork.com/f/${finalSlug}`;
      setFunnelUrl(url);

      toast({ title: "You're live!", description: "Your branded funnel is ready to share." });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const copyUrl = () => {
    if (!funnelUrl) return;
    navigator.clipboard.writeText(funnelUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Copied!", description: "Share this link with your prospects." });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 mb-4">
            <Rocket className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">ELYT Partner Program</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
            Get Your Branded Quiz Funnel
          </h1>
          <p className="text-muted-foreground text-lg max-w-md mx-auto">
            Sign up, paste your ELYT link, and start collecting leads in under 60 seconds.
          </p>
        </motion.div>

        {/* Steps indicator */}
        <div className="flex items-center justify-center gap-3 mb-8">
          {[
            { icon: UserPlus, label: "Create Account" },
            { icon: Link2, label: "Paste Ref Link" },
            { icon: Zap, label: "Get Funnel URL" },
          ].map((step, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold ${
                funnelUrl
                  ? "bg-primary text-primary-foreground"
                  : i === 0
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
              }`}>
                <step.icon className="h-4 w-4" />
              </div>
              <span className="text-xs text-muted-foreground hidden sm:inline">{step.label}</span>
              {i < 2 && <div className="w-8 h-px bg-border" />}
            </div>
          ))}
        </div>

        {funnelUrl ? (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
            <Card className="border-primary/30 bg-card">
              <CardHeader className="text-center">
                <div className="mx-auto mb-3 h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
                  <Check className="h-7 w-7 text-primary" />
                </div>
                <CardTitle className="text-xl">Your Funnel Is Live! 🎉</CardTitle>
                <CardDescription>Share this link with your prospects. When they complete the quiz and call in, they'll receive your ELYT link via text.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <Input readOnly value={funnelUrl} className="font-mono text-sm bg-muted" />
                  <Button size="icon" variant="outline" onClick={copyUrl}>
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button className="flex-1" onClick={() => navigate("/dashboard")}>
                    Go to Dashboard
                  </Button>
                  <Button variant="outline" className="flex-1" onClick={() => window.open(funnelUrl, "_blank")}>
                    Preview Funnel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>{isLogin ? "Log In" : "Create Your Account"}</CardTitle>
              <CardDescription>
                {isLogin
                  ? "Welcome back — log in to generate your funnel."
                  : "One account. One link. Unlimited leads."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="affiliate">Your ELYT Referral Link</Label>
                <Input
                  id="affiliate"
                  type="url"
                  placeholder="https://www.elytlifestyle.com/?ref=yourname"
                  value={affiliateUrl}
                  onChange={(e) => setAffiliateUrl(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">Paste the referral link from your ELYT back office.</p>
              </div>

              <Button className="w-full" onClick={handleAuth} disabled={submitting}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {isLogin ? "Log In & Get My Funnel" : "Sign Up & Get My Funnel"}
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
                <button className="text-primary hover:underline" onClick={() => setIsLogin(!isLogin)}>
                  {isLogin ? "Sign up" : "Log in"}
                </button>
              </p>
            </CardContent>
          </Card>
        )}
      </main>
      <Footer />
    </div>
  );
}
