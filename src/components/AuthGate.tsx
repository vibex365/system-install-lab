import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";

interface AuthGateProps {
  children: React.ReactNode;
  requireActive?: boolean;
  requireChiefArchitect?: boolean;
  requireLead?: boolean;
  requireAcceptedPending?: boolean;
}

export function AuthGate({ children, requireActive = false, requireChiefArchitect = false, requireLead = false, requireAcceptedPending = false }: AuthGateProps) {
  const { user, profile, isChiefArchitect, isLead, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!user) { navigate("/login", { replace: true }); return; }
    if (requireChiefArchitect && !isChiefArchitect) { navigate("/", { replace: true }); return; }
    if (requireLead && !isLead && !isChiefArchitect) { navigate("/", { replace: true }); return; }
    if (requireAcceptedPending && (profile?.member_status as string) !== "accepted_pending_payment") { navigate("/status", { replace: true }); return; }
    if (requireActive && profile?.member_status !== "active" && !isChiefArchitect) { navigate("/status", { replace: true }); return; }
  }, [user, profile, isChiefArchitect, isLead, loading, navigate, requireActive, requireChiefArchitect, requireLead, requireAcceptedPending]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;
  if (requireChiefArchitect && !isChiefArchitect) return null;
  if (requireLead && !isLead && !isChiefArchitect) return null;
  if (requireAcceptedPending && (profile?.member_status as string) !== "accepted_pending_payment") return null;
  if (requireActive && profile?.member_status !== "active" && !isChiefArchitect) return null;

  return <>{children}</>;
}
