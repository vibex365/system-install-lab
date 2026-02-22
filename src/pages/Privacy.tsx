import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useSEO } from "@/hooks/use-seo";

export default function Privacy() {
  useSEO({
    title: "Privacy Policy — PFSW",
    description: "PFSW privacy policy. We collect only what's necessary to deliver the service and never sell your data.",
    canonical: "https://pfsw.io/privacy",
    noIndex: true,
  });
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-32 pb-20">
        <div className="container max-w-2xl">
          <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">Privacy Policy</h1>
          <p className="text-sm text-muted-foreground mb-10">Last updated: February 2026</p>
          <div className="prose prose-invert prose-sm max-w-none text-muted-foreground space-y-8">

            <section>
              <h2 className="text-base font-semibold text-foreground mb-2">1. Who We Are</h2>
              <p>PFSW ("we", "us", "our") is an operator community and AI-powered web design toolkit for web designers who want to systematically acquire clients. Our services include the PFSW platform, Prompt Engine, Agent Marketplace, and member community boards.</p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-foreground mb-2">2. What We Collect</h2>
              <p>We collect only what is necessary to deliver the service:</p>
              <ul className="list-disc list-inside space-y-1 mt-2">
                <li><strong className="text-foreground">Account information:</strong> your name, email address, and password (hashed — never stored in plain text)</li>
                <li><strong className="text-foreground">Application data:</strong> information you submit in your membership application</li>
                <li><strong className="text-foreground">Payment records:</strong> transaction amounts and Stripe session IDs (we never store raw card numbers)</li>
                <li><strong className="text-foreground">Usage data:</strong> prompt generations, agent runs, and session history to power your dashboard</li>
                <li><strong className="text-foreground">Community content:</strong> posts, comments, and votes you create on the member board</li>
              </ul>
            </section>

            <section>
              <h2 className="text-base font-semibold text-foreground mb-2">3. How We Use Your Data</h2>
              <ul className="list-disc list-inside space-y-1">
                <li>To authenticate your account and manage your membership</li>
                <li>To run AI agents and save prompt sessions on your behalf</li>
                <li>To process payments via Stripe (we never touch card data directly)</li>
                <li>To send operational emails (application status, cohort updates)</li>
                <li>To monitor platform health and prevent abuse</li>
              </ul>
              <p className="mt-3">We do not use your data for advertising. We do not build advertising profiles. We do not train AI models on your personal data.</p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-foreground mb-2">4. Data Sharing</h2>
              <p>We share your data only with the third-party services required to operate the platform:</p>
              <ul className="list-disc list-inside space-y-1 mt-2">
                <li><strong className="text-foreground">Supabase</strong> — database and authentication infrastructure</li>
                <li><strong className="text-foreground">Stripe</strong> — payment processing</li>
                <li><strong className="text-foreground">Firecrawl</strong> — website scanning (sends URLs you input; receives scraped text only)</li>
                <li><strong className="text-foreground">Twilio / VAPI</strong> — SMS and voice agent functionality</li>
                <li><strong className="text-foreground">Anthropic (Claude)</strong> — AI prompt generation</li>
              </ul>
              <p className="mt-3">We never sell your data to third parties. Ever.</p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-foreground mb-2">5. Data Retention</h2>
              <p>Your data is retained as long as your account is active. If you request account deletion, we will delete your personal data within 30 days, except where retention is required by law (e.g., payment records for tax compliance).</p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-foreground mb-2">6. Security</h2>
              <p>Your data is stored in encrypted databases with row-level security policies. Passwords are never stored — only cryptographic hashes. Payments are processed entirely by Stripe using PCI-DSS compliant infrastructure.</p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-foreground mb-2">7. Your Rights</h2>
              <p>You have the right to access, correct, export, or delete your personal data at any time. To exercise any of these rights, contact us at <a href="mailto:hello@pfsw.io" className="text-primary hover:underline">hello@pfsw.io</a>.</p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-foreground mb-2">8. Contact</h2>
              <p>For privacy inquiries: <a href="mailto:hello@pfsw.io" className="text-primary hover:underline">hello@pfsw.io</a></p>
            </section>

          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
