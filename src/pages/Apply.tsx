import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useToast } from "@/hooks/use-toast";
import { track } from "@/lib/analytics";

export default function Apply() {
  const { toast } = useToast();
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    track("apply_submitted");
    setSubmitted(true);
    toast({ title: "Application received", description: "We'll review and respond within 48 hours." });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-32 pb-20">
        <div className="container max-w-xl">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-2">Apply to Join</h1>
          <p className="text-muted-foreground mb-10">Short form. No fluff. We review every application.</p>

          {submitted ? (
            <div className="rounded-2xl border border-primary/30 bg-card p-8 text-center">
              <p className="text-foreground font-semibold mb-2">Application submitted.</p>
              <p className="text-sm text-muted-foreground">We'll be in touch within 48 hours.</p>
              <Button asChild variant="outline" className="mt-6 border-primary/30 text-foreground hover:bg-primary/10">
                <Link to="/">Back to Home</Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Name</label>
                <Input required placeholder="Your full name" className="bg-card" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Email</label>
                <Input required type="email" placeholder="you@example.com" className="bg-card" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Role</label>
                <Select required>
                  <SelectTrigger className="bg-card">
                    <SelectValue placeholder="Select your role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="founder">Founder</SelectItem>
                    <SelectItem value="operator">Operator</SelectItem>
                    <SelectItem value="creator">Creator</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">What are you building?</label>
                <Textarea required placeholder="Describe your project or business in a few sentences." className="bg-card" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Biggest execution bottleneck?</label>
                <Textarea required placeholder="What's slowing you down the most right now?" className="bg-card" />
              </div>
              <Button type="submit" size="lg" className="w-full tracking-wide">
                Submit Application
              </Button>
            </form>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
