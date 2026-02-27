import { useState, useEffect, useCallback, createContext, useContext } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { track } from "@/lib/analytics";
import type { Tables } from "@/integrations/supabase/types";

type Profile = Tables<"profiles">;

type AppRole = "chief_architect" | "architect_lead" | "member";

// Plan tier config with Stripe product/price IDs and limits
export const PLAN_TIERS = {
  starter: {
    name: "Starter",
    price: 497,
    price_id: "price_1T4j2lAsrgxssNTVI1seOaSF",
    product_id: "prod_U2oggIHaCBOJbk",
    limits: { leads: 100, funnels: 3, sms: 50, voice_calls: 0, workflows: 3, campaigns: 1 },
  },
  growth: {
    name: "Growth",
    price: 997,
    price_id: "price_1T4j2mAsrgxssNTVAgxwbT4v",
    product_id: "prod_U2ogyutSubPFyX",
    limits: { leads: 500, funnels: -1, sms: 200, voice_calls: 20, workflows: 10, campaigns: 5 },
  },
  scale: {
    name: "Scale",
    price: 2500,
    price_id: "price_1T4j2nAsrgxssNTVEJFb8l6Q",
    product_id: "prod_U2ogWvsT0aWj4o",
    limits: { leads: 2000, funnels: -1, sms: -1, voice_calls: -1, workflows: -1, campaigns: -1 },
  },
} as const;

export type PlanTier = keyof typeof PLAN_TIERS | null;

function getTierFromProductId(productId: string | null): PlanTier {
  if (!productId) return null;
  for (const [key, val] of Object.entries(PLAN_TIERS)) {
    if (val.product_id === productId) return key as PlanTier;
  }
  return null;
}

interface AuthState {
  user: { id: string; email: string } | null;
  profile: Profile | null;
  role: AppRole;
  isChiefArchitect: boolean;
  isLead: boolean;
  loading: boolean;
  subscribed: boolean;
  planTier: PlanTier;
  subscriptionEnd: string | null;
  subLoading: boolean;
  refreshSubscription: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthState["user"]>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<AppRole>("member");
  const [loading, setLoading] = useState(true);
  const [justLoggedIn, setJustLoggedIn] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [planTier, setPlanTier] = useState<PlanTier>(null);
  const [subscriptionEnd, setSubscriptionEnd] = useState<string | null>(null);
  const [subLoading, setSubLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  const fetchProfile = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    setProfile(data);

    const { data: isCA } = await supabase.rpc("has_role", { _user_id: userId, _role: "chief_architect" });
    if (isCA) { setRole("chief_architect"); return; }

    const { data: isLead } = await supabase.rpc("has_role", { _user_id: userId, _role: "architect_lead" });
    if (isLead) { setRole("architect_lead"); return; }

    setRole("member");
  }, []);

  const refreshSubscription = useCallback(async () => {
    try {
      setSubLoading(true);
      const { data, error } = await supabase.functions.invoke("check-subscription");
      if (error) throw error;
      setSubscribed(data?.subscribed ?? false);
      setPlanTier(getTierFromProductId(data?.product_id ?? null));
      setSubscriptionEnd(data?.subscription_end ?? null);
    } catch (e) {
      console.error("check-subscription failed:", e);
    } finally {
      setSubLoading(false);
    }
  }, []);

  // Smart redirect after login
  useEffect(() => {
    if (!justLoggedIn || !profile) return;
    setJustLoggedIn(false);
    navigate("/dashboard", { replace: true });
  }, [justLoggedIn, profile, navigate]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          setUser({ id: session.user.id, email: session.user.email! });
          setTimeout(() => fetchProfile(session.user.id), 0);
        } else {
          setUser(null);
          setProfile(null);
          setRole("member");
          setSubscribed(false);
          setPlanTier(null);
          setSubLoading(false);
        }
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser({ id: session.user.id, email: session.user.email! });
        fetchProfile(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  // Check subscription when user is set
  useEffect(() => {
    if (user) {
      refreshSubscription();
    }
  }, [user, refreshSubscription]);

  // Auto-refresh subscription every 60s
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(refreshSubscription, 60000);
    return () => clearInterval(interval);
  }, [user, refreshSubscription]);

  const login = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    setJustLoggedIn(true);
    track("login_success");
  }, []);

  const signup = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin },
    });
    if (error) throw error;
    track("signup_success");
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    track("logout");
  }, []);

  const isChiefArchitect = role === "chief_architect";
  const isLead = role === "architect_lead";

  return (
    <AuthContext.Provider value={{
      user, profile, role, isChiefArchitect, isLead, loading,
      subscribed, planTier, subscriptionEnd, subLoading, refreshSubscription,
      login, signup, logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
