import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";

interface AuthGateProps {
  children: React.ReactNode;
  requireActive?: boolean;
  requireAdmin?: boolean;
  requireAcceptedPending?: boolean;
}

export function AuthGate({ children, requireActive = false, requireAdmin = false, requireAcceptedPending = false }: AuthGateProps) {
  const { user, profile, isAdmin, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!user) { navigate("/login", { replace: true }); return; }
    if (requireAdmin && !isAdmin) { navigate("/", { replace: true }); return; }
    if (requireAcceptedPending && (profile?.member_status as string) !== "accepted_pending_payment") { navigate("/status", { replace: true }); return; }
    if (requireActive && profile?.member_status !== "active") { navigate("/status", { replace: true }); return; }
  }, [user, profile, isAdmin, loading, navigate, requireActive, requireAdmin, requireAcceptedPending]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;
  if (requireAdmin && !isAdmin) return null;
  if (requireAcceptedPending && (profile?.member_status as string) !== "accepted_pending_payment") return null;
  if (requireActive && profile?.member_status !== "active") return null;

  return <>{children}</>;
}
