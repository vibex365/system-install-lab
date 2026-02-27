import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";

/**
 * Gates routes behind an active subscription.
 * Admins (chief_architect) always pass through.
 * Non-subscribed users get redirected to /upgrade.
 */
export function PlanGate({ children }: { children: React.ReactNode }) {
  const { user, subscribed, subLoading, isChiefArchitect, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading || subLoading) return;
    if (!user) { navigate("/login", { replace: true }); return; }
    if (isChiefArchitect) return; // admin always passes
    if (!subscribed) { navigate("/upgrade", { replace: true }); return; }
  }, [user, subscribed, subLoading, isChiefArchitect, loading, navigate]);

  if (loading || subLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;
  if (!isChiefArchitect && !subscribed) return null;

  return <>{children}</>;
}
