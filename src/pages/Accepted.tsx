import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { AuthGate } from "@/components/AuthGate";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function Accepted() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [basePrice, setBasePrice] = useState<number>(500);
  const [foundingOpen, setFoundingOpen] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase
      .from("system_meta")
      .select("base_price, founding_access_open")
      .limit(1)
      .single()
      .then(({ data }) => {
        if (data) {
          setBasePrice(data.base_price);
          setFoundingOpen(data.founding_access_open);
        }
      });
  }, []);

  const handleAccept = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-membership-checkout", {
        body: {
          success_url: `${window.location.origin}/dashboard?membership_session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${window.location.origin}/accepted`,
        },
      });
      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
      setLoading(false);
    }
  };

  const handleRelease = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ member_status: "inactive" as any })
        .eq("id", user.id);
      if (error) throw error;
      toast({ title: "Spot released" });
      navigate("/status");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
      setLoading(false);
    }
  };

  const priceDisplay = `$${(basePrice / 100).toFixed(0)}`;

  const GoldDivider = () => (
    <div className="flex items-center justify-center py-12">
      <div className="h-px w-16 bg-gradient-to-r from-transparent via-primary to-transparent" />
    </div>
  );

  return (
    <AuthGate requireAcceptedPending>
      <div className="min-h-screen bg-background">
        <div className="max-w-2xl mx-auto px-6 py-20">
          {/* Section 1 */}
          <section className="pt-20 pb-8">
            <p className="text-xs uppercase tracking-[0.3em] text-primary mb-6">Private Invitation</p>
            <h1 className="font-serif text-5xl sm:text-6xl font-bold text-foreground leading-tight mb-6">
              You Were Selected.
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Out of every applicant reviewed, you were chosen. Not because of what you've built — but because of what you're capable of building with the right system behind you.
            </p>
          </section>
          <GoldDivider />
          <section className="py-8">
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-foreground mb-6">Why You.</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">We don't accept everyone. We accept people who have demonstrated the raw signal of someone who will execute — when given structure.</p>
            <p className="text-muted-foreground leading-relaxed">Your application showed us enough. The depth of your answers. The honesty about what's broken. The willingness to submit to a process. That's rare.</p>
          </section>
          <GoldDivider />
          <section className="py-8">
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-foreground mb-6">People Fail.<br /><span className="text-primary">Systems Work.</span></h2>
            <p className="text-muted-foreground leading-relaxed mb-4">You don't need more motivation. You don't need another course. You don't need a community that tells you you're doing great when you're not.</p>
            <p className="text-muted-foreground leading-relaxed">You need a system that holds you accountable. One that makes execution inevitable — not optional.</p>
          </section>
          <GoldDivider />
          <section className="py-8">
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-foreground mb-6">What This Actually Is.</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">PFSW is not a community. It's not a mastermind. It's not a network.</p>
            <p className="text-muted-foreground leading-relaxed mb-4">It's an execution infrastructure. A controlled environment where serious builders operate under structure, accountability, and weekly review cycles.</p>
            <p className="text-muted-foreground leading-relaxed">You ship. You review. You iterate. Or you don't belong here.</p>
          </section>
          <GoldDivider />
          <section className="py-8">
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-foreground mb-6">What Changes.</h2>
            <div className="space-y-4 text-muted-foreground leading-relaxed">
              <p>Your weekly output becomes measurable and visible.</p>
              <p>Your bottlenecks get named, addressed, and eliminated systematically.</p>
              <p>Your execution cadence becomes non-negotiable — not aspirational.</p>
              <p>You stop operating on hope and start operating on systems.</p>
            </div>
          </section>
          <GoldDivider />
          <section className="py-8">
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-foreground mb-6">The Founding Standard.</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              {foundingOpen
                ? "You're entering as a Founding Member. This tier exists only during v1. Once we close it, it's gone. Founding members receive permanent priority access, elevated invite power, and the lowest price this system will ever offer."
                : "Standard membership gives you full access to the PFSW execution infrastructure, weekly review cycles, and accountability systems."
              }
            </p>
          </section>
          <GoldDivider />
          <section className="py-8">
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-foreground mb-6">{foundingOpen ? "Founding Member Pricing." : "Membership."}</h2>
            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-8 text-center">
              <p className="text-xs uppercase tracking-[0.3em] text-primary mb-3">{foundingOpen ? "Founding Access" : "Standard Access"}</p>
              <p className="text-5xl font-bold text-foreground mb-2">{priceDisplay}</p>
              <p className="text-sm text-muted-foreground">One-time activation</p>
            </div>
          </section>
          <GoldDivider />
          <section className="py-8 pb-20">
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-foreground mb-6">Decision.</h2>
            <p className="text-muted-foreground leading-relaxed mb-8">This is binary. You're in, or you're not. There's no "maybe later." If you release your spot, it goes to the next person in line.</p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button onClick={handleAccept} disabled={loading} className="flex-1 h-14 text-base font-bold tracking-wide gold-glow-strong">
                {loading ? "Processing..." : "Accept My Founding Spot"}
              </Button>
              <Button variant="ghost" onClick={handleRelease} disabled={loading} className="flex-1 h-14 text-base text-muted-foreground">
                Release My Spot
              </Button>
            </div>
          </section>
        </div>
      </div>
    </AuthGate>
  );
}
