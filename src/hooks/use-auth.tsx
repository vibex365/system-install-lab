import { useState, useEffect, useCallback, createContext, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { track } from "@/lib/analytics";
import type { Tables } from "@/integrations/supabase/types";

type Profile = Tables<"profiles">;

type AppRole = "chief_architect" | "architect_lead" | "member";

interface AuthState {
  user: { id: string; email: string } | null;
  profile: Profile | null;
  role: AppRole;
  isChiefArchitect: boolean;
  isLead: boolean;
  loading: boolean;
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

  const fetchProfile = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    setProfile(data);

    // Check roles in priority order
    const { data: isCA } = await supabase.rpc("has_role", { _user_id: userId, _role: "chief_architect" });
    if (isCA) { setRole("chief_architect"); return; }

    const { data: isLead } = await supabase.rpc("has_role", { _user_id: userId, _role: "architect_lead" });
    if (isLead) { setRole("architect_lead"); return; }

    setRole("member");
  }, []);

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

  const login = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
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
    <AuthContext.Provider value={{ user, profile, role, isChiefArchitect, isLead, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
