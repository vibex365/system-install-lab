import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Handshake, DollarSign, Megaphone, BarChart3, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

const BENEFITS = [
  { icon: DollarSign, title: "20% Commission", desc: "Earn on every referral that converts to a paid member" },
  { icon: Megaphone, title: "Marketing Assets", desc: "Ready-made funnels, landing pages, and swipe copy" },
  { icon: BarChart3, title: "Live Dashboard", desc: "Track clicks, conversions, and payouts in real time" },
];

export default function PartnerApply() {
  const { toast } = useToast();
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    business_name: "",
    social_url: "",
    audience_size: "",
    niche: "",
    why_partner: "",
  });

  const update = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) {
      toast({ title: "Missing fields", description: "Name and email are required.", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.from("partner_applications").insert({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || null,
        business_name: form.business_name.trim() || null,
        social_url: form.social_url.trim() || null,
        audience_size: form.audience_size || null,
        niche: form.niche.trim() || null,
        why_partner: form.why_partner.trim() || null,
      });
      if (error) throw error;
      setSubmitted(true);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-20">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 mb-4">
            <Handshake className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">Partner Program</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
            Earn While You Refer
          </h1>
          <p className="text-muted-foreground text-lg max-w-lg mx-auto">
            Join our partner program and earn commissions on every referral. Get branded funnels, marketing assets, and a real-time affiliate dashboard.
          </p>
        </motion.div>

        {/* Benefits */}
        <div className="grid md:grid-cols-3 gap-4 mb-12">
          {BENEFITS.map((b, i) => (
            <motion.div
              key={b.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="bg-card border-border h-full">
                <CardContent className="p-5">
                  <b.icon className="h-5 w-5 text-primary mb-3" />
                  <h3 className="text-sm font-semibold text-foreground mb-1">{b.title}</h3>
                  <p className="text-xs text-muted-foreground">{b.desc}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Form or Success */}
        {submitted ? (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
            <Card className="border-primary/30 bg-card max-w-lg mx-auto">
              <CardContent className="text-center py-12">
                <CheckCircle2 className="h-12 w-12 text-primary mx-auto mb-4" />
                <h2 className="text-xl font-bold text-foreground mb-2">Application Submitted!</h2>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                  We'll review your application and get back to you within 24-48 hours via email and SMS.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <Card className="bg-card border-border max-w-lg mx-auto">
            <CardHeader>
              <CardTitle className="text-lg">Apply to Partner Program</CardTitle>
              <CardDescription>Fill out the form below and we'll review your application.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Full Name *</Label>
                    <Input value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="John Doe" className="h-9 text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Email *</Label>
                    <Input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} placeholder="you@email.com" className="h-9 text-sm" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Phone</Label>
                    <Input value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="+1 555 000 0000" className="h-9 text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Business Name</Label>
                    <Input value={form.business_name} onChange={(e) => update("business_name", e.target.value)} placeholder="Your Company" className="h-9 text-sm" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Social Media / Website URL</Label>
                  <Input value={form.social_url} onChange={(e) => update("social_url", e.target.value)} placeholder="https://instagram.com/yourprofile" className="h-9 text-sm" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Audience Size</Label>
                    <Select value={form.audience_size} onValueChange={(v) => update("audience_size", v)}>
                      <SelectTrigger className="h-9 text-sm">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="< 1K">Under 1K</SelectItem>
                        <SelectItem value="1K-10K">1K – 10K</SelectItem>
                        <SelectItem value="10K-50K">10K – 50K</SelectItem>
                        <SelectItem value="50K-100K">50K – 100K</SelectItem>
                        <SelectItem value="100K+">100K+</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Niche</Label>
                    <Input value={form.niche} onChange={(e) => update("niche", e.target.value)} placeholder="e.g. Real Estate, Fitness" className="h-9 text-sm" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Why do you want to partner with us?</Label>
                  <Textarea value={form.why_partner} onChange={(e) => update("why_partner", e.target.value)} placeholder="Tell us about your audience and how you'd promote PFSW..." className="text-sm min-h-[80px]" />
                </div>
                <Button type="submit" className="w-full" disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Handshake className="h-4 w-4 mr-2" />}
                  Submit Application
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </main>
      <Footer />
    </div>
  );
}
