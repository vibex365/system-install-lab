import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export default function Privacy() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-32 pb-20">
        <div className="container max-w-2xl">
          <h1 className="text-3xl font-bold tracking-tight text-foreground mb-8">Privacy Policy</h1>
          <div className="prose prose-invert prose-sm max-w-none text-muted-foreground space-y-4">
            <p>Your privacy matters. This page will contain the full PFSW privacy policy once finalized.</p>
            <p>We collect only what's necessary to deliver the service. We never sell your data.</p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
