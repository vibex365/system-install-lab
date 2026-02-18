import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useToast } from "@/hooks/use-toast";
import { track } from "@/lib/analytics";
import { CheckCircle } from "lucide-react";

export default function Waitlist() {
  const { toast } = useToast();
  const [submitted, setSubmitted] = useState(false);
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const entry = { id: crypto.randomUUID(), email, note: note || undefined, createdAt: new Date().toISOString() };
    const prev = JSON.parse(localStorage.getItem("pfsw_waitlist") || "[]");
    localStorage.setItem("pfsw_waitlist", JSON.stringify([...prev, entry]));
    track("waitlist_submitted");
    toast({ title: "You're on the list", description: "We'll notify you when spots open." });
    setSubmitted(true);
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
              <Input
                required
                type="email"
                placeholder="you@example.com"
                className="bg-card"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Input
                placeholder="What are you building? (optional)"
                className="bg-card"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
              <Button type="submit" className="w-full tracking-wide font-bold">Join Waitlist</Button>
            </form>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
