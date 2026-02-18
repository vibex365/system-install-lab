import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { AuthGate } from "@/components/AuthGate";
import { StatusPill } from "@/components/StatusPill";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Clock, CheckCircle, XCircle } from "lucide-react";

export default function Status() {
  const { user, profile } = useAuth();
  const [appDate, setAppDate] = useState<string | null>(null);
  const [hasApp, setHasApp] = useState<boolean | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("applications")
      .select("created_at")
      .or(`user_id.eq.${user.id},email.eq.${user.email}`)
      .order("created_at", { ascending: false })
      .limit(1)
      .then(({ data }) => {
        if (data && data.length > 0) {
          setHasApp(true);
          setAppDate(new Date(data[0].created_at).toLocaleDateString());
        } else {
          setHasApp(false);
        }
      });
  }, [user]);

  const statusConfig = {
    pending: { icon: Clock, label: "Pending Review", color: "text-primary", description: "Your membership is under review. We'll update you soon." },
    active: { icon: CheckCircle, label: "Active", color: "text-green-500", description: "You have full access. Head to your dashboard." },
    inactive: { icon: XCircle, label: "Inactive", color: "text-destructive", description: "Your membership has been deactivated." },
  };

  const status = profile?.member_status ?? "pending";
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <AuthGate>
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-32 pb-20">
          <div className="container max-w-md text-center">
            <Icon className={`h-12 w-12 mx-auto mb-4 ${config.color}`} />
            <h1 className="text-2xl font-bold text-foreground mb-2">Membership Status</h1>
            <StatusPill label={config.label} variant={status === "active" ? "active" : "muted"} />
            <p className="text-muted-foreground mt-4 mb-6">{config.description}</p>

            {appDate && (
              <p className="text-xs text-muted-foreground mb-4">Applied on {appDate}</p>
            )}

            {hasApp === false && (
              <Button asChild className="mb-4">
                <Link to="/apply">Submit an Application</Link>
              </Button>
            )}

            {status === "active" && (
              <Button asChild>
                <Link to="/dashboard">Go to Dashboard</Link>
              </Button>
            )}

            <div className="mt-6">
              <Button asChild variant="ghost" size="sm">
                <Link to="/">Back to Home</Link>
              </Button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </AuthGate>
  );
}
