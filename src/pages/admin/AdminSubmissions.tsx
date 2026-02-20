import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { CheckCircle, XCircle, Clock, Package, ChevronDown, ChevronUp, FileText, Zap } from "lucide-react";

type Submission = {
  id: string;
  title: string;
  status: string;
  created_at: string;
  raw_prompt: string;
  problem: string | null;
  scope: string | null;
  target_user: string | null;
  integrations: string[] | null;
  packaged_prompt: string | null;
  packaged_summary: string | null;
  packaged_tags: string[] | null;
  packaged_complexity: string | null;
  admin_notes: string | null;
  package_id: string | null;
  submitted_by: string;
  submitter?: { email: string; full_name: string | null } | null;
  package?: { name: string } | null;
};

const STATUS_FILTERS = ["all", "pending_review", "packaged", "approved", "needs_revision", "rejected"];

const complexityColor: Record<string, string> = {
  simple: "bg-green-500/10 text-green-400 border-green-500/20",
  medium: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  complex: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  advanced: "bg-red-500/10 text-red-400 border-red-500/20",
};

const statusColor: Record<string, string> = {
  pending_review: "bg-muted text-muted-foreground",
  packaged: "bg-primary/10 text-primary",
  approved: "bg-green-500/10 text-green-400",
  needs_revision: "bg-yellow-500/10 text-yellow-400",
  rejected: "bg-red-500/10 text-red-400",
};

