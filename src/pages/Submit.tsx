import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { AuthGate } from "@/components/AuthGate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { StatusPill } from "@/components/StatusPill";
import { Send, Clock } from "lucide-react";
import { format } from "date-fns";

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
  const [mySubmissions, setMySubmissions] = useState<any[]>([]);

  useEffect(() => {
    supabase.from("prompt_packages").select("id, name").order("name").then(({ data }) => setPackages(data || []));
    loadMySubmissions();
  }, []);

  const loadMySubmissions = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("prompt_submissions")
      .select("id, title, status, created_at")
      .eq("submitted_by", user.id)
      .order("created_at", { ascending: false })
      .limit(10);
    setMySubmissions(data || []);
  };

  const handleSubmit = async () => {
    if (!user || !title || !rawPrompt) return;
    setSubmitting(true);
    try {
      const { data: submission, error } = await supabase.from("prompt_submissions").insert({
        submitted_by: user.id,
        package_id: packageId || null,
        title,
        target_user: targetUser || null,
        problem: problem || null,
        scope: scope || null,
        integrations: integrations ? integrations.split(",").map((s) => s.trim()) : [],
        raw_prompt: rawPrompt,
      }).select().single();
      if (error) throw error;

      // Queue OpenClaw packaging job
      if (submission) {
        await supabase.functions.invoke("jobs-create", {
          body: {
            type: "package_prompt",
            payload: { submission_id: submission.id, title, raw_prompt: rawPrompt },
          },
        });
      }

      toast({ title: "Submission received", description: "It will be processed and reviewed by the Chief Architect." });
      setTitle(""); setPackageId(""); setTargetUser(""); setProblem(""); setScope(""); setIntegrations(""); setRawPrompt("");
      loadMySubmissions();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const statusVariant = (s: string) => s === "approved" ? "active" : s === "rejected" ? "muted" : "default";

  return (
    <AuthGate requireActive>
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-24 pb-20">
          <div className="container max-w-lg">
            <h1 className="text-xl font-bold text-foreground mb-1">Submit a Prompt</h1>
            <p className="text-sm text-muted-foreground mb-6">Propose a new prompt for the library. All submissions are processed by OpenClaw and reviewed.</p>

            <Card className="bg-card border-border mb-6">
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

            {/* My Submissions */}
            {mySubmissions.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-foreground mb-3">Your Submissions</h2>
                <div className="space-y-2">
                  {mySubmissions.map((s) => (
                    <div key={s.id} className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3">
                      <div>
                        <p className="text-sm text-foreground">{s.title}</p>
                        <p className="text-[10px] text-muted-foreground">{format(new Date(s.created_at), "MMM d, yyyy")}</p>
                      </div>
                      <StatusPill label={s.status} variant={statusVariant(s.status)} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </main>
        <Footer />
      </div>
    </AuthGate>
  );
}
