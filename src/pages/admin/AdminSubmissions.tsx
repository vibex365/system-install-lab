import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { CheckCircle, XCircle, Clock } from "lucide-react";
import { StatusPill } from "@/components/StatusPill";

export default function AdminSubmissions() {
  const { toast } = useToast();
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("prompt_submissions")
      .select("*, submitter:profiles!prompt_submissions_submitted_by_fkey(email, full_name), package:prompt_packages!prompt_submissions_package_id_fkey(name)")
      .order("created_at", { ascending: false });
    setSubmissions(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("prompt_submissions").update({ status }).eq("id", id);
    toast({ title: `Submission ${status}` });
    load();
  };

  const approve = async (sub: any) => {
    // Create prompt from submission
    const { data: prompt, error } = await supabase.from("prompts").insert({
      package_id: sub.package_id,
      title: sub.title,
      summary: sub.problem || null,
      prompt_text: sub.raw_prompt,
      tags: sub.integrations || [],
      created_by: sub.submitted_by,
    }).select().single();

    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }

    if (prompt) {
      await supabase.from("prompt_versions").insert({
        prompt_id: prompt.id,
        version: 1,
        prompt_text: sub.raw_prompt,
        changelog: "Initial approved version",
      });
    }

    await updateStatus(sub.id, "approved");
  };

  const sc = (s: string) => s === "approved" ? "active" : s === "rejected" ? "muted" : "default";

  return (
    <AdminShell>
      <h1 className="text-xl font-bold text-foreground mb-4">Prompt Submissions</h1>
      {loading ? (
        <div className="flex justify-center py-12"><div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
      ) : submissions.length === 0 ? (
        <p className="text-sm text-muted-foreground">No submissions yet.</p>
      ) : (
        <div className="space-y-3">
          {submissions.map((s) => (
            <Card key={s.id} className="bg-card border-border">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">{s.title}</h3>
                    <p className="text-xs text-muted-foreground">
                      {s.submitter?.full_name || s.submitter?.email} · {s.package?.name || "No package"} · {format(new Date(s.created_at), "MMM d")}
                    </p>
                  </div>
                  <StatusPill label={s.status} variant={sc(s.status)} />
                </div>
                {s.problem && <p className="text-xs text-muted-foreground mb-2">{s.problem}</p>}
                <div className="bg-muted/50 rounded p-3 mb-3">
                  <p className="text-xs font-mono text-foreground whitespace-pre-wrap line-clamp-6">{s.raw_prompt}</p>
                </div>
                {s.status === "pending_review" && (
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => approve(s)}><CheckCircle className="h-3 w-3 mr-1" /> Approve</Button>
                    <Button size="sm" variant="outline" onClick={() => updateStatus(s.id, "needs_revision")} className="border-border"><Clock className="h-3 w-3 mr-1" /> Needs Revision</Button>
                    <Button size="sm" variant="destructive" onClick={() => updateStatus(s.id, "rejected")}><XCircle className="h-3 w-3 mr-1" /> Reject</Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </AdminShell>
  );
}
