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

export function useUsage() {
  const { user, planTier, isChiefArchitect } = useAuth();
  const { toast } = useToast();
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);

  const limits: UsageLimits = planTier
    ? PLAN_TIERS[planTier].limits
    : { leads: 0, funnels: 0, sms: 0, voice_calls: 0, workflows: 0, campaigns: 0 };

  const fetchUsage = useCallback(async () => {
    if (!user) return;
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
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchUsage();
  }, [fetchUsage]);

  /** Check if a resource can be used. Returns true if allowed, false + toast if over limit. */
  const canUse = useCallback(
    (resource: keyof UsageLimits, increment = 1): boolean => {
      if (isChiefArchitect) return true; // admin bypass
      if (!usage) return false;
      const limit = limits[resource];
      if (limit === -1) return true; // unlimited
      const usedKey = `${resource}_used` as keyof UsageData;
      const current = usage[usedKey] || 0;
      if (current + increment > limit) {
        toast({
          title: "Plan limit reached",
          description: `You've hit your ${resource.replace(/_/g, " ")} limit (${limit}). Upgrade your plan for more.`,
          variant: "destructive",
        });
        return false;
      }
      return true;
    },
    [usage, limits, isChiefArchitect, toast]
  );

  /** Increment usage for a resource after successful action */
  const incrementUsage = useCallback(
    async (resource: keyof UsageLimits, amount = 1) => {
      if (!user) return;
      const col = `${resource}_used`;
      const current = usage ? (usage as any)[col] || 0 : 0;
      await supabase
        .from("usage_tracking")
        .update({ [col]: current + amount } as any)
        .eq("user_id", user.id)
        .gte("period_start", new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString());
      setUsage((prev) =>
        prev ? { ...prev, [col]: (prev as any)[col] + amount } : prev
      );
    },
    [user, usage]
  );

  return { usage, limits, loading, canUse, incrementUsage, refreshUsage: fetchUsage };
}
