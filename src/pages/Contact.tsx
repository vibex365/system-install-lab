import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useSEO } from "@/hooks/use-seo";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, Loader2 } from "lucide-react";

export default function Contact() {
  useSEO({
    title: "Contact PFSW",
    description: "Get in touch with the PFSW team. Questions about membership, the agent marketplace, or the platform.",
    canonical: "https://system-install-lab.lovable.app/contact",
    noIndex: true,
  });

  const { toast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      toast({ title: "All fields required", variant: "destructive" });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast({ title: "Enter a valid email address", variant: "destructive" });
      return;
    }
    setSending(true);
    try {
      // Store in waitlist table as a contact entry (re-uses existing infrastructure)
      const { error } = await supabase.from("waitlist").insert({
        email: email.trim(),
        note: `[CONTACT FORM] Name: ${name.trim()}\n\n${message.trim()}`,
      });
      if (error) throw error;
      setSent(true);
    } catch (err: any) {
      toast({ title: "Failed to send", description: "Try emailing hello@pfsw.io directly.", variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-32 pb-20">
        <div className="container max-w-lg">
          <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">Contact Us</h1>
          <p className="text-sm text-muted-foreground mb-10">
            Questions about membership, agents, or the platform? We respond within 24 hours.
          </p>

          {sent ? (
            <div className="flex flex-col items-center gap-4 py-12 text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-base font-semibold text-foreground">Message received.</p>
                <p className="text-sm text-muted-foreground mt-1">We'll get back to you at {email} within 24 hours.</p>
              </div>
              <p className="text-xs text-muted-foreground">
                Or reach us directly at{" "}
                <a href="mailto:hello@pfsw.io" className="text-primary hover:underline">hello@pfsw.io</a>
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-xs">Your Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jane Smith"
                  maxLength={100}
                  className="bg-background border-border"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jane@example.com"
                  maxLength={255}
                  className="bg-background border-border"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="message" className="text-xs">Message</Label>
                <Textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="What's on your mind? Membership questions, agent issues, partnership ideas..."
                  maxLength={2000}
                  className="bg-background border-border min-h-[140px]"
                />
                <p className="text-[10px] text-muted-foreground text-right">{message.length}/2000</p>
              </div>

              <Button type="submit" className="w-full" disabled={sending}>
                {sending ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Sending...</>
                ) : (
                  "Send Message"
                )}
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                Or email directly:{" "}
                <a href="mailto:hello@pfsw.io" className="text-primary hover:underline">hello@pfsw.io</a>
              </p>
            </form>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