export default function AdminSubmissions() {
  const { toast } = useToast();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});
  const [expanded, setExpanded] = useState<Record<string, "raw" | "packaged" | null>>({});
  const [filter, setFilter] = useState("all");

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("prompt_submissions")
      .select("*, submitter:profiles!prompt_submissions_submitted_by_fkey(email, full_name), package:prompt_packages!prompt_submissions_package_id_fkey(name)")
      .order("created_at", { ascending: false });
    setSubmissions((data as unknown as Submission[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const updateStatus = async (id: string, status: string) => {
    const notes = adminNotes[id];
    await supabase.from("prompt_submissions").update({
      status,
      ...(notes ? { admin_notes: notes } : {}),
    }).eq("id", id);
    toast({ title: `Submission marked as ${status.replace("_", " ")}` });
    load();
  };

  const approve = async (sub: Submission) => {
    if (!sub.package_id) {
      toast({ title: "Error", description: "Submission must have a package assigned before approving.", variant: "destructive" });
      return;
    }
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

  const toggleExpand = (id: string, panel: "raw" | "packaged") => {
    setExpanded((prev) => ({ ...prev, [id]: prev[id] === panel ? null : panel }));
  };

  const filtered = filter === "all" ? submissions : submissions.filter((s) => s.status === filter);

  const counts = STATUS_FILTERS.reduce((acc, f) => {
    acc[f] = f === "all" ? submissions.length : submissions.filter((s) => s.status === f).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <AdminShell>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-foreground">Prompt Submissions</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Review and approve member-submitted prompts processed by OpenClaw</p>
        </div>
        <Button variant="outline" size="sm" onClick={load} className="border-border text-xs">Refresh</Button>
      </div>

      {/* Status filter tabs */}
      <div className="flex flex-wrap gap-1.5 mb-6">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors border ${
              filter === f
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border text-muted-foreground hover:text-foreground bg-card"
            }`}
          >
            {f === "all" ? "All" : f.replace("_", " ")}
            {counts[f] > 0 && (
              <span className={`ml-1.5 ${filter === f ? "opacity-70" : "opacity-50"}`}>({counts[f]})</span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Package className="h-8 w-8 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No submissions in this category.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((s) => (
            <Card key={s.id} className="bg-card border-border overflow-hidden">
              <CardContent className="p-0">
                {/* Header */}
                <div className="flex items-start justify-between px-5 pt-4 pb-3 border-b border-border/50">
                  <div className="flex-1 min-w-0 pr-4">
                    <h3 className="text-sm font-semibold text-foreground leading-snug">{s.title}</h3>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {s.submitter?.full_name || s.submitter?.email} · {s.package?.name || <span className="text-muted-foreground italic">No package</span>} · {format(new Date(s.created_at), "MMM d, yyyy")}
                    </p>
                    {s.problem && <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{s.problem}</p>}
                    {(s.target_user || s.scope) && (
                      <p className="text-[11px] text-muted-foreground mt-1">
                        {s.target_user && <span>For: <span className="text-foreground">{s.target_user}</span></span>}
                        {s.target_user && s.scope && <span className="mx-1">·</span>}
                        {s.scope && <span>Scope: <span className="text-foreground">{s.scope}</span></span>}
                      </p>
                    )}
                  </div>
                  <span className={`shrink-0 text-[10px] px-2.5 py-1 rounded-full font-medium uppercase tracking-wide ${statusColor[s.status] || "bg-muted text-muted-foreground"}`}>
                    {s.status.replace("_", " ")}
                  </span>
                </div>

                {/* OpenClaw Packaged Output — primary display */}
                {s.packaged_prompt ? (
                  <div className="px-5 py-3 border-b border-border/50 bg-primary/5">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5">
                        <Package className="h-3.5 w-3.5 text-primary" />
                        <span className="text-[10px] font-semibold uppercase tracking-widest text-primary">OpenClaw Packaged</span>
                      </div>
                      <button
                        onClick={() => toggleExpand(s.id, "packaged")}
                        className="flex items-center gap-1 text-[10px] text-primary hover:opacity-80 transition-opacity"
                      >
                        {expanded[s.id] === "packaged" ? <><ChevronUp className="h-3 w-3" /> Collapse</> : <><ChevronDown className="h-3 w-3" /> Expand</>}
                      </button>
                    </div>

                    {/* Summary */}
                    {s.packaged_summary && (
                      <p className="text-xs text-foreground/80 mb-2 italic">"{s.packaged_summary}"</p>
                    )}

                    {/* Tags + Complexity */}
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {s.packaged_complexity && (
                        <span className={`text-[10px] px-2 py-0.5 rounded border font-medium ${complexityColor[s.packaged_complexity] || "bg-muted text-muted-foreground border-border"}`}>
                          {s.packaged_complexity}
                        </span>
                      )}
                      {s.packaged_tags?.map((t) => (
                        <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-medium">{t}</span>
                      ))}
                    </div>

                    {/* Prompt text */}
                    <div className="bg-background/60 rounded-md p-3">
                      <p className={`text-xs font-mono text-foreground whitespace-pre-wrap ${expanded[s.id] === "packaged" ? "" : "line-clamp-5"}`}>
                        {s.packaged_prompt}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="px-5 py-2.5 bg-muted/30 border-b border-border/50">
                    <div className="flex items-center gap-1.5">
                      <Zap className="h-3 w-3 text-muted-foreground animate-pulse" />
                      <span className="text-[10px] text-muted-foreground">Waiting for OpenClaw to process…</span>
                    </div>
                  </div>
                )}

                {/* Raw Submission — collapsible */}
                <div className="px-5 py-2.5 border-b border-border/50">
                  <button
                    onClick={() => toggleExpand(s.id, "raw")}
                    className="flex items-center gap-1.5 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <FileText className="h-3 w-3" />
                    Raw Submission
                    {expanded[s.id] === "raw" ? <ChevronUp className="h-3 w-3 ml-auto" /> : <ChevronDown className="h-3 w-3 ml-auto" />}
                  </button>
                  {expanded[s.id] === "raw" && (
                    <div className="mt-2 bg-muted/40 rounded-md p-3">
                      <p className="text-xs font-mono text-foreground whitespace-pre-wrap">{s.raw_prompt}</p>
                    </div>
                  )}
                </div>

                {/* Actions for pending/packaged */}
                {(s.status === "pending_review" || s.status === "packaged") && (
                  <div className="px-5 py-3">
                    <Textarea
                      placeholder="Admin notes (optional)..."
                      value={adminNotes[s.id] || ""}
                      onChange={(e) => setAdminNotes((prev) => ({ ...prev, [s.id]: e.target.value }))}
                      className="bg-background border-border text-xs min-h-[56px] mb-3"
                    />
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" onClick={() => approve(s)} className="text-xs">
                        <CheckCircle className="h-3.5 w-3.5 mr-1" /> Approve & Publish
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => updateStatus(s.id, "needs_revision")} className="border-border text-xs">
                        <Clock className="h-3.5 w-3.5 mr-1" /> Needs Revision
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => updateStatus(s.id, "rejected")} className="text-xs">
                        <XCircle className="h-3.5 w-3.5 mr-1" /> Reject
                      </Button>
                    </div>
                  </div>
                )}

                {/* Admin notes for resolved */}
                {s.admin_notes && s.status !== "pending_review" && s.status !== "packaged" && (
                  <div className="px-5 pb-3">
                    <p className="text-[11px] text-muted-foreground italic border-l-2 border-border pl-2">Notes: {s.admin_notes}</p>
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
