import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Clock } from "lucide-react";

export default function ApplicationUnderReview() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 flex items-center justify-center px-6">
        <div className="max-w-md text-center">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-6">
            <Clock className="h-8 w-8 text-primary" />
          </div>

          <h1 className="text-3xl font-black tracking-tight text-foreground mb-4">
            Your Application Is Under Review
          </h1>

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
        </div>
      </main>
      <Footer />
    </div>
  );
}
