import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Phone, Mail, Globe, MapPin, Users, Clock, ChevronDown, ChevronUp, ScanSearch, Send, Eye } from "lucide-react";
import { format } from "date-fns";

function stripMarkdown(text: string): string {
  return text
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\*{1,3}([^*]+)\*{1,3}/g, "$1")
    .replace(/^[-*]\s+/gm, "• ")
    .replace(/^---+$/gm, "")
    .replace(/`{1,3}[^`]*`{1,3}/g, (m) => m.replace(/`/g, ""))
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

interface Lead {
  id: string;
  business_name: string;
  contact_name: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  city: string | null;
  address: string | null;
  category: string | null;
  pipeline_status: string;
  source: string;
  notes: string | null;
  audit_summary: string | null;
  rating: number | null;
  website_quality_score: number | null;
  created_at: string;
}

interface AgentRun {
  id: string;
  status: string;
  triggered_at: string;
  result_summary: string | null;
  agent_name: string;
  agent_slug: string;
  input_payload: Record<string, any> | null;
}

interface LeadDetailDrawerProps {
  lead: Lead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const STATUS_COLORS: Record<string, string> = {
  completed: "bg-green-500/20 text-green-400",
  queued: "bg-amber-500/20 text-amber-400",
  running: "bg-blue-500/20 text-blue-400",
  failed: "bg-destructive/20 text-destructive",
};

// Parse email draft from result_summary
function parseEmailDraft(text: string): { subject: string; body: string; to: string } | null {
  if (!text.includes("COLD EMAIL DRAFT") && !text.includes("EMAIL DRIP")) return null;
  const toMatch = text.match(/TO:\s*(.+)/i);
  const subjectMatch = text.match(/Subject:\s*(.+)/i);
  // Get body after "Body:" or after subject line
  let body = "";
  const bodyMatch = text.match(/Body:\s*([\s\S]*?)(?=EMAIL \d|$)/i);
  if (bodyMatch) {
    body = bodyMatch[1].trim();
  } else if (subjectMatch) {
    const afterSubject = text.split(/Subject:.+/i)[1] || "";
    body = afterSubject.replace(/^[\s\n]+/, "").trim();
  }
  return {
    to: toMatch?.[1]?.trim() || "",
    subject: subjectMatch?.[1]?.trim() || "",
    body: stripMarkdown(body),
  };
}

export function LeadDetailDrawer({ lead, open, onOpenChange }: LeadDetailDrawerProps) {
  const [runs, setRuns] = useState<AgentRun[]>([]);
  const [loadingRuns, setLoadingRuns] = useState(false);
  const [expandedRun, setExpandedRun] = useState<string | null>(null);

  useEffect(() => {
    if (!lead || !open) return;
    setExpandedRun(null);
    fetchRuns();
  }, [lead?.id, open]);

  const fetchRuns = async () => {
    if (!lead) return;
    setLoadingRuns(true);
    const { data } = await supabase
      .from("agent_runs")
      .select("id, status, triggered_at, result_summary, agent_id, input_payload")
      .contains("input_payload", { lead_id: lead.id })
      .order("triggered_at", { ascending: false })
      .limit(20);

    if (data && data.length > 0) {
      const agentIds = [...new Set(data.map((r) => r.agent_id))];
      const { data: agents } = await supabase
        .from("agents")
        .select("id, name, slug")
        .in("id", agentIds);
      const agentMap = Object.fromEntries((agents || []).map((a) => [a.id, { name: a.name, slug: a.slug }]));

      setRuns(
        data.map((r) => ({
          id: r.id,
          status: r.status,
          triggered_at: r.triggered_at,
          result_summary: r.result_summary,
          agent_name: agentMap[r.agent_id]?.name || "Agent",
          agent_slug: agentMap[r.agent_id]?.slug || "",
          input_payload: r.input_payload as Record<string, any> | null,
        }))
      );
    } else {
      setRuns([]);
    }
    setLoadingRuns(false);
  };

  // Get latest scan and email draft from runs
  const latestScan = runs.find((r) => r.agent_slug === "site-audit" && r.status === "completed");
  const latestEmailDraft = runs.find(
    (r) => (r.agent_slug === "cold-email-outreach" || r.agent_slug === "email-drip") && r.status === "completed"
  );
  const parsedEmail = latestEmailDraft?.result_summary ? parseEmailDraft(latestEmailDraft.result_summary) : null;

  if (!lead) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-base">{lead.business_name}</SheetTitle>
          <SheetDescription className="text-xs">Lead details, scan results, and agent history</SheetDescription>
        </SheetHeader>

        <div className="mt-4 space-y-5">
          {/* Contact Info */}
          <section className="space-y-2">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Contact</h3>
            <div className="space-y-1.5 text-sm">
              {lead.contact_name && (
                <div className="flex items-center gap-2 text-foreground">
                  <Users className="h-3.5 w-3.5 text-muted-foreground" /> {lead.contact_name}
                </div>
              )}
              {lead.phone && (
                <a href={`tel:${lead.phone}`} className="flex items-center gap-2 text-foreground hover:text-primary transition-colors">
                  <Phone className="h-3.5 w-3.5 text-muted-foreground" /> {lead.phone}
                </a>
              )}
              {lead.email && (
                <a href={`mailto:${lead.email}`} className="flex items-center gap-2 text-foreground hover:text-primary transition-colors">
                  <Mail className="h-3.5 w-3.5 text-muted-foreground" /> {lead.email}
                </a>
              )}
              {lead.website && (
                <a href={lead.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-foreground hover:text-primary transition-colors truncate">
                  <Globe className="h-3.5 w-3.5 text-muted-foreground shrink-0" /> {lead.website.replace(/https?:\/\/(www\.)?/, "")}
                </a>
              )}
              {lead.address && (
                <div className="flex items-center gap-2 text-foreground">
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" /> {lead.address}
                </div>
              )}
              {lead.city && !lead.address?.includes(lead.city) && (
                <div className="flex items-center gap-2 text-foreground">
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground" /> {lead.city}
                </div>
              )}
            </div>
          </section>

          {/* Meta */}
          <section className="space-y-2">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Details</h3>
            <div className="flex flex-wrap gap-2 text-xs">
              {lead.category && <Badge variant="outline">{lead.category}</Badge>}
              <Badge variant="outline" className="capitalize">{lead.source.replace(/_/g, " ")}</Badge>
              {lead.rating != null && <Badge variant="outline">Score: {lead.rating}</Badge>}
              {lead.website_quality_score != null && <Badge variant="outline">Site: {lead.website_quality_score}/100</Badge>}
            </div>
            <p className="text-[11px] text-muted-foreground">
              Added {format(new Date(lead.created_at), "MMM d, yyyy")}
            </p>
          </section>

          {/* Scan Results (Latest) */}
          {latestScan?.result_summary && (
            <section className="space-y-2">
              <div className="flex items-center gap-2">
                <ScanSearch className="h-3.5 w-3.5 text-primary" />
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Scan Results</h3>
                <span className="text-[10px] text-muted-foreground ml-auto">
                  {format(new Date(latestScan.triggered_at), "MMM d, yyyy")}
                </span>
              </div>
              <div className="text-sm text-foreground whitespace-pre-wrap bg-muted/40 rounded-md p-3 border border-border max-h-[300px] overflow-y-auto">
                {stripMarkdown(latestScan.result_summary)}
              </div>
            </section>
          )}

          {/* Audit Summary (from lead record, shown if no scan run) */}
          {!latestScan && lead.audit_summary && (
            <section className="space-y-2">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Audit Summary</h3>
              <p className="text-sm text-foreground whitespace-pre-wrap bg-muted/40 rounded-md p-3 border border-border">
                {stripMarkdown(lead.audit_summary)}
              </p>
            </section>
          )}

          {/* Email Draft Preview */}
          {parsedEmail && (
            <section className="space-y-2">
              <div className="flex items-center gap-2">
                <Send className="h-3.5 w-3.5 text-primary" />
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Email Draft</h3>
                <Badge variant="outline" className="text-[10px] bg-amber-500/20 text-amber-400 ml-auto">Ready to review</Badge>
              </div>
              <div className="rounded-md border border-border bg-muted/40 p-3 space-y-2">
                <div className="text-[11px] text-muted-foreground">
                  To: <span className="text-foreground">{parsedEmail.to}</span>
                </div>
                {parsedEmail.subject && (
                  <div className="text-[11px] text-muted-foreground">
                    Subject: <span className="text-foreground font-medium">{parsedEmail.subject}</span>
                  </div>
                )}
                <div className="border-t border-border pt-2 text-sm text-foreground whitespace-pre-wrap">
                  {parsedEmail.body}
                </div>
              </div>
            </section>
          )}

          {/* Notes */}
          {lead.notes && (
            <section className="space-y-2">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Notes</h3>
              <p className="text-sm text-foreground whitespace-pre-wrap bg-muted/40 rounded-md p-3 border border-border">
                {lead.notes}
              </p>
            </section>
          )}

          {/* Run History */}
          <section className="space-y-2">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Agent Run History</h3>
            {loadingRuns ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            ) : runs.length === 0 ? (
              <p className="text-xs text-muted-foreground">No agent runs yet.</p>
            ) : (
              <div className="space-y-2">
                {runs.map((run) => {
                  const isExpanded = expandedRun === run.id;
                  return (
                    <div key={run.id} className="rounded-md border border-border bg-muted/30 p-3 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-foreground">{run.agent_name}</span>
                        <div className="flex items-center gap-1.5">
                          <Badge variant="outline" className={`text-[10px] ${STATUS_COLORS[run.status] || ""}`}>
                            {run.status}
                          </Badge>
                          {run.result_summary && (
                            <button
                              onClick={() => setExpandedRun(isExpanded ? null : run.id)}
                              className="p-0.5 rounded hover:bg-muted transition-colors"
                            >
                              {isExpanded ? (
                                <ChevronUp className="h-3 w-3 text-muted-foreground" />
                              ) : (
                                <Eye className="h-3 w-3 text-muted-foreground" />
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {format(new Date(run.triggered_at), "MMM d, yyyy h:mm a")}
                      </div>
                      {!isExpanded && run.result_summary && (
                        <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">{stripMarkdown(run.result_summary).slice(0, 120)}...</p>
                      )}
                      {isExpanded && run.result_summary && (
                        <div className="mt-2 text-[11px] text-foreground whitespace-pre-wrap bg-background/50 rounded p-2 border border-border max-h-[250px] overflow-y-auto">
                          {stripMarkdown(run.result_summary)}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}
