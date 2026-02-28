import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { AuthGate } from "@/components/AuthGate";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import {
  Share2, Search, FileText, MessageSquare, Package, ScanLine,
  CalendarDays, Mail, Eye, UserCheck, ChevronDown, ChevronUp,
  Play, Zap, CheckCircle2, Clock, Loader2, History, Copy, CheckCheck,
  Info, Video, Phone, Layers, Award, Radar, FileSearch, PhoneCall,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const ICON_MAP: Record<string, React.ElementType> = {
  Share2, Search, FileText, MessageSquare, Package, ScanLine,
  CalendarDays, Mail, Eye, UserCheck, Video, Phone,
  Layers, Award, Radar, FileSearch, PhoneCall, Zap,
};

const CATEGORY_COLORS: Record<string, string> = {
  Content: "bg-primary/20 text-primary border-primary/30",
  Research: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  Outreach: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  Bundle: "bg-amber-500/20 text-amber-400 border-amber-500/30",
};

// Input form config per agent slug
const AGENT_INPUTS: Record<string, { label: string; key: string; type: "text" | "textarea" | "select"; placeholder?: string; options?: string[] }[]> = {
  "site-audit": [{ label: "Your Live App URL", key: "url", type: "text", placeholder: "https://your-app.lovable.app" }],
  "lead-prospector": [
    { label: "City / Market", key: "city", type: "text", placeholder: "Atlanta, GA" },
    { label: "Business Category", key: "category", type: "text", placeholder: "Dental practices" },
  ],
  "website-proposal": [
    { label: "Business Name", key: "business_name", type: "text", placeholder: "Atlanta Smiles Dental" },
    { label: "Their Website URL", key: "url", type: "text", placeholder: "https://atlantasmiles.com" },
  ],
  "social-media": [
    { label: "What did you build?", key: "topic", type: "textarea", placeholder: "Built a SaaS billing dashboard with Stripe integration..." },
    { label: "Platform", key: "platform", type: "select", options: ["All platforms", "Twitter/X", "LinkedIn", "Instagram"] },
  ],
  "competitor-intel": [{ label: "Competitor URL", key: "url", type: "text", placeholder: "https://competitor.com" }],
  "prompt-packager": [{ label: "Your Raw Prompt", key: "raw_prompt", type: "textarea", placeholder: "Build a dashboard that shows..." }],
  "weekly-recap": [{ label: "What did you work on this week?", key: "builds", type: "textarea", placeholder: "Built a lead capture form, prototyped a booking system..." }],
  "sms-followup": [
    { label: "Applicant Name", key: "applicant_name", type: "text", placeholder: "John Martinez" },
    { label: "Status", key: "status", type: "select", options: ["accepted", "waitlisted", "rejected"] },
    { label: "Additional context (optional)", key: "custom_message", type: "textarea", placeholder: "Any special notes..." },
  ],
  "onboarding": [
    { label: "Member Name", key: "member_name", type: "text", placeholder: "Sarah Chen" },
    { label: "Their product / idea", key: "product_idea", type: "textarea", placeholder: "SaaS tool for dental practice management..." },
  ],
  "email-drip": [
    { label: "Lead Name", key: "lead_name", type: "text", placeholder: "Dr. Chen" },
    { label: "Lead Email", key: "lead_email", type: "text", placeholder: "drchen@atlantasmiles.com" },
    { label: "Business Name", key: "business_name", type: "text", placeholder: "Atlanta Smiles Dental" },
    { label: "Website URL", key: "url", type: "text", placeholder: "https://atlantasmiles.com" },
    { label: "Niche", key: "niche", type: "select", options: ["Dental", "Restaurant", "Real Estate", "Law Firm", "Fitness", "Auto Shop", "Plumbing", "Roofing", "Salon / Beauty", "Other"] },
    { label: "Your Name", key: "sender_name", type: "text", placeholder: "Your Name" },
    { label: "Your Email", key: "sender_email", type: "text", placeholder: "you@yourdomain.com" },
    { label: "Pitch Context", key: "pitch_context", type: "textarea", placeholder: "Outdated website, no online booking, missing mobile version..." },
  ],
  "cold-email-outreach": [
    { label: "Business Name", key: "business_name", type: "text", placeholder: "Atlanta Smiles Dental" },
    { label: "Website URL", key: "url", type: "text", placeholder: "https://atlantasmiles.com" },
    { label: "Audit Pain Points", key: "pain_points", type: "textarea", placeholder: "No mobile version, missing contact form, outdated design, no Google reviews widget..." },
    { label: "Niche / Industry", key: "niche", type: "select", options: ["Dental", "Restaurant", "Real Estate", "Law Firm", "Fitness", "Auto Shop", "Plumbing", "Roofing", "Salon / Beauty", "Other Local Business"] },
  ],
  "sms-outreach": [
    { label: "Lead Name", key: "lead_name", type: "text", placeholder: "Dr. Chen" },
    { label: "Phone Number", key: "phone", type: "text", placeholder: "+14045551234" },
    { label: "Pitch Context", key: "pitch_context", type: "textarea", placeholder: "Dental practice in Atlanta, outdated website, no online booking..." },
  ],
  "cold-call": [
    { label: "Lead Name", key: "lead_name", type: "text", placeholder: "Dr. Chen" },
    { label: "Phone Number", key: "phone", type: "text", placeholder: "+14045551234" },
    { label: "Pitch Context", key: "pitch_context", type: "textarea", placeholder: "Dental practice in Atlanta, outdated website, no online booking..." },
  ],
  "video-content": [
    { label: "Topic / What You Built", key: "topic", type: "textarea", placeholder: "Built a SaaS dashboard with Stripe billing, appointment booking system..." },
    { label: "Platform", key: "platform", type: "select", options: ["YouTube", "TikTok", "Instagram Reels", "All Platforms"] },
    { label: "Tone", key: "tone", type: "select", options: ["Educational", "Hype / Energy", "Professional", "Behind-the-scenes"] },
  ],
  "deep-researcher": [
    { label: "Research Topic", key: "topic", type: "textarea", placeholder: "Market analysis for AI-powered dental scheduling tools in Florida..." },
    { label: "Depth", key: "depth", type: "select", options: ["Quick scan", "Standard", "Deep dive"] },
  ],
  "content-writer": [
    { label: "What to Write", key: "topic", type: "textarea", placeholder: "Blog post about benefits of AI for small business owners..." },
    { label: "Format", key: "format", type: "select", options: ["Blog post", "Landing page copy", "Email sequence", "Social media posts", "Case study"] },
    { label: "Tone", key: "tone", type: "select", options: ["Professional", "Casual", "Persuasive", "Educational"] },
  ],
  "website-auditor": [
    { label: "Website URL", key: "url", type: "text", placeholder: "https://example.com" },
    { label: "Focus Area", key: "focus", type: "select", options: ["Full audit", "SEO only", "UX/Design", "Performance", "Mobile"] },
  ],
  "slide-generator": [
    { label: "Presentation Topic", key: "topic", type: "textarea", placeholder: "Sales pitch deck for our AI lead gen platform..." },
    { label: "Slide Count", key: "slide_count", type: "select", options: ["5", "10", "15", "20"] },
    { label: "Style", key: "style", type: "select", options: ["Corporate", "Startup", "Creative", "Minimal"] },
  ],
  "code-interpreter": [
    { label: "Task Description", key: "task", type: "textarea", placeholder: "Write a Python script that scrapes Google Maps listings for dentists in Miami..." },
    { label: "Language", key: "language", type: "select", options: ["Python", "JavaScript", "TypeScript", "SQL", "Bash"] },
    { label: "Context (optional)", key: "context", type: "textarea", placeholder: "Any additional context or constraints..." },
  ],
  "carousel-generator": [
    { label: "Product / Service", key: "product", type: "text", placeholder: "AI-powered website builder for dentists" },
    { label: "Slide Count", key: "slideCount", type: "select", options: ["3", "5", "7", "10"] },
    { label: "Platform", key: "platform", type: "select", options: ["Facebook", "Instagram", "LinkedIn", "All platforms"] },
    { label: "Offer / CTA", key: "offer", type: "text", placeholder: "Free website audit + 30-day trial" },
    { label: "Target Audience", key: "targetAudience", type: "text", placeholder: "Dental practice owners aged 35-55" },
  ],
  "browser-operator": [
    { label: "Instruction", key: "instruction", type: "textarea", placeholder: "Go to competitor websites and extract their pricing, features, and testimonials..." },
    { label: "URLs (comma-separated)", key: "urls", type: "textarea", placeholder: "https://competitor1.com, https://competitor2.com" },
    { label: "Max Pages", key: "maxPages", type: "select", options: ["3", "5", "10", "20"] },
  ],
  "image-generator": [
    { label: "Image Prompt", key: "prompt", type: "textarea", placeholder: "Modern dental office hero image with happy patient, clean white background, professional lighting..." },
    { label: "Style", key: "style", type: "select", options: ["Photorealistic", "Illustration", "Flat design", "3D render", "Watercolor"] },
    { label: "Dimensions", key: "dimensions", type: "select", options: ["1080x1080 (Square)", "1200x628 (Facebook)", "1080x1920 (Story)", "1920x1080 (Banner)"] },
    { label: "Number of Images", key: "count", type: "select", options: ["1", "2", "3", "4"] },
  ],
};

interface Agent {
  id: string;
  name: string;
  slug: string;
  headline: string;
  description: string;
  what_it_does: string;
  use_cases: string[];
  example_output: string | null;
  job_type: string;
  category: string;
  icon_name: string;
  price_cents: number;
  stripe_price_id: string | null;
  status: string;
  included_with_membership: boolean;
}

interface AgentLease {
  id: string;
  agent_id: string;
  status: string;
  leased_at: string;
  schedule: string | null;
  next_run_at: string | null;
}

interface AgentRun {
  id: string;
  agent_id: string;
  lease_id: string;
  triggered_at: string;
  status: string;
  result_summary: string | null;
  input_payload: Record<string, string> | null;
}

// Parse lead prospector text output into structured rows
function parseLeads(text: string): { name: string; phone: string; email: string; website: string; notes: string }[] {
  const lines = text.split("\n");
  const leads: { name: string; phone: string; email: string; website: string; notes: string }[] = [];
  let current: Record<string, string> = {};

  const flush = () => {
    if (current.name) {
      leads.push({
        name: current.name || "",
        phone: current.phone || "Research needed",
        email: current.email || "Research needed",
        website: current.website || "",
        notes: current.notes || "",
      });
      current = {};
    }
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (/^-?\s*Business Name[:\s]/i.test(trimmed)) {
      flush();
      current.name = trimmed.replace(/^-?\s*Business Name[:\s]*/i, "").trim();
    } else if (/^-?\s*Phone[:\s]/i.test(trimmed)) {
      current.phone = trimmed.replace(/^-?\s*Phone[:\s]*/i, "").trim();
    } else if (/^-?\s*Email[:\s]/i.test(trimmed)) {
      current.email = trimmed.replace(/^-?\s*Email[:\s]*/i, "").trim();
    } else if (/^-?\s*Website[:\s]/i.test(trimmed)) {
      current.website = trimmed.replace(/^-?\s*Website[:\s]*/i, "").trim();
    } else if (/^-?\s*Notes[:\s]/i.test(trimmed)) {
      current.notes = trimmed.replace(/^-?\s*Notes[:\s]*/i, "").trim();
    }
  }
  flush();
  return leads;
}

function RunAgentModal({
  agent,
  lease,
  open,
  onClose,
  onRunComplete,
  onHandoffToProposal,
  onHandoffToSms,
  onHandoffToCall,
  onHandoffToAudit,
  onHandoffToEmailDrip,
  initialValues,
  isHandoff,
}: {
  agent: Agent;
  lease: AgentLease;
  open: boolean;
  onClose: () => void;
  onRunComplete: () => void;
  onHandoffToProposal?: (businessName: string, url: string) => void;
  onHandoffToSms?: (leadName: string, phone: string, pitchContext: string) => void;
  onHandoffToCall?: (leadName: string, phone: string, pitchContext: string) => void;
  onHandoffToAudit?: (url: string) => void;
  onHandoffToEmailDrip?: (leadName: string, email: string, businessName: string, url: string, pitchContext: string) => void;
  initialValues?: Record<string, string>;
  isHandoff?: boolean;
}) {
  const { toast } = useToast();
  const inputConfigs = AGENT_INPUTS[agent.slug] || [];
  const [formValues, setFormValues] = useState<Record<string, string>>(initialValues || {});
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [scheduleFreq, setScheduleFreq] = useState<"daily" | "weekly">("weekly");
  const [nextRunAt, setNextRunAt] = useState<string | null>(lease.next_run_at || null);

  const handleReset = () => {
    setResult(null);
    setFormValues(initialValues || {});
  };

  // Sync initial values when switching agents (e.g. lead→proposal handoff)
  useEffect(() => {
    if (initialValues) setFormValues(initialValues);
  }, [agent.id, JSON.stringify(initialValues)]);

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handleRun = async () => {
    setRunning(true);
    setResult(null);
    try {
      const scheduleValue = scheduleEnabled ? (scheduleFreq === "daily" ? "0 9 * * *" : "0 9 * * 1") : undefined;
      const { data, error } = await supabase.functions.invoke("run-agent", {
        body: { agent_id: agent.id, lease_id: lease.id, input: formValues, schedule: scheduleValue },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setResult(data.result);
      if (scheduleEnabled && data?.next_run_at) {
        setNextRunAt(data.next_run_at);
        const nextDate = new Date(data.next_run_at).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", timeZoneName: "short" });
        toast({ title: `${agent.name} scheduled`, description: `Next run: ${nextDate}` });
      }
      onRunComplete();
    } catch (e: any) {
      toast({ title: "Agent error", description: e.message, variant: "destructive" });
    } finally {
      setRunning(false);
    }
  };

  const handleCopy = () => {
    if (result) {
      navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm font-semibold">
            <div className={`p-1.5 rounded-md border ${CATEGORY_COLORS[agent.category] || ""}`}>
              {(() => { const Icon = ICON_MAP[agent.icon_name] || Package; return <Icon className="h-4 w-4" />; })()}
            </div>
            Run {agent.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {!result ? (
            <>
              {/* Handoff banner — shown when pre-filled from Lead Prospector */}
              {isHandoff && (initialValues?.business_name || initialValues?.lead_name) && (
                <div className="flex items-start gap-2.5 bg-primary/10 border border-primary/30 rounded-md p-3">
                  <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-primary">Pre-filled from Lead Prospector</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Lead data carried over for <span className="text-foreground font-medium">{initialValues.business_name || initialValues.lead_name}</span>. Review and run when ready.
                    </p>
                  </div>
                </div>
              )}

              <p className="text-xs text-muted-foreground">{agent.headline}</p>

              {inputConfigs.length === 0 ? (
                <div className="bg-muted/30 rounded-md p-4 text-xs text-muted-foreground">
                  This agent runs automatically — no inputs required. Click Run to start.
                </div>
              ) : (
                <div className="space-y-3">
                  {inputConfigs.map((config) => (
                    <div key={config.key} className="space-y-1.5">
                      <Label className="text-xs">{config.label}</Label>
                      {config.type === "textarea" ? (
                        <Textarea
                          placeholder={config.placeholder}
                          value={formValues[config.key] || ""}
                          onChange={(e) => setFormValues((p) => ({ ...p, [config.key]: e.target.value }))}
                          className="text-xs min-h-[80px]"
                        />
                      ) : config.type === "select" ? (
                        <Select
                          value={formValues[config.key] || ""}
                          onValueChange={(v) => setFormValues((p) => ({ ...p, [config.key]: v }))}
                        >
                          <SelectTrigger className="text-xs h-8">
                            <SelectValue placeholder={`Select ${config.label}`} />
                          </SelectTrigger>
                          <SelectContent>
                            {config.options?.map((opt) => (
                              <SelectItem key={opt} value={opt} className="text-xs">{opt}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          placeholder={config.placeholder}
                          value={formValues[config.key] || ""}
                          onChange={(e) => setFormValues((p) => ({ ...p, [config.key]: e.target.value }))}
                          className="text-xs h-8"
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Schedule toggle */}
              <div className="border border-border rounded-md p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-foreground">Schedule recurring runs</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Run automatically and notify you on Engine</p>
                  </div>
                  <Switch checked={scheduleEnabled} onCheckedChange={setScheduleEnabled} />
                </div>
                {scheduleEnabled && (
                  <div className="flex gap-2">
                    {(["daily", "weekly"] as const).map((f) => (
                      <button
                        key={f}
                        onClick={() => setScheduleFreq(f)}
                        className={`flex-1 py-1.5 rounded-md text-[11px] font-medium border transition-colors ${
                          scheduleFreq === f
                            ? "bg-primary/20 text-primary border-primary/40"
                            : "bg-transparent text-muted-foreground border-border hover:text-foreground"
                        }`}
                      >
                        {f.charAt(0).toUpperCase() + f.slice(1)}
                      </button>
                    ))}
                  </div>
                )}
                {nextRunAt && !scheduleEnabled && (
                  <div className="flex items-center gap-1.5 pt-1">
                    <Clock className="h-3 w-3 text-primary" />
                    <span className="text-[10px] text-primary font-medium">
                      Next run: {new Date(nextRunAt).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", timeZoneName: "short" })}
                    </span>
                  </div>
                )}
              </div>

              <Button onClick={handleRun} disabled={running} className="w-full">
                {running ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Agent Running...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    {scheduleEnabled ? `Run & Schedule ${scheduleFreq}` : `Run ${agent.name}`}
                  </>
                )}
              </Button>
            </>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  <span className="text-xs font-semibold text-foreground">Agent completed</span>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="h-7 text-xs" onClick={handleCopy}>
                    {copied ? <CheckCheck className="h-3 w-3 mr-1 text-emerald-400" /> : <Copy className="h-3 w-3 mr-1" />}
                    {copied ? "Copied!" : "Copy"}
                  </Button>
                  <Button size="sm" variant="outline" className="h-7 text-xs" onClick={handleReset}>
                    Run Again
                  </Button>
                </div>
              </div>

              {/* Lead Prospector: parsed lead table with handoff buttons */}
              {agent.slug === "lead-prospector" && (() => {
                const leads = parseLeads(result!);
                if (leads.length > 0) return (
                  <div className="space-y-2">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                      {leads.length} leads found — hand off to Proposal, SMS, or Call
                    </p>
                    <div className="rounded-md border border-border overflow-hidden">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-border bg-muted/40">
                            <th className="text-left p-2 text-[10px] font-semibold text-muted-foreground">Business</th>
                            <th className="text-left p-2 text-[10px] font-semibold text-muted-foreground hidden sm:table-cell">Website</th>
                            <th className="text-left p-2 text-[10px] font-semibold text-muted-foreground hidden md:table-cell">Phone</th>
                            <th className="p-2"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {leads.map((lead, i) => (
                            <tr key={i} className="hover:bg-muted/20 transition-colors">
                              <td className="p-2 font-medium text-foreground">{lead.name}</td>
                              <td className="p-2 text-muted-foreground hidden sm:table-cell max-w-[150px] truncate">
                                {lead.website && lead.website !== "Research needed" ? (
                                  <a href={lead.website} target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">
                                    {lead.website.replace(/^https?:\/\//, "").slice(0, 30)}
                                  </a>
                                ) : <span className="text-muted-foreground/50 italic">No website</span>}
                              </td>
                              <td className="p-2 text-muted-foreground hidden md:table-cell">{lead.phone}</td>
                              <td className="p-2">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  {onHandoffToAudit && lead.website && lead.website !== "Research needed" && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-6 text-[10px] px-2 gap-1 border-amber-500/40 text-amber-400 hover:bg-amber-500/10"
                                      onClick={() => {
                                        onHandoffToAudit(lead.website);
                                        onClose();
                                      }}
                                    >
                                      <ScanLine className="h-3 w-3" />
                                      Audit
                                    </Button>
                                  )}
                                  {onHandoffToProposal && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-6 text-[10px] px-2 gap-1 border-primary/40 text-primary hover:bg-primary/10"
                                      onClick={() => {
                                        onHandoffToProposal(lead.name, lead.website || "");
                                        onClose();
                                      }}
                                    >
                                      → Proposal
                                    </Button>
                                  )}
                                  {onHandoffToSms && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-6 text-[10px] px-2 gap-1 border-blue-500/40 text-blue-400 hover:bg-blue-500/10"
                                      disabled={!lead.phone || lead.phone === "Research needed"}
                                      onClick={() => {
                                        onHandoffToSms(lead.name, lead.phone, `${lead.name} — ${lead.website || "no website"} — ${lead.notes || ""}`);
                                        onClose();
                                      }}
                                    >
                                      <MessageSquare className="h-3 w-3" />
                                      SMS
                                    </Button>
                                  )}
                                  {onHandoffToCall && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-6 text-[10px] px-2 gap-1 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10"
                                      disabled={!lead.phone || lead.phone === "Research needed"}
                                      onClick={() => {
                                        onHandoffToCall(lead.name, lead.phone, `${lead.name} — ${lead.website || "no website"} — ${lead.notes || ""}`);
                                        onClose();
                                      }}
                                    >
                                      <Phone className="h-3 w-3" />
                                      Call
                                    </Button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
                return null;
              })()}

              {/* Site Audit: handoff buttons to Email Drip, SMS, Call, Proposal */}
              {agent.slug === "site-audit" && result && (
                <div className="flex flex-wrap gap-2">
                  <p className="w-full text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">
                    Hand off audit findings
                  </p>
                  {onHandoffToEmailDrip && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-[10px] px-3 gap-1.5 border-primary/40 text-primary hover:bg-primary/10"
                      onClick={() => {
                        const url = formValues.url || "";
                        onHandoffToEmailDrip("", "", "", url, result!.slice(0, 500));
                        onClose();
                      }}
                    >
                      <Mail className="h-3 w-3" />
                      → Email Drip
                    </Button>
                  )}
                  {onHandoffToSms && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-[10px] px-3 gap-1.5 border-blue-500/40 text-blue-400 hover:bg-blue-500/10"
                      onClick={() => {
                        onHandoffToSms("", "", result!.slice(0, 300));
                        onClose();
                      }}
                    >
                      <MessageSquare className="h-3 w-3" />
                      → SMS
                    </Button>
                  )}
                  {onHandoffToCall && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-[10px] px-3 gap-1.5 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10"
                      onClick={() => {
                        onHandoffToCall("", "", result!.slice(0, 300));
                        onClose();
                      }}
                    >
                      <Phone className="h-3 w-3" />
                      → Call
                    </Button>
                  )}
                  {onHandoffToProposal && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-[10px] px-3 gap-1.5 border-primary/40 text-primary hover:bg-primary/10"
                      onClick={() => {
                        onHandoffToProposal("", formValues.url || "");
                        onClose();
                      }}
                    >
                      <FileText className="h-3 w-3" />
                      → Proposal
                    </Button>
                  )}
                </div>
              )}

              <div className="bg-muted/50 border border-border rounded-md p-4 max-h-[300px] overflow-y-auto">
                <pre className="text-xs text-foreground whitespace-pre-wrap leading-relaxed font-mono">
                  {result}
                </pre>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AgentCard({
  agent,
  lease,
  lastRun,
  onLease,
  onRun,
  onActivateIncluded,
  leasing,
  activating,
  isAdmin,
}: {
  agent: Agent;
  lease: AgentLease | null;
  lastRun: AgentRun | null;
  onLease: (agent: Agent) => void;
  onRun: (agent: Agent) => void;
  onActivateIncluded: (agent: Agent) => void;
  leasing: boolean;
  activating: boolean;
  isAdmin: boolean;
}) {
  const [exampleOpen, setExampleOpen] = useState(false);
  const IconComponent = ICON_MAP[agent.icon_name] || Package;
  const isActive = lease?.status === "active";
  const hasStripePrice = !!agent.stripe_price_id;
  const canLease = agent.status === "active" && hasStripePrice && !agent.included_with_membership;
  const price = (agent.price_cents / 100).toFixed(0);

  return (
    <Card className={`bg-card flex flex-col ${agent.included_with_membership ? "border-primary/40" : "border-border"}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg border ${CATEGORY_COLORS[agent.category] || "bg-muted text-muted-foreground border-border"}`}>
              <IconComponent className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-semibold text-foreground">{agent.name}</h3>
                <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-4 border ${CATEGORY_COLORS[agent.category] || ""}`}>
                  {agent.category}
                </Badge>
                {agent.included_with_membership && (
                  <Badge className="text-[10px] px-1.5 py-0 h-4 bg-primary/20 text-primary border border-primary/40">
                    Included
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{agent.headline}</p>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1 shrink-0">
            {isActive ? (
              <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px]">
                <CheckCircle2 className="h-3 w-3 mr-1" /> Active
              </Badge>
            ) : agent.status === "coming_soon" ? (
              <Badge variant="outline" className="text-[10px] text-muted-foreground">Coming Soon</Badge>
            ) : null}
            {agent.included_with_membership ? (
              <span className="text-xs font-bold text-primary">Included</span>
            ) : (
              <span className="text-xs font-bold text-primary">${price}/mo</span>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col gap-4 pt-0">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1.5">What This Agent Does</p>
          <p className="text-xs text-muted-foreground leading-relaxed">{agent.what_it_does}</p>
        </div>

        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1.5">Use Cases</p>
          <ul className="space-y-1.5">
            {agent.use_cases.map((uc, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                <Zap className="h-3 w-3 text-primary shrink-0 mt-0.5" />
                <span>{uc}</span>
              </li>
            ))}
          </ul>
        </div>

        {agent.example_output && (
          <Collapsible open={exampleOpen} onOpenChange={setExampleOpen}>
            <CollapsibleTrigger className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors font-semibold">
              Example Output
              {exampleOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2">
              <div className="rounded-md bg-muted/50 border border-border p-3">
                <pre className="text-[11px] text-muted-foreground whitespace-pre-wrap font-mono leading-relaxed">
                  {agent.example_output}
                </pre>
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}

        {isActive && lastRun && (
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <Clock className="h-3 w-3" />
            Last run: {new Date(lastRun.triggered_at).toLocaleDateString()}
          </div>
        )}

        <div className="mt-auto pt-2">
          {isActive ? (
            <Button size="sm" className="w-full" onClick={() => onRun(agent)}>
              <Play className="h-3.5 w-3.5 mr-1.5" /> Run Agent
            </Button>
          ) : isAdmin && agent.status === "active" ? (
            <Button size="sm" className="w-full" onClick={() => onActivateIncluded(agent)} disabled={activating}>
              {activating ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />}
              Activate — Admin Access
            </Button>
          ) : agent.included_with_membership ? (
            <Button size="sm" className="w-full" onClick={() => onActivateIncluded(agent)} disabled={activating}>
              {activating ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />}
              Activate — Included Free
            </Button>
          ) : canLease ? (
            <Button size="sm" className="w-full" onClick={() => onLease(agent)} disabled={leasing}>
              {leasing ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : null}
              Lease Agent — ${price}/mo
            </Button>
          ) : (
            <Button size="sm" className="w-full" variant="outline" disabled>
              Coming Soon
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

const STATUS_COLORS: Record<string, string> = {
  completed: "text-emerald-400 border-emerald-500/30",
  running: "text-blue-400 border-blue-500/30",
  queued: "text-primary border-primary/30",
  failed: "text-destructive border-destructive/30",
};

function RunHistory({ runs, agents }: { runs: AgentRun[]; agents: Agent[] }) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  if (runs.length === 0) return null;

  return (
    <div className="mt-12">
      <div className="flex items-center gap-2 mb-4">
        <History className="h-4 w-4 text-muted-foreground" />
        <p className="text-xs tracking-[0.15em] text-muted-foreground uppercase font-semibold">Run History</p>
      </div>
      <Card className="bg-card border-border">
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {runs.map((run) => {
              const agent = agents.find((a) => a.id === run.agent_id);
              const isExpanded = expanded === run.id;
              const Icon = agent ? (ICON_MAP[agent.icon_name] || Package) : Package;
              return (
                <div key={run.id} className="p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {agent && (
                        <div className={`p-1.5 rounded-md border shrink-0 ${CATEGORY_COLORS[agent.category] || ""}`}>
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-foreground">{agent?.name || "Unknown Agent"}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {new Date(run.triggered_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge
                        variant="outline"
                        className={`text-[10px] capitalize ${STATUS_COLORS[run.status] || "text-muted-foreground"}`}
                      >
                        {run.status}
                      </Badge>
                      {run.result_summary && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 text-[10px] px-2"
                          onClick={() => setExpanded(isExpanded ? null : run.id)}
                        >
                          {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                          {isExpanded ? "Hide" : "View"}
                        </Button>
                      )}
                    </div>
                  </div>

                  {isExpanded && run.result_summary && (
                    <div className="mt-3 space-y-2">
                      {run.input_payload && Object.keys(run.input_payload).length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(run.input_payload).map(([k, v]) => (
                            <span key={k} className="text-[10px] bg-muted/50 border border-border rounded px-2 py-0.5 text-muted-foreground">
                              {k}: {String(v).slice(0, 40)}{String(v).length > 40 ? "..." : ""}
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="relative">
                        <div className="bg-muted/50 border border-border rounded-md p-3 max-h-60 overflow-y-auto">
                          <pre className="text-[11px] text-foreground whitespace-pre-wrap font-mono leading-relaxed">
                            {run.result_summary}
                          </pre>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="absolute top-2 right-2 h-6 text-[10px] px-2"
                          onClick={() => handleCopy(run.id, run.result_summary!)}
                        >
                          {copied === run.id ? <CheckCheck className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function AgentsContent() {
  const { user, isChiefArchitect } = useAuth();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [leases, setLeases] = useState<AgentLease[]>([]);
  const [runs, setRuns] = useState<AgentRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [leasingId, setLeasingId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [runModalAgent, setRunModalAgent] = useState<Agent | null>(null);
  const [activatingId, setActivatingId] = useState<string | null>(null);
  const [proposalPrefill, setProposalPrefill] = useState<{ business_name: string; url: string } | null>(null);
  const [outreachPrefill, setOutreachPrefill] = useState<{ lead_name: string; phone: string; pitch_context: string } | null>(null);
  const [outreachTargetSlug, setOutreachTargetSlug] = useState<"sms-outreach" | "cold-call" | null>(null);
  const [auditPrefill, setAuditPrefill] = useState<{ url: string } | null>(null);
  const [emailDripPrefill, setEmailDripPrefill] = useState<Record<string, string> | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [agentsRes, leasesRes, runsRes] = await Promise.all([
        supabase.from("agents").select("*").order("price_cents"),
        user ? supabase.from("agent_leases").select("*").eq("user_id", user.id) : Promise.resolve({ data: [], error: null }),
        user
          ? supabase.from("agent_runs").select("*").eq("user_id", user.id).order("triggered_at", { ascending: false }).limit(50)
          : Promise.resolve({ data: [], error: null }),
      ]);
      if (agentsRes.data) setAgents(agentsRes.data as Agent[]);
      if (leasesRes.data) setLeases(leasesRes.data as AgentLease[]);
      if (runsRes.data) setRuns(runsRes.data as AgentRun[]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
    const leaseSuccess = searchParams.get("lease_success");
    const agentId = searchParams.get("agent_id");
    if (leaseSuccess === "true" && agentId) verifyLease(agentId);
  }, []);

  const verifyLease = async (agentId: string) => {
    const sessionId = searchParams.get("session_id");
    if (!sessionId) return;
    try {
      const { data, error } = await supabase.functions.invoke("verify-agent-lease", {
        body: { session_id: sessionId, agent_id: agentId },
      });
      if (error) throw error;
      toast({ title: "Agent leased!", description: "Your agent is now active and ready to run." });
      fetchData();
    } catch (e: any) {
      toast({ title: "Verification error", description: e.message, variant: "destructive" });
    }
  };

  const handleLease = async (agent: Agent) => {
    setLeasingId(agent.id);
    try {
      const { data, error } = await supabase.functions.invoke("create-agent-lease", {
        body: { agent_id: agent.id },
      });
      if (error) throw error;
      if (data?.url) window.location.href = data.url;
    } catch (e: any) {
      toast({ title: "Checkout error", description: e.message, variant: "destructive" });
    } finally {
      setLeasingId(null);
    }
  };

  const handleActivateIncluded = async (agent: Agent) => {
    if (!user) return;
    setActivatingId(agent.id);
    try {
      const { error } = await supabase.from("agent_leases").insert({
        agent_id: agent.id,
        user_id: user.id,
        status: "active",
        leased_at: new Date().toISOString(),
      });
      if (error) throw error;
      toast({ title: `${agent.name} activated!`, description: "Included with your membership. Ready to run." });
      fetchData();
    } catch (e: any) {
      toast({ title: "Activation error", description: e.message, variant: "destructive" });
    } finally {
      setActivatingId(null);
    }
  };

  const categories = ["All", ...Array.from(new Set(agents.filter(a => a.category !== "Bundle").map((a) => a.category)))];
  const bundleAgents = agents.filter((a) => a.category === "Bundle");
  const includedAgents = agents.filter((a) => a.included_with_membership && a.category !== "Bundle");
  const addOnAgents = agents.filter((a) => !a.included_with_membership && a.category !== "Bundle");
  const filteredAddOns = selectedCategory === "All" ? addOnAgents : addOnAgents.filter((a) => a.category === selectedCategory);
  const activeLeases = leases.filter((l) => l.status === "active");

  const getLastRun = (agentId: string) => runs.find((r) => r.agent_id === agentId) || null;
  const getLease = (agentId: string) => leases.find((l) => l.agent_id === agentId) || null;
  const getActiveLease = (agentId: string) => leases.find((l) => l.agent_id === agentId && l.status === "active") || null;

  const runModalLease = runModalAgent ? getActiveLease(runModalAgent.id) : null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16 px-4 container max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <p className="text-xs tracking-[0.2em] text-primary uppercase font-semibold mb-2">OpenClaw</p>
          <h1 className="text-3xl font-bold text-foreground mb-3">Workflow Marketplace</h1>
          <p className="text-muted-foreground max-w-2xl text-sm">
            We don't sell tools. We sell execution plans. Each workflow bundle is an automated pipeline that runs end-to-end — no buttons to click, no steps to manage.
          </p>
        </div>

        {/* ── Lead-to-Close Pipeline ── */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <p className="text-xs tracking-[0.15em] text-primary uppercase font-semibold">Lead-to-Close Pipeline</p>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30 font-medium">One-click handoff</span>
          </div>
          <Card className="bg-card border-border">
            <CardContent className="p-5">
              <div className="flex items-center gap-0 overflow-x-auto">
                {[
                  { slug: "lead-prospector", label: "Lead Prospector", icon: Search, desc: "Find leads" },
                  { slug: "site-audit", label: "Site Audit", icon: ScanLine, desc: "Audit site" },
                  { slug: "email-drip", label: "Email Drip", icon: Mail, desc: "3-email sequence" },
                  { slug: "sms-outreach", label: "SMS Outreach", icon: MessageSquare, desc: "Send SMS" },
                  { slug: "cold-call", label: "Cold Call", icon: Phone, desc: "AI phone call" },
                  { slug: "website-proposal", label: "Website Proposal", icon: FileText, desc: "Send proposal" },
                ].map((step, i, arr) => {
                  const agent = agents.find((a) => a.slug === step.slug);
                  const lease = agent ? getActiveLease(agent.id) : null;
                  const lastRun = agent ? getLastRun(agent.id) : null;
                  const isActive = !!lease;
                  const isCompleted = !!lastRun && lastRun.status === "completed";
                  const StepIcon = step.icon;

                  return (
                    <div key={step.slug} className="flex items-center shrink-0">
                      <div className="flex flex-col items-center gap-2 min-w-[120px]">
                        <button
                          onClick={() => {
                            if (agent && lease) setRunModalAgent(agent);
                            else if (agent && !lease && agent.included_with_membership) handleActivateIncluded(agent);
                          }}
                          disabled={!agent}
                          className={`relative p-3 rounded-xl border-2 transition-all ${
                            isCompleted
                              ? "border-emerald-500/50 bg-emerald-500/10 hover:bg-emerald-500/20"
                              : isActive
                                ? "border-primary/50 bg-primary/10 hover:bg-primary/20 cursor-pointer"
                                : "border-border bg-muted/30 opacity-60"
                          }`}
                        >
                          <StepIcon className={`h-5 w-5 ${
                            isCompleted ? "text-emerald-400" : isActive ? "text-primary" : "text-muted-foreground"
                          }`} />
                          {isCompleted && (
                            <div className="absolute -top-1 -right-1 bg-emerald-500 rounded-full p-0.5">
                              <CheckCircle2 className="h-2.5 w-2.5 text-background" />
                            </div>
                          )}
                        </button>
                        <div className="text-center">
                          <p className={`text-[11px] font-semibold ${
                            isCompleted ? "text-emerald-400" : isActive ? "text-foreground" : "text-muted-foreground"
                          }`}>
                            {step.label}
                          </p>
                          <p className="text-[10px] text-muted-foreground">{step.desc}</p>
                          {!isActive && agent && (
                            <Badge variant="outline" className="text-[9px] mt-1 h-4 px-1.5">
                              {agent.included_with_membership ? "Activate" : "Lease"}
                            </Badge>
                          )}
                          {isActive && !isCompleted && (
                            <Badge className="text-[9px] mt-1 h-4 px-1.5 bg-primary/20 text-primary border border-primary/30">
                              Ready
                            </Badge>
                          )}
                          {isCompleted && lastRun && (
                            <span className="text-[9px] text-emerald-400/70 mt-0.5 block">
                              {new Date(lastRun.triggered_at).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                      {i < arr.length - 1 && (
                        <div className={`w-8 h-0.5 mx-1 rounded-full shrink-0 ${
                          isCompleted ? "bg-emerald-500/40" : "bg-border"
                        }`} />
                      )}
                    </div>
                  );
                })}
              </div>
              <p className="text-[10px] text-muted-foreground mt-4 text-center">
                Lead Prospector → Site Audit → Email Drip → SMS → Call → Proposal
              </p>
            </CardContent>
          </Card>
        </div>

        {/* ── Workflow Bundles ── */}
        {bundleAgents.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-2">
              <p className="text-xs tracking-[0.15em] text-amber-400 uppercase font-semibold">Workflow Bundles</p>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 font-medium">Save up to 40%</span>
            </div>
            <p className="text-xs text-muted-foreground mb-5">Pre-built multi-agent workflows. One purchase activates an entire team of agents working together.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {bundleAgents.map((bundle) => {
                const IconComponent = ICON_MAP[bundle.icon_name] || Package;
                const lease = getLease(bundle.id);
                const isActive = !!lease && lease.status === "active";
                const price = (bundle.price_cents / 100).toFixed(0);

                return (
                  <Card key={bundle.id} className="bg-card border-amber-500/30 flex flex-col relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent pointer-events-none" />
                    <CardHeader className="pb-3 relative">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 rounded-lg border bg-amber-500/20 text-amber-400 border-amber-500/30">
                            <IconComponent className="h-5 w-5" />
                          </div>
                          <div>
                            <h3 className="text-sm font-semibold text-foreground">{bundle.name}</h3>
                            <p className="text-xs text-muted-foreground mt-0.5">{bundle.headline}</p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          {isActive ? (
                            <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px]">
                              <CheckCircle2 className="h-3 w-3 mr-1" /> Active
                            </Badge>
                          ) : null}
                          <span className="text-lg font-bold text-amber-400">${price}<span className="text-[10px] font-normal text-muted-foreground">/mo</span></span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col gap-4 pt-0 relative">
                      <p className="text-xs text-muted-foreground leading-relaxed">{bundle.what_it_does}</p>
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1.5">Perfect For</p>
                        <ul className="space-y-1">
                          {bundle.use_cases.slice(0, 3).map((uc, i) => (
                            <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                              <Zap className="h-3 w-3 text-amber-400 shrink-0 mt-0.5" />
                              <span>{uc}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="mt-auto pt-2">
                        {isActive ? (
                          <Button size="sm" className="w-full bg-emerald-600 hover:bg-emerald-700">
                            <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" /> Bundle Active
                          </Button>
                        ) : bundle.stripe_price_id ? (
                          <Button size="sm" className="w-full bg-amber-600 hover:bg-amber-700 text-white" onClick={() => handleLease(bundle)} disabled={leasingId === bundle.id}>
                            {leasingId === bundle.id ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Layers className="h-3.5 w-3.5 mr-1.5" />}
                            Get Bundle — ${price}/mo
                          </Button>
                        ) : (
                          <Button size="sm" className="w-full" variant="outline" disabled>
                            Coming Soon
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Individual agents removed — bundles only */}

        {/* Run History */}
        <RunHistory runs={runs} agents={agents} />
      </div>

      {/* Run Agent Modal */}
      {runModalAgent && runModalLease && (
        <RunAgentModal
          agent={runModalAgent}
          lease={runModalLease}
          open={!!runModalAgent}
          onClose={() => { setRunModalAgent(null); setProposalPrefill(null); setOutreachPrefill(null); setOutreachTargetSlug(null); setAuditPrefill(null); setEmailDripPrefill(null); }}
          onRunComplete={fetchData}
          initialValues={
            auditPrefill && runModalAgent.slug === "site-audit"
              ? auditPrefill
              : emailDripPrefill && runModalAgent.slug === "email-drip"
                ? emailDripPrefill
                : proposalPrefill
                  ? proposalPrefill
                  : outreachPrefill && outreachTargetSlug === runModalAgent.slug
                    ? outreachPrefill
                    : undefined
          }
          isHandoff={
            (!!proposalPrefill && runModalAgent.slug === "website-proposal") ||
            (!!outreachPrefill && (runModalAgent.slug === "sms-outreach" || runModalAgent.slug === "cold-call")) ||
            (!!auditPrefill && runModalAgent.slug === "site-audit") ||
            (!!emailDripPrefill && runModalAgent.slug === "email-drip")
          }
          onHandoffToAudit={(() => {
            const auditAgent = agents.find((a) => a.slug === "site-audit");
            const auditLease = auditAgent ? getActiveLease(auditAgent.id) : null;
            if (!auditAgent || !auditLease) return undefined;
            return (url: string) => {
              setAuditPrefill({ url });
              setProposalPrefill(null); setOutreachPrefill(null); setOutreachTargetSlug(null); setEmailDripPrefill(null);
              setRunModalAgent(auditAgent);
            };
          })()}
          onHandoffToEmailDrip={(() => {
            const dripAgent = agents.find((a) => a.slug === "email-drip");
            const dripLease = dripAgent ? getActiveLease(dripAgent.id) : null;
            if (!dripAgent || !dripLease) return undefined;
            return (leadName: string, email: string, businessName: string, url: string, pitchContext: string) => {
              setEmailDripPrefill({ lead_name: leadName, lead_email: email, business_name: businessName, url, pitch_context: pitchContext });
              setProposalPrefill(null); setOutreachPrefill(null); setOutreachTargetSlug(null); setAuditPrefill(null);
              setRunModalAgent(dripAgent);
            };
          })()}
          onHandoffToProposal={(() => {
            const proposalAgent = agents.find((a) => a.slug === "website-proposal");
            const proposalLease = proposalAgent ? getActiveLease(proposalAgent.id) : null;
            if (!proposalAgent || !proposalLease) return undefined;
            return (businessName: string, url: string) => {
              setProposalPrefill({ business_name: businessName, url });
              setOutreachPrefill(null); setOutreachTargetSlug(null); setAuditPrefill(null); setEmailDripPrefill(null);
              setRunModalAgent(proposalAgent);
            };
          })()}
          onHandoffToSms={(() => {
            const smsAgent = agents.find((a) => a.slug === "sms-outreach");
            const smsLease = smsAgent ? getActiveLease(smsAgent.id) : null;
            if (!smsAgent || !smsLease) return undefined;
            return (leadName: string, phone: string, pitchContext: string) => {
              setOutreachPrefill({ lead_name: leadName, phone, pitch_context: pitchContext });
              setOutreachTargetSlug("sms-outreach");
              setProposalPrefill(null); setAuditPrefill(null); setEmailDripPrefill(null);
              setRunModalAgent(smsAgent);
            };
          })()}
          onHandoffToCall={(() => {
            const callAgent = agents.find((a) => a.slug === "cold-call");
            const callLease = callAgent ? getActiveLease(callAgent.id) : null;
            if (!callAgent || !callLease) return undefined;
            return (leadName: string, phone: string, pitchContext: string) => {
              setOutreachPrefill({ lead_name: leadName, phone, pitch_context: pitchContext });
              setOutreachTargetSlug("cold-call");
              setProposalPrefill(null); setAuditPrefill(null); setEmailDripPrefill(null);
              setRunModalAgent(callAgent);
            };
          })()}
        />
      )}
    </div>
  );
}

export default function Agents() {
  return (
    <AuthGate>
      <AgentsContent />
    </AuthGate>
  );
}
