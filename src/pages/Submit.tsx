import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { AuthGate } from "@/components/AuthGate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";
import { Send } from "lucide-react";

export default function Submit() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [packages, setPackages] = useState<any[]>([]);
  const [title, setTitle] = useState("");
  const [packageId, setPackageId] = useState("");
  const [targetUser, setTargetUser] = useState("");
  const [problem, setProblem] = useState("");
  const [scope, setScope] = useState("");
  const [integrations, setIntegrations] = useState("");
  const [rawPrompt, setRawPrompt] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    supabase.from("prompt_packages").select("id, name").order("name").then(({ data }) => setPackages(data || []));
  }, []);

  const handleSubmit = async () => {
    if (!user || !title || !rawPrompt) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from("prompt_submissions").insert({
        submitted_by: user.id,
        package_id: packageId || null,
        title,
        target_user: targetUser || null,
        problem: problem || null,
        scope: scope || null,
        integrations: integrations ? integrations.split(",").map((s) => s.trim()) : [],
        raw_prompt: rawPrompt,
      });
      if (error) throw error;
      toast({ title: "Submission received", description: "It will be reviewed by the Chief Architect." });
      setTitle(""); setPackageId(""); setTargetUser(""); setProblem(""); setScope(""); setIntegrations(""); setRawPrompt("");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthGate requireActive>
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-24 pb-20">
          <div className="container max-w-lg">
            <h1 className="text-xl font-bold text-foreground mb-1">Submit a Prompt</h1>
            <p className="text-sm text-muted-foreground mb-6">Propose a new prompt for the library. All submissions are reviewed.</p>

            <Card className="bg-card border-border">
              <CardContent className="p-6 space-y-4">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Title *</label>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Prompt title" className="bg-background border-border" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Package</label>
                  <Select value={packageId} onValueChange={setPackageId}>
                    <SelectTrigger className="bg-background border-border"><SelectValue placeholder="Select category" /></SelectTrigger>
                    <SelectContent>
                      {packages.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Target User</label>
                  <Input value={targetUser} onChange={(e) => setTargetUser(e.target.value)} placeholder="Who is this prompt for?" className="bg-background border-border" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Problem it solves</label>
                  <Textarea value={problem} onChange={(e) => setProblem(e.target.value)} placeholder="What problem does this address?" className="bg-background border-border" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Scope</label>
                  <Input value={scope} onChange={(e) => setScope(e.target.value)} placeholder="MVP, full product, module..." className="bg-background border-border" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Integrations (comma-separated)</label>
                  <Input value={integrations} onChange={(e) => setIntegrations(e.target.value)} placeholder="Stripe, Supabase, Twilio" className="bg-background border-border" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Raw Prompt *</label>
                  <Textarea value={rawPrompt} onChange={(e) => setRawPrompt(e.target.value)} placeholder="The full prompt text..." className="bg-background border-border min-h-[200px] font-mono text-xs" />
                </div>
                <Button onClick={handleSubmit} disabled={submitting || !title || !rawPrompt} className="w-full gold-glow-strong">
                  <Send className="h-4 w-4 mr-1" />
                  {submitting ? "Submitting..." : "Submit for Review"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
        <Footer />
      </div>
    </AuthGate>
  );
}
