import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useSEO } from "@/hooks/use-seo";

export default function Terms() {
  useSEO({
    title: "Terms of Service — PFSW",
    description: "Terms of service for the PFSW web design operator community and AI toolkit.",
    canonical: "https://pfsw.io/terms",
    noIndex: true,
  });
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-32 pb-20">
        <div className="container max-w-2xl">
          <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">Terms of Service</h1>
          <p className="text-sm text-muted-foreground mb-10">Last updated: February 2026</p>
          <div className="prose prose-invert prose-sm max-w-none text-muted-foreground space-y-8">

            <section>
              <h2 className="text-base font-semibold text-foreground mb-2">1. Acceptance</h2>
              <p>By creating a PFSW account or using any PFSW service, you agree to these Terms of Service. If you do not agree, do not use the platform.</p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-foreground mb-2">2. The Service</h2>
              <p>PFSW provides a membership platform for web designers, including:</p>
              <ul className="list-disc list-inside space-y-1 mt-2">
                <li>AI-powered Prompt Engine for website build prompts</li>
                <li>Agent Marketplace (Lead Prospector, Website Auditor, Cold Email, VAPI Caller)</li>
                <li>Curated Prompt Library</li>
                <li>Weekly live peer review cohort sessions</li>
                <li>Member community board</li>
              </ul>
            </section>

            <section>
              <h2 className="text-base font-semibold text-foreground mb-2">3. Membership & Payment</h2>
              <p>Membership requires a $5 application processing fee and, upon acceptance, a $197/month subscription. The $5 fee is non-refundable. Monthly membership may be cancelled at any time — no contracts, no lock-in. Cancellation takes effect at the end of your current billing period.</p>
              <p className="mt-2">Agent leases are separate monthly subscriptions. Cancelling your membership does not automatically cancel individual agent leases.</p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-foreground mb-2">4. Acceptable Use</h2>
              <p>You agree to use PFSW only for lawful purposes. You may not:</p>
              <ul className="list-disc list-inside space-y-1 mt-2">
                <li>Use AI agents to spam, harass, or contact individuals without consent</li>
                <li>Resell or redistribute PFSW content, prompts, or agent outputs without written permission</li>
                <li>Attempt to reverse-engineer, scrape, or copy platform systems</li>
                <li>Share login credentials with non-members</li>
                <li>Post misleading, abusive, or off-topic content on community boards</li>
              </ul>
              <p className="mt-2">Violations may result in immediate membership termination without refund.</p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-foreground mb-2">5. AI-Generated Content</h2>
              <p>The Prompt Engine and Agent Marketplace generate content using third-party AI models. PFSW does not guarantee the accuracy, legality, or effectiveness of AI-generated outputs. You are responsible for reviewing all content before use — particularly cold emails, voice scripts, and client proposals.</p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-foreground mb-2">6. Intellectual Property</h2>
              <p>You retain ownership of content you submit to the platform. By submitting prompts to the library, you grant PFSW a non-exclusive license to display and distribute that content to other members. PFSW retains all rights to its platform design, systems, and proprietary prompt frameworks.</p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-foreground mb-2">7. Limitation of Liability</h2>
              <p>PFSW is provided "as is". We are not liable for lost revenue, missed client opportunities, or outcomes resulting from AI agent outputs or platform usage. Our total liability is limited to the amount you paid in the most recent 30 days.</p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-foreground mb-2">8. Changes to Terms</h2>
              <p>We may update these Terms at any time. Continued use of the platform after an update constitutes acceptance of the new Terms. Material changes will be announced via email.</p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-foreground mb-2">9. Contact</h2>
              <p>For legal inquiries: <a href="mailto:hello@pfsw.io" className="text-primary hover:underline">hello@pfsw.io</a></p>
            </section>

          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
