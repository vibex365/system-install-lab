import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export default function Terms() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-32 pb-20">
        <div className="container max-w-2xl">
          <h1 className="text-3xl font-bold tracking-tight text-foreground mb-8">Terms of Service</h1>
          <div className="prose prose-invert prose-sm max-w-none text-muted-foreground space-y-4">
            <p>Terms of service for the PFSW platform will be published here.</p>
            <p>By using PFSW, you agree to operate with discipline.</p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
