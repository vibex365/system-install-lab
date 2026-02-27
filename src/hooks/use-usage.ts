import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, PLAN_TIERS } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

interface UsageData {
  leads_used: number;
  funnels_used: number;
  sms_used: number;
  voice_calls_used: number;
  workflows_used: number;
  campaigns_used: number;
}

interface UsageLimits {
  leads: number;
  funnels: number;
  sms: number;
  voice_calls: number;
  workflows: number;
  campaigns: number;
}

interface BonusCredits {
  leads: number;
  sms: number;
  voice_calls: number;
  workflows: number;
}

export function useUsage() {
  const { user, planTier, isChiefArchitect } = useAuth();
  const { toast } = useToast();
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [bonus, setBonus] = useState<BonusCredits>({ leads: 0, sms: 0, voice_calls: 0, workflows: 0 });
  const [loading, setLoading] = useState(true);

  const limits: UsageLimits = planTier
    ? PLAN_TIERS[planTier].limits
    : { leads: 0, funnels: 0, sms: 0, voice_calls: 0, workflows: 0, campaigns: 0 };

  const fetchUsage = useCallback(async () => {
    if (!user) return;
    // Fetch plan usage
    const { data } = await supabase.rpc("get_or_create_usage", { p_user_id: user.id });
    if (data) {
      setUsage({
        leads_used: (data as any).leads_used || 0,
        funnels_used: (data as any).funnels_used || 0,
        sms_used: (data as any).sms_used || 0,
        voice_calls_used: (data as any).voice_calls_used || 0,
        workflows_used: (data as any).workflows_used || 0,
        campaigns_used: (data as any).campaigns_used || 0,
      });
    }

    // Fetch purchased credit balances
    const { data: credits } = await supabase
      .from("credit_purchases")
      .select("resource_type, credits_remaining")
      .eq("user_id", user.id)
      .gt("credits_remaining", 0);

    const bonusTotals: BonusCredits = { leads: 0, sms: 0, voice_calls: 0, workflows: 0 };
    if (credits) {
      for (const c of credits) {
        const key = c.resource_type as keyof BonusCredits;
        if (key in bonusTotals) {
          bonusTotals[key] += c.credits_remaining;
        }
      }
    }
    setBonus(bonusTotals);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchUsage();
  }, [fetchUsage]);

  /** Effective limit = plan limit + bonus credits. -1 means unlimited. */
  const effectiveLimit = useCallback(
    (resource: keyof UsageLimits): number => {
      const planLimit = limits[resource];
      if (planLimit === -1) return -1;
      const bonusKey = resource as keyof BonusCredits;
      const bonusAmount = bonusKey in bonus ? bonus[bonusKey] : 0;
      return planLimit + bonusAmount;
    },
    [limits, bonus]
  );

  /** Check if a resource can be used. Returns true if allowed, false + toast if over limit. */
  const canUse = useCallback(
    (resource: keyof UsageLimits, increment = 1): boolean => {
      if (isChiefArchitect) return true;
      if (!usage) return false;
      const limit = effectiveLimit(resource);
      if (limit === -1) return true;
      const usedKey = `${resource}_used` as keyof UsageData;
      const current = usage[usedKey] || 0;
      if (current + increment > limit) {
        toast({
          title: "Plan limit reached",
          description: `You've hit your ${resource.replace(/_/g, " ")} limit (${limit}). Buy more credits or upgrade your plan.`,
          variant: "destructive",
        });
        return false;
      }
      return true;
    },
    [usage, effectiveLimit, isChiefArchitect, toast]
  );

  /** Increment usage for a resource after successful action. Deducts from bonus credits first if over plan limit. */
  const incrementUsage = useCallback(
    async (resource: keyof UsageLimits, amount = 1) => {
      if (!user) return;
      const col = `${resource}_used`;
      const current = usage ? (usage as any)[col] || 0 : 0;
      const planLimit = limits[resource];

      // If over plan limit, deduct from purchased credits
      if (planLimit !== -1 && current + amount > planLimit) {
        const overAmount = current + amount - planLimit;
        const bonusKey = resource as keyof BonusCredits;
        if (bonusKey in bonus && bonus[bonusKey] >= overAmount) {
          // Find oldest credit purchase with remaining credits and decrement
          const { data: packs } = await supabase
            .from("credit_purchases")
            .select("id, credits_remaining")
            .eq("user_id", user.id)
            .eq("resource_type", resource)
            .gt("credits_remaining", 0)
            .order("purchased_at", { ascending: true });

          let toDeduct = overAmount;
          if (packs) {
            for (const pack of packs) {
              if (toDeduct <= 0) break;
              const deductFromPack = Math.min(toDeduct, pack.credits_remaining);
              await supabase
                .from("credit_purchases")
                .update({ credits_remaining: pack.credits_remaining - deductFromPack })
                .eq("id", pack.id);
              toDeduct -= deductFromPack;
            }
          }
        }
      }

      // Always increment usage counter
      await supabase
        .from("usage_tracking")
        .update({ [col]: current + amount } as any)
        .eq("user_id", user.id)
        .gte("period_start", new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString());

      setUsage((prev) =>
        prev ? { ...prev, [col]: (prev as any)[col] + amount } : prev
      );
    },
    [user, usage, limits, bonus]
  );

  return { usage, limits, bonus, loading, canUse, incrementUsage, refreshUsage: fetchUsage, effectiveLimit };
}
