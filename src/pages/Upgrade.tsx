import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Navbar } from "@/components/Navbar";
import { useAuth, PLAN_TIERS, type PlanTier } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Check, Zap, Rocket, Crown, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

const plans = [
  {
    key: "starter" as const,
    icon: Zap,
    features: [
      "3 Quiz Funnels",
      "100 Leads / month",
      "50 SMS / month",
      "3 Workflows / month",
      "1 Campaign",
      "Email support",
    ],
  },
  {
    key: "growth" as const,
    icon: Rocket,
    popular: true,
    features: [
      "Unlimited Funnels",
      "500 Leads / month",
      "200 SMS / month",
      "20 Voice Calls / month",
      "10 Workflows / month",
      "5 Campaigns",
      "Priority support",
    ],
  },
  {
    key: "scale" as const,
    icon: Crown,
    features: [
      "Everything in Growth",
      "2,000 Leads / month",
      "Unlimited SMS",
      "Unlimited Voice Calls",
      "Unlimited Workflows",
      "Unlimited Campaigns",
      "White-label ready",
      "Dedicated success manager",
    ],
  },
];

export default function Upgrade() {
  const { user, subscribed, planTier, subLoading, refreshSubscription, loading } = useAuth();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Choose Your Plan | PFSW";
  }, []);

  // Handle returning from checkout
  useEffect(() => {
    if (searchParams.get("checkout") === "success") {
      refreshSubscription();
      toast({ title: "Payment successful!", description: "Your plan is now active." });
    }
  }, [searchParams, refreshSubscription, toast]);

  const handleCheckout = async (priceId: string, tierKey: string) => {
    if (!user) return;
    setCheckoutLoading(tierKey);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { price_id: priceId },
      });
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (e: any) {
      toast({ title: "Checkout failed", description: e.message, variant: "destructive" });
    } finally {
      setCheckoutLoading(null);
    }
  };

  const handleManage = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal");
      if (error) throw error;
      if (data?.url) window.open(data.url, "_blank");
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  if (loading || subLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-20">
        <div className="container max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <p className="text-xs uppercase tracking-[0.4em] text-primary mb-4">Choose Your Plan</p>
            <h1 className="font-serif text-4xl sm:text-5xl font-bold text-foreground mb-4">
              Unlock Your <span className="text-primary">Growth Engine</span>
            </h1>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Select the plan that fits your business. Upgrade or downgrade anytime.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {plans.map((plan, i) => {
              const tier = PLAN_TIERS[plan.key];
              const isCurrentPlan = planTier === plan.key;
              const Icon = plan.icon;

              return (
                <motion.div
                  key={plan.key}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Card className={`relative bg-card border-border overflow-hidden h-full ${
                    plan.popular ? "border-primary ring-1 ring-primary/20" : ""
                  } ${isCurrentPlan ? "border-emerald-500 ring-1 ring-emerald-500/20" : ""}`}>
                    {plan.popular && !isCurrentPlan && (
                      <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-[10px] font-bold px-3 py-1 rounded-bl-lg uppercase tracking-wider">
                        Popular
                      </div>
                    )}
                    {isCurrentPlan && (
                      <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg uppercase tracking-wider">
                        Your Plan
                      </div>
                    )}
                    <CardContent className="p-6 flex flex-col h-full">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                          <Icon className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-foreground">{tier.name}</h3>
                          <p className="text-2xl font-black text-foreground">
                            ${(tier.price / 100).toFixed(0)}
                            <span className="text-sm font-normal text-muted-foreground">/mo</span>
                          </p>
                        </div>
                      </div>

                      <ul className="space-y-2.5 mb-6 flex-1">
                        {plan.features.map((f) => (
                          <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                            <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                            {f}
                          </li>
                        ))}
                      </ul>

                      {isCurrentPlan ? (
                        <Button variant="outline" onClick={handleManage} className="w-full">
                          Manage Plan
                        </Button>
                      ) : (
                        <Button
                          onClick={() => handleCheckout(tier.price_id, plan.key)}
                          disabled={!!checkoutLoading}
                          className={`w-full ${plan.popular ? "gold-glow-strong" : ""}`}
                        >
                          {checkoutLoading === plan.key ? (
                            <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Processing...</>
                          ) : (
                            `Get ${tier.name}`
                          )}
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          {subscribed && (
            <div className="text-center mt-8">
              <Button variant="ghost" onClick={handleManage} className="text-muted-foreground">
                Manage billing & invoices →
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
