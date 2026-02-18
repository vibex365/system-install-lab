import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { CheckCircle, XCircle, Clock, Package } from "lucide-react";
import { StatusPill } from "@/components/StatusPill";

export default function AdminSubmissions() {
  const { toast } = useToast();
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});

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
    const notes = adminNotes[id];
    await supabase.from("prompt_submissions").update({
      status,
      ...(notes ? { admin_notes: notes } : {}),
    }).eq("id", id);
    toast({ title: `Submission ${status}` });
    load();
  };

  const approve = async (sub: any) => {
    // Use packaged output if available, otherwise use raw
    const promptText = sub.packaged_prompt || sub.raw_prompt;
    const summary = sub.packaged_summary || sub.problem || null;
    const tags = sub.packaged_tags?.length ? sub.packaged_tags : (sub.integrations || []);
    const complexity = sub.packaged_complexity || null;

    const { data: prompt, error } = await supabase.from("prompts").insert({
      package_id: sub.package_id,
      title: sub.title,
      summary,
      prompt_text: promptText,
      tags,
      complexity,
      created_by: sub.submitted_by,
    }).select().single();

    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }

    if (prompt) {
      await supabase.from("prompt_versions").insert({
        prompt_id: prompt.id,
        version: 1,
        prompt_text: promptText,
        changelog: "Initial approved version",
      });
    }

    await updateStatus(sub.id, "approved");
  };

  const sc = (s: string) => s === "approved" ? "active" as const : s === "rejected" ? "muted" as const : "default" as const;

  return (
    <AdminShell>
      <h1 className="text-xl font-bold text-foreground mb-4">Prompt Submissions</h1>
      {loading ? (
        <div className="flex justify-center py-12"><div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
      ) : submissions.length === 0 ? (
        <p className="text-sm text-muted-foreground">No submissions yet.</p>
      ) : (
        <div className="space-y-4">
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

                {/* Raw prompt */}
                <div className="bg-muted/50 rounded p-3 mb-3">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Raw Submission</p>
                  <p className="text-xs font-mono text-foreground whitespace-pre-wrap line-clamp-6">{s.raw_prompt}</p>
                </div>

                {/* Packaged output from OpenClaw */}
                {s.packaged_prompt && (
                  <div className="bg-primary/5 border border-primary/20 rounded p-3 mb-3">
                    <div className="flex items-center gap-1 mb-1">
                      <Package className="h-3 w-3 text-primary" />
                      <p className="text-[10px] uppercase tracking-wider text-primary">OpenClaw Packaged</p>
                    </div>
                    <p className="text-xs font-mono text-foreground whitespace-pre-wrap line-clamp-6">{s.packaged_prompt}</p>
                    {s.packaged_summary && <p className="text-xs text-muted-foreground mt-2">Summary: {s.packaged_summary}</p>}
                    <div className="flex gap-2 mt-1">
                      {s.packaged_complexity && <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{s.packaged_complexity}</span>}
                      {s.packaged_tags?.map((t: string) => (
                        <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary">{t}</span>
                      ))}
                    </div>
                  </div>
                )}

                {s.status === "pending_review" && (
                  <>
                    <div className="mb-3">
                      <Textarea
                        placeholder="Admin notes (optional)..."
                        value={adminNotes[s.id] || ""}
                        onChange={(e) => setAdminNotes((prev) => ({ ...prev, [s.id]: e.target.value }))}
                        className="bg-background border-border text-xs min-h-[60px]"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => approve(s)}><CheckCircle className="h-3 w-3 mr-1" /> Approve</Button>
                      <Button size="sm" variant="outline" onClick={() => updateStatus(s.id, "needs_revision")} className="border-border"><Clock className="h-3 w-3 mr-1" /> Needs Revision</Button>
                      <Button size="sm" variant="destructive" onClick={() => updateStatus(s.id, "rejected")}><XCircle className="h-3 w-3 mr-1" /> Reject</Button>
                    </div>
                  </>
                )}

                {s.admin_notes && s.status !== "pending_review" && (
                  <p className="text-xs text-muted-foreground mt-2 italic">Notes: {s.admin_notes}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </AdminShell>
  );
}
