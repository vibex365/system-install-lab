import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { track } from "@/lib/analytics";
import { CheckCircle, ArrowRight } from "lucide-react";

const applySchema = z.object({
  name: z.string().trim().min(1, "Required"),
  email: z.string().trim().email("Invalid email"),
  role: z.enum(["founder", "operator", "creator", "other"], { required_error: "Select a role" }),
  stage: z.enum(["idea", "pre-revenue", "revenue", "scaling"], { required_error: "Select a stage" }),
  product: z.string().trim().min(20, "At least 20 characters"),
  bottleneck: z.string().trim().min(20, "At least 20 characters"),
  whyNow: z.string().trim().optional(),
});

type ApplyValues = z.infer<typeof applySchema>;

const nextSteps = [
  "We review your application within 48 hours.",
  "If accepted, you get access + onboarding.",
  "Week 1 installs cadence + system map.",
];

export default function Apply() {
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<ApplyValues>({
    resolver: zodResolver(applySchema),
    defaultValues: {
      name: "",
      email: user?.email ?? "",
      product: "",
      bottleneck: "",
      whyNow: "",
    },
  });

  const onSubmit = async (data: ApplyValues) => {
    setSubmitting(true);
    try {
      const { error } = await supabase.from("applications").insert({
        name: data.name,
        email: data.email,
        role: data.role,
        stage: data.stage,
        product: data.product,
        bottleneck: data.bottleneck,
        why_now: data.whyNow || null,
        user_id: user?.id ?? null,
      });
      if (error) throw error;
      track("apply_submitted", { role: data.role, stage: data.stage });
      toast({ title: "Application submitted", description: "If it's a fit, you'll hear back." });
      setSubmitted(true);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-32 pb-20">
          <div className="container max-w-md mx-auto text-center">
            <div className="rounded-2xl border border-primary/30 bg-card p-10">
              <CheckCircle className="h-10 w-10 text-primary mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-foreground mb-2">Application received.</h2>
              <p className="text-sm text-muted-foreground mb-2">We review every application within 48 hours.</p>
              <p className="text-sm text-muted-foreground mb-6">If accepted, you'll get access and onboarding instructions.</p>
              <div className="flex flex-col gap-3">
                <Button asChild variant="outline" className="border-primary/30 text-foreground hover:bg-primary/10">
                  <Link to="/">Back to Home</Link>
                </Button>
                <Button asChild variant="ghost" size="sm">
                  <Link to="/waitlist">Join the waitlist too <ArrowRight className="ml-1 h-3 w-3" /></Link>
                </Button>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-28 pb-20">
        <div className="container max-w-5xl">
          <div className="grid lg:grid-cols-5 gap-12 lg:gap-16">
            {/* Left column */}
            <div className="lg:col-span-2 space-y-8">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-3">
                  Apply to Join PFSW
                </h1>
                <p className="text-muted-foreground leading-relaxed">
                  This is an execution room. If you want leverage, apply.
                </p>
              </div>
              <div className="space-y-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-primary">What happens next</p>
                {nextSteps.map((step, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                      {i + 1}
                    </span>
                    <p className="text-sm text-muted-foreground">{step}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right column — form */}
            <div className="lg:col-span-3">
              <div className="rounded-2xl border border-border bg-card p-6 md:p-8">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                    <FormField control={form.control} name="name" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl><Input placeholder="Your full name" className="bg-background" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="email" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl><Input type="email" placeholder="you@example.com" className="bg-background" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <div className="grid sm:grid-cols-2 gap-5">
                      <FormField control={form.control} name="role" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Role</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger className="bg-background"><SelectValue placeholder="Select role" /></SelectTrigger></FormControl>
                            <SelectContent>
                              <SelectItem value="founder">Founder</SelectItem>
                              <SelectItem value="operator">Operator</SelectItem>
                              <SelectItem value="creator">Creator</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="stage" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Stage</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger className="bg-background"><SelectValue placeholder="Select stage" /></SelectTrigger></FormControl>
                            <SelectContent>
                              <SelectItem value="idea">Idea</SelectItem>
                              <SelectItem value="pre-revenue">Pre-revenue</SelectItem>
                              <SelectItem value="revenue">Revenue</SelectItem>
                              <SelectItem value="scaling">Scaling</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>
                    <FormField control={form.control} name="product" render={({ field }) => (
                      <FormItem>
                        <FormLabel>What are you building?</FormLabel>
                        <FormControl><Textarea placeholder="Describe your project or business." className="bg-background min-h-[100px]" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="bottleneck" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Biggest execution bottleneck?</FormLabel>
                        <FormControl><Textarea placeholder="What's slowing you down the most?" className="bg-background min-h-[100px]" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="whyNow" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Why now? <span className="text-muted-foreground font-normal">(optional)</span></FormLabel>
                        <FormControl><Textarea placeholder="What's making this urgent?" className="bg-background" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <Button type="submit" size="lg" className="w-full tracking-wide font-bold" disabled={submitting}>
                      {submitting ? "Submitting..." : "Submit Application"}
                    </Button>
                  </form>
                </Form>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
