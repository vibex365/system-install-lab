import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { Clock, CheckCircle, AlertCircle } from "lucide-react";

export default function ApplicationUnderReview() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [verifying, setVerifying] = useState(!!sessionId);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) return;

    const verifyPayment = async () => {
      try {
        // Get stored application data
        const stored = localStorage.getItem("pfsw_application_data");
        if (!stored) {
          setError("Application data not found. Please try applying again.");
          setVerifying(false);
          return;
        }

        const applicationData = JSON.parse(stored);

        // Verify payment and insert application
        const { data, error: fnError } = await supabase.functions.invoke("verify-application-payment", {
          body: { session_id: sessionId, application_data: applicationData },
        });

        if (fnError) throw fnError;
        if (data?.error) throw new Error(data.error);

        // Clear stored data
        localStorage.removeItem("pfsw_application_data");
        setVerified(true);
      } catch (err: any) {
        console.error("Verification error:", err);
        setError(err.message || "Failed to verify payment");
      } finally {
        setVerifying(false);
      }
    };

    verifyPayment();
  }, [sessionId]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 flex items-center justify-center px-6">
        <div className="max-w-md text-center">
          {verifying ? (
            <>
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-6">
                <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
              <h1 className="text-3xl font-black tracking-tight text-foreground mb-4">
                Verifying Payment...
              </h1>
              <p className="text-muted-foreground leading-relaxed">
                Please wait while we confirm your payment.
              </p>
            </>
          ) : error ? (
            <>
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 mb-6">
                <AlertCircle className="h-8 w-8 text-destructive" />
              </div>
              <h1 className="text-3xl font-black tracking-tight text-foreground mb-4">
                Something Went Wrong
              </h1>
              <p className="text-muted-foreground leading-relaxed mb-6">{error}</p>
              <Button asChild>
                <Link to="/apply">Try Again</Link>
              </Button>
            </>
          ) : (
            <>
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-6">
                {verified ? (
                  <CheckCircle className="h-8 w-8 text-primary" />
                ) : (
                  <Clock className="h-8 w-8 text-primary" />
                )}
              </div>

              <h1 className="text-3xl font-black tracking-tight text-foreground mb-4">
                Your Application Is Under Review
              </h1>

              {verified && (
                <p className="text-sm text-primary font-medium mb-2">
                  Payment confirmed. Application submitted.
                </p>
              )}

              <p className="text-muted-foreground leading-relaxed mb-2">
                We review every applicant manually.
              </p>
              <p className="text-muted-foreground leading-relaxed mb-10">
                If selected, you'll receive a text message.
              </p>

              <div className="flex flex-col gap-3">
                <Button asChild variant="outline" className="border-border text-foreground hover:bg-muted">
                  <Link to="/">Back to Home</Link>
                </Button>
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
