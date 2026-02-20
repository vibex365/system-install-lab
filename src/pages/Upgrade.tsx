import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { AuthGate } from "@/components/AuthGate";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { useSEO } from "@/hooks/use-seo";

// 👇 Swap this URL with your real Loom or YouTube embed link
const UPGRADE_VIDEO_URL = "https://www.loom.com/embed/YOUR_VIDEO_ID_HERE";

const GoldDivider = () => (
  <div className="flex items-center justify-center py-12">
    <div className="h-px w-16 bg-gradient-to-r from-transparent via-primary to-transparent" />
  </div>
);

export default function Upgrade() {
  useSEO({
    title: "Watch Before You Activate — PFSW",
    description: "You've been accepted. Watch this short video before activating your membership.",
    canonical: "https://system-install-lab.lovable.app/upgrade",
  });

  return (
    <AuthGate requireAcceptedPending>
      <div className="min-h-screen bg-background">
        <div className="max-w-2xl mx-auto px-6 py-20">

          {/* Header */}
          <section className="pt-20 pb-8">
            <p className="text-xs uppercase tracking-[0.5em] text-primary mb-6">
              You've Been Accepted
            </p>
            <h1 className="font-serif text-5xl sm:text-6xl font-bold text-foreground leading-tight mb-6">
              Before You Activate —<br />
              <span className="text-primary">Watch This.</span>
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              This 5-minute video explains exactly what you're getting and why it works. Watch it before you hit the button below.
            </p>
          </section>

          <GoldDivider />

          {/* Video embed */}
          <section className="py-4">
            <div className="rounded-xl overflow-hidden border border-primary/20 bg-primary/5">
              <AspectRatio ratio={16 / 9}>
                <iframe
                  src={UPGRADE_VIDEO_URL}
                  title="PFSW Membership Overview"
                  className="w-full h-full"
                  frameBorder="0"
                  allow="autoplay; fullscreen; picture-in-picture"
                  allowFullScreen
                />
              </AspectRatio>
            </div>
            <p className="text-xs text-muted-foreground text-center mt-3">
              No audio? Check your system volume and unmute the video.
            </p>
          </section>

          <GoldDivider />

          {/* Pitch copy */}
          <section className="py-4">
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-foreground mb-6">
              What $197/month gets you.
            </h2>
            <div className="space-y-5 text-muted-foreground leading-relaxed">
              <p>
                <span className="text-foreground font-medium">Five automated agents</span> — Lead Prospector, Website Auditor, Cold Email Outreach, AI Voice Caller, and the Niche Prompt Library. All running from one dashboard, on demand or on a schedule you define.
              </p>
              <p>
                <span className="text-foreground font-medium">A weekly peer cohort</span> — real web designers, building with Lovable, holding each other accountable. Hot seat reviews of your pitches, your builds, and your results. The kind of feedback you can't get from YouTube.
              </p>
              <p>
                <span className="text-foreground font-medium">Niche Lovable prompts</span> — battle-tested build prompts for dental, restaurant, real estate, law, fitness, and more. Copy, paste, ship. Cut your build time from weeks to days.
              </p>
              <p>
                <span className="text-foreground font-medium">A compounding acquisition system</span> — the longer you run the agents, the smarter your targeting gets. Month three looks nothing like month one. The system learns from your runs. Your pipeline fills itself.
              </p>
            </div>
          </section>

          <GoldDivider />

          {/* CTA */}
          <section className="py-8 pb-20 text-center">
            <Button
              asChild
              size="lg"
              className="w-full sm:w-auto h-14 px-12 text-base font-bold tracking-wide gold-glow-strong"
            >
              <Link to="/accepted">
                I'm Ready — Activate My Membership
              </Link>
            </Button>
            <p className="text-xs text-muted-foreground mt-4">
              $197/month · Cancel anytime · Cohort assigned within 48 hours of activation
            </p>
            <div className="mt-8">
              <Link
                to="/status"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors underline underline-offset-4"
              >
                Not ready? Go back to your status page
              </Link>
            </div>
          </section>

        </div>
      </div>
    </AuthGate>
  );
}
