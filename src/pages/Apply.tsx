import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { track } from "@/lib/analytics";
import { ChevronRight, ChevronLeft } from "lucide-react";
import heroBg from "@/assets/hero-bg.png";

const TOTAL_STEPS = 4;
const emotions = ["Overwhelm", "Fear", "Doubt", "Distraction", "Burnout", "Other"];

export default function Apply() {
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  // Show cancelled message if redirected from Stripe
  useEffect(() => {
    if (searchParams.get("cancelled") === "true") {
      toast({ title: "Payment cancelled", description: "Your application was not submitted.", variant: "destructive" });
    }
  }, [searchParams, toast]);

  // Step 1 — Identity
  const [name, setName] = useState("");
  const [email, setEmail] = useState(user?.email ?? "");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("");
  const [stage, setStage] = useState("");

  // Step 2 — Execution Reality
  const [product, setProduct] = useState("");
  const [monthlyRevenue, setMonthlyRevenue] = useState("");
  const [hoursPerWeek, setHoursPerWeek] = useState("");
  const [teamStatus, setTeamStatus] = useState("");
  const [bottleneck, setBottleneck] = useState("");

  // Step 3 — Psychology
  const [failedProjects, setFailedProjects] = useState("");
  const [failureReason, setFailureReason] = useState("");
  const [peakProductivity, setPeakProductivity] = useState("");
  const [momentumLoss, setMomentumLoss] = useState("");
  const [disruptiveEmotion, setDisruptiveEmotion] = useState("");
  const [avoiding, setAvoiding] = useState("");

  // Step 4 — Commitment
  const [whyNow, setWhyNow] = useState("");
  const [consequence, setConsequence] = useState("");
  const [willingStructure, setWillingStructure] = useState<boolean | null>(null);
  const [willingReviews, setWillingReviews] = useState<boolean | null>(null);

  const canProceed = () => {
    switch (step) {
      case 1: return name.trim() && email.trim() && phone.trim() && role && stage;
      case 2: return product.trim().length >= 20 && bottleneck.trim().length >= 20;
      case 3: return failedProjects.trim() && failureReason.trim() && disruptiveEmotion && avoiding.trim();
      case 4: return whyNow.trim() && consequence.trim() && willingStructure !== null && willingReviews !== null;
      default: return false;
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      // Store form data in localStorage for retrieval after Stripe redirect
      const applicationData = {
        name, email, phone_number: phone, role, stage, product,
        monthly_revenue: monthlyRevenue || null,
        hours_per_week: hoursPerWeek || null,
        team_status: teamStatus || null,
        bottleneck, failed_projects: failedProjects, failure_reason: failureReason,
        peak_productivity: peakProductivity || null,
        momentum_loss: momentumLoss || null,
        disruptive_emotion: disruptiveEmotion,
        avoiding, why_now: whyNow || null, consequence,
        willing_structure: willingStructure,
        willing_reviews: willingReviews,
        user_id: user?.id ?? null,
      };
      localStorage.setItem("pfsw_application_data", JSON.stringify(applicationData));

      // Create Stripe checkout session
      const { data, error } = await supabase.functions.invoke("create-application-checkout", {
        body: {
          email,
          success_url: `${window.location.origin}/application-under-review?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${window.location.origin}/apply?cancelled=true`,
        },
      });
      if (error) throw error;
      if (data?.url) {
        track("apply_checkout_redirect", { role, stage });
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const next = () => { if (canProceed()) setStep((s) => Math.min(s + 1, TOTAL_STEPS)); };
  const prev = () => setStep((s) => Math.max(s - 1, 1));

  const stepLabels = ["Identity", "Execution", "Psychology", "Commitment"];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-16 min-h-screen flex">
        {/* Left — Form */}
        <div className="flex-1 flex flex-col justify-center px-6 py-20 overflow-y-auto">
          <div className="w-full max-w-lg mx-auto">
            {/* Progress bar */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-3">
                {stepLabels.map((label, i) => (
                  <div key={label} className="flex items-center gap-1.5">
                    <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                      i + 1 <= step ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    }`}>
                      {i + 1}
                    </span>
                    <span className={`text-xs tracking-wide hidden sm:inline ${
                      i + 1 <= step ? "text-foreground" : "text-muted-foreground"
                    }`}>
                      {label}
                    </span>
                  </div>
                ))}
              </div>
              <div className="h-1 rounded-full bg-muted overflow-hidden">
                <div className="h-full bg-primary transition-all duration-500" style={{ width: `${(step / TOTAL_STEPS) * 100}%` }} />
              </div>
            </div>

            {/* Step 1 — Identity */}
            {step === 1 && (
              <div className="space-y-5 animate-fade-in">
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-1">Who are you?</h2>
                  <p className="text-sm text-muted-foreground">Surface-level. We need to know who's applying.</p>
                </div>
                <Field label="Full Name" required>
                  <Input placeholder="Your full name" className="bg-card" value={name} onChange={(e) => setName(e.target.value)} />
                </Field>
                <Field label="Email" required>
                  <Input type="email" placeholder="you@example.com" className="bg-card" value={email} onChange={(e) => setEmail(e.target.value)} />
                </Field>
                <Field label="Phone Number" required hint="Required for SMS decisions.">
                  <Input type="tel" placeholder="+1 (555) 000-0000" className="bg-card" value={phone} onChange={(e) => setPhone(e.target.value)} />
                </Field>
                <Field label="What best describes you?" required>
                  <Select value={role} onValueChange={setRole}>
                    <SelectTrigger className="bg-card"><SelectValue placeholder="Select role" /></SelectTrigger>
                    <SelectContent>
                      {["Founder", "Operator", "Builder", "Creator", "Other"].map((r) => (
                        <SelectItem key={r} value={r.toLowerCase()}>{r}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="What stage are you in?" required>
                  <Select value={stage} onValueChange={setStage}>
                    <SelectTrigger className="bg-card"><SelectValue placeholder="Select stage" /></SelectTrigger>
                    <SelectContent>
                      {["Idea", "Pre-revenue", "Revenue", "Scaling"].map((s) => (
                        <SelectItem key={s} value={s.toLowerCase()}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>
            )}

            {/* Step 2 — Execution Reality */}
            {step === 2 && (
              <div className="space-y-5 animate-fade-in">
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-1">Your execution reality.</h2>
                  <p className="text-sm text-muted-foreground">Where are you right now? No sugarcoating.</p>
                </div>
                <Field label="What are you building?" required hint="Min 20 characters.">
                  <Textarea placeholder="Describe clearly." className="bg-card min-h-[100px]" value={product} onChange={(e) => setProduct(e.target.value)} />
                </Field>
                <Field label="Monthly revenue (if any)">
                  <Input placeholder="$0, $1K, $10K+" className="bg-card" value={monthlyRevenue} onChange={(e) => setMonthlyRevenue(e.target.value)} />
                </Field>
                <Field label="Hours per week actively building">
                  <Input placeholder="e.g. 20, 40, 60+" className="bg-card" value={hoursPerWeek} onChange={(e) => setHoursPerWeek(e.target.value)} />
                </Field>
                <Field label="Solo or team?">
                  <Select value={teamStatus} onValueChange={setTeamStatus}>
                    <SelectTrigger className="bg-card"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="solo">Solo</SelectItem>
                      <SelectItem value="small-team">Small team (2-5)</SelectItem>
                      <SelectItem value="team">Team (6+)</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Biggest current bottleneck" required hint="Min 20 characters.">
                  <Textarea placeholder="What's actually slowing you down?" className="bg-card min-h-[100px]" value={bottleneck} onChange={(e) => setBottleneck(e.target.value)} />
                </Field>
              </div>
            )}

            {/* Step 3 — Psychology */}
            {step === 3 && (
              <div className="space-y-5 animate-fade-in">
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-1">Go deeper.</h2>
                  <p className="text-sm text-muted-foreground">This is where we extract signal from noise.</p>
                </div>
                <Field label="What have you started but failed to finish in the past 12 months?" required>
                  <Textarea placeholder="Be specific." className="bg-card min-h-[80px]" value={failedProjects} onChange={(e) => setFailedProjects(e.target.value)} />
                </Field>
                <Field label="Why do you think you didn't follow through?" required>
                  <Textarea placeholder="Be honest." className="bg-card min-h-[80px]" value={failureReason} onChange={(e) => setFailureReason(e.target.value)} />
                </Field>
                <Field label="When do you feel most productive?">
                  <Input placeholder="e.g. Early morning, late night, after exercise..." className="bg-card" value={peakProductivity} onChange={(e) => setPeakProductivity(e.target.value)} />
                </Field>
                <Field label="When do you lose momentum?">
                  <Input placeholder="e.g. After meetings, on weekends..." className="bg-card" value={momentumLoss} onChange={(e) => setMomentumLoss(e.target.value)} />
                </Field>
                <Field label="What emotion most often disrupts your execution?" required>
                  <Select value={disruptiveEmotion} onValueChange={setDisruptiveEmotion}>
                    <SelectTrigger className="bg-card"><SelectValue placeholder="Select emotion" /></SelectTrigger>
                    <SelectContent>
                      {emotions.map((e) => (
                        <SelectItem key={e} value={e.toLowerCase()}>{e}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="What are you avoiding right now in your business?" required>
                  <Textarea placeholder="The thing you know you should be doing." className="bg-card min-h-[80px]" value={avoiding} onChange={(e) => setAvoiding(e.target.value)} />
                </Field>
              </div>
            )}

            {/* Step 4 — Commitment */}
            {step === 4 && (
              <div className="space-y-5 animate-fade-in">
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-1">Prove your commitment.</h2>
                  <p className="text-sm text-muted-foreground">Last step. No going back after this.</p>
                </div>
                <Field label="Why is now the moment you're applying?" required>
                  <Textarea placeholder="What changed?" className="bg-card min-h-[80px]" value={whyNow} onChange={(e) => setWhyNow(e.target.value)} />
                </Field>
                <Field label="What happens if you continue operating without systems?" required>
                  <Textarea placeholder="Paint the picture." className="bg-card min-h-[80px]" value={consequence} onChange={(e) => setConsequence(e.target.value)} />
                </Field>
                <Field label="Are you willing to follow structure even when it's uncomfortable?" required>
                  <div className="flex gap-3">
                    <Button type="button" variant={willingStructure === true ? "default" : "outline"} size="sm"
                      className={willingStructure === true ? "" : "border-border text-muted-foreground"}
                      onClick={() => setWillingStructure(true)}>Yes</Button>
                    <Button type="button" variant={willingStructure === false ? "default" : "outline"} size="sm"
                      className={willingStructure === false ? "bg-destructive text-destructive-foreground" : "border-border text-muted-foreground"}
                      onClick={() => setWillingStructure(false)}>No</Button>
                  </div>
                </Field>
                <Field label="If accepted, will you commit to weekly execution reviews?" required>
                  <div className="flex gap-3">
                    <Button type="button" variant={willingReviews === true ? "default" : "outline"} size="sm"
                      className={willingReviews === true ? "" : "border-border text-muted-foreground"}
                      onClick={() => setWillingReviews(true)}>Yes</Button>
                    <Button type="button" variant={willingReviews === false ? "default" : "outline"} size="sm"
                      className={willingReviews === false ? "bg-destructive text-destructive-foreground" : "border-border text-muted-foreground"}
                      onClick={() => setWillingReviews(false)}>No</Button>
                  </div>
                </Field>

                {/* Payment notice */}
                <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 mt-4">
                  <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-1">Application Fee</p>
                  <p className="text-sm text-muted-foreground">$5 one-time review fee. You'll be redirected to secure payment on submit.</p>
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between mt-8">
              {step > 1 ? (
                <Button variant="ghost" onClick={prev} className="text-muted-foreground">
                  <ChevronLeft className="h-4 w-4 mr-1" /> Back
                </Button>
              ) : <div />}

              {step < TOTAL_STEPS ? (
                <Button onClick={next} disabled={!canProceed()} className="tracking-wide font-bold">
                  Continue <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              ) : (
                <Button onClick={handleSubmit} disabled={!canProceed() || submitting} className="tracking-wide font-bold gold-glow-strong">
                  {submitting ? "Redirecting to payment..." : "Pay $5 & Submit"}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Right — Image with overlay */}
        <div className="hidden lg:block flex-1 relative">
          <img src={heroBg} alt="" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/70" />
          <div className="absolute inset-0 flex items-center justify-center p-12">
            <div className="text-center">
              <h2 className="text-4xl font-black tracking-tight text-foreground mb-4">
                People Fail.<br />
                <span className="text-primary gold-text-glow">Systems Work.</span>
              </h2>
              <p className="text-muted-foreground max-w-sm mx-auto">
                This is not a community. This is a controlled admission environment.
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function Field({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-sm font-medium text-foreground mb-2 block">
        {label}{required && <span className="text-primary ml-0.5">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
    </div>
  );
}
