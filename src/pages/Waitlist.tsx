import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { track } from "@/lib/analytics";
import { CheckCircle } from "lucide-react";
import { useSEO } from "@/hooks/use-seo";

export default function Waitlist() {
  useSEO({
    title: "Join the Waitlist — PFSW",
    description: "Applications are currently closed. Join the PFSW waitlist to be notified when the next cohort opens.",
    canonical: "https://system-install-lab.lovable.app/waitlist",
    noIndex: true,
  });
  const { toast } = useToast();
  const [submitted, setSubmitted] = useState(false);
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { error } = await supabase.from("waitlist").insert({ email, note: note || null });
      if (error) {
        if (error.code === "23505") {
          toast({ title: "Already on the list", description: "You're already on the waitlist." });
          setSubmitted(true);
          return;
        }
        throw error;
      }
      track("waitlist_submitted");
      toast({ title: "You're on the list", description: "We'll notify you when spots open." });
      setSubmitted(true);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-32 pb-20">
        <div className="container max-w-md text-center">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-2">Join the Waitlist</h1>
          <p className="text-muted-foreground mb-10">Get notified when new spots open.</p>
          {submitted ? (
            <div className="rounded-2xl border border-primary/30 bg-card p-8">
              <CheckCircle className="h-8 w-8 text-primary mx-auto mb-3" />
              <p className="text-foreground font-semibold mb-1">You're in.</p>
              <p className="text-sm text-muted-foreground mb-4">We'll email when doors open.</p>
              <Button asChild variant="outline" className="border-primary/30 text-foreground hover:bg-primary/10">
                <Link to="/">Back to Home</Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input required type="email" placeholder="you@example.com" className="bg-card" value={email} onChange={(e) => setEmail(e.target.value)} />
              <Input placeholder="What are you building? (optional)" className="bg-card" value={note} onChange={(e) => setNote(e.target.value)} />
              <Button type="submit" className="w-full tracking-wide font-bold" disabled={submitting}>
                {submitting ? "Joining..." : "Join Waitlist"}
              </Button>
            </form>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
