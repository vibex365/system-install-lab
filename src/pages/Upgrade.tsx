import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Navbar } from "@/components/Navbar";
import { useAuth, PLAN_TIERS, type PlanTier } from "@/hooks/use-auth";
import { useUsage } from "@/hooks/use-usage";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Check, Rocket, Crown, Loader2, Plus, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { CREDIT_PACKS, RESOURCE_LABELS, type CreditPack } from "@/lib/credit-packs";

const plans = [
  {
    key: "growth" as const,
    icon: Rocket,
    popular: true,
    features: [
      "Unlimited Funnels",
      "500 Leads / month",
      "200 SMS / month",
      "20 Voice Calls / month",
      "5 Workflows / month",
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

// Group credit packs by resource type
const groupedPacks = Object.entries(
  CREDIT_PACKS.reduce((acc, pack) => {
    if (!acc[pack.resource]) acc[pack.resource] = [];
    acc[pack.resource].push(pack);
    return acc;
  }, {} as Record<string, CreditPack[]>)
);

export default function Upgrade() {
  const { user, subscribed, planTier, subLoading, refreshSubscription, loading } = useAuth();
  const { bonus, refreshUsage } = useUsage();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [creditLoading, setCreditLoading] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Choose Your Plan | PFSW";
  }, []);

  // Handle returning from plan checkout
  useEffect(() => {
    if (searchParams.get("checkout") === "success") {
      refreshSubscription();
      toast({ title: "Payment successful!", description: "Your plan is now active." });
    }
  }, [searchParams, refreshSubscription, toast]);

  // Handle returning from credit checkout
  useEffect(() => {
    const creditCheckout = searchParams.get("credit_checkout");
    const sessionId = searchParams.get("session_id");
    const packKey = searchParams.get("pack");

    if (creditCheckout === "success" && sessionId && packKey) {
      // Verify and redeem credits
      (async () => {
        try {
          const { data, error } = await supabase.functions.invoke("verify-credit-purchase", {
            body: { session_id: sessionId, pack_key: packKey },
          });
          if (error) throw error;
          if (data?.already_redeemed) {
            toast({ title: "Credits already added", description: "This purchase was already redeemed." });
          } else {
            toast({ title: "Credits added! 🎉", description: `${data.credits} ${data.resource.replace(/_/g, " ")} credits added to your account.` });
          }
          refreshUsage();
        } catch (e: any) {
          toast({ title: "Credit verification failed", description: e.message, variant: "destructive" });
        }
      })();
      // Clean URL
      searchParams.delete("credit_checkout");
      searchParams.delete("session_id");
      searchParams.delete("pack");
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams, toast, refreshUsage]);

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

  const handleCreditPurchase = async (pack: CreditPack) => {
    if (!user) return;
    setCreditLoading(pack.key);
    try {
      const { data, error } = await supabase.functions.invoke("create-credit-checkout", {
        body: { price_id: pack.price_id, pack_key: pack.key },
      });
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (e: any) {
      toast({ title: "Checkout failed", description: e.message, variant: "destructive" });
    } finally {
      setCreditLoading(null);
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
          {/* Plan Section */}
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

          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
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
                      <div className="absolute top-0 right-0 bg-emerald-500 text-foreground text-[10px] font-bold px-3 py-1 rounded-bl-lg uppercase tracking-wider">
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
                            ${tier.price}
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

          {/* Credit Packs Section */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-20"
          >
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 mb-4">
                <Zap className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs font-medium text-primary tracking-wide">Top-Up Credits</span>
              </div>
              <h2 className="text-3xl font-bold text-foreground mb-2">Need More?</h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                Buy credit packs when you hit your plan limits. Credits never expire.
              </p>
            </div>

            {/* Current bonus credits summary */}
            {subscribed && (bonus.leads > 0 || bonus.sms > 0 || bonus.voice_calls > 0 || bonus.workflows > 0) && (
              <div className="flex flex-wrap justify-center gap-3 mb-8">
                {Object.entries(bonus).map(([key, val]) =>
                  val > 0 ? (
                    <div key={key} className="rounded-full bg-primary/10 border border-primary/20 px-4 py-1.5 text-xs font-semibold text-primary">
                      {val} bonus {RESOURCE_LABELS[key] || key}
                    </div>
                  ) : null
                )}
              </div>
            )}

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-4xl mx-auto">
              {groupedPacks.map(([resource, packs]) => (
                <Card key={resource} className="bg-card border-border overflow-hidden">
                  <CardContent className="p-5">
                    <h3 className="text-sm font-bold text-foreground mb-1 uppercase tracking-wider">
                      {RESOURCE_LABELS[resource] || resource}
                    </h3>
                    <div className="space-y-3 mt-4">
                      {packs.map((pack) => (
                        <div key={pack.key} className="flex items-center justify-between gap-2">
                          <div>
                            <p className="text-sm font-semibold text-foreground">{pack.label}</p>
                            <p className="text-xs text-muted-foreground">${pack.price}</p>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            className="shrink-0 h-8 px-3"
                            onClick={() => handleCreditPurchase(pack)}
                            disabled={!!creditLoading}
                          >
                            {creditLoading === pack.key ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <><Plus className="h-3 w-3 mr-1" /> Buy</>
                            )}
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
