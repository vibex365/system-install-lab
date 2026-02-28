import { useState } from "react";
import { Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Code2, Copy, CheckCheck, Shield, Zap, AlertTriangle,
  ArrowRight, Globe, Server, Key, BarChart3, Cpu, BookOpen,
} from "lucide-react";

const ENDPOINTS = [
  { slug: "lead-prospector", method: "POST", desc: "Find leads by city and business category. Returns business name, phone, website, and quality score.", credits: "1 lead credit", params: '{\n  "city": "Atlanta, GA",\n  "category": "Dental practices"\n}', response: '{\n  "leads": [\n    {\n      "business_name": "Peachtree Dental",\n      "phone": "+14045551234",\n      "website": "https://example.com",\n      "rating": 4.5\n    }\n  ]\n}' },
  { slug: "site-audit", method: "POST", desc: "Run an AI-powered audit on any website. Returns grade, issues, and a summary.", credits: "1 lead credit", params: '{\n  "url": "https://example.com"\n}', response: '{\n  "grade": "C",\n  "issues": ["Missing SSL", "No mobile viewport"],\n  "summary": "Site needs critical updates..."\n}' },
  { slug: "cold-email-outreach", method: "POST", desc: "Generate a personalized cold email sequence based on business context.", credits: "1 SMS credit", params: '{\n  "business_name": "Peachtree Dental",\n  "url": "https://example.com",\n  "pain_points": "Outdated website, no mobile",\n  "niche": "Dental"\n}', response: '{\n  "subject": "Your website is costing you patients",\n  "body": "Hi Dr. Smith, I noticed...",\n  "followups": ["...","..."]\n}' },
  { slug: "sms-outreach", method: "POST", desc: "Send a personalized SMS to a lead with AI-generated copy.", credits: "1 SMS credit", params: '{\n  "lead_name": "Dr. Smith",\n  "phone": "+14045551234",\n  "pitch_context": "Website redesign for dental practices"\n}', response: '{\n  "status": "sent",\n  "message_sid": "SM...",\n  "body": "Hi Dr. Smith, quick question..."\n}' },
  { slug: "cold-call", method: "POST", desc: "Initiate an AI voice call to a lead. Returns call status and recording URL.", credits: "1 voice credit", params: '{\n  "lead_name": "Dr. Smith",\n  "phone": "+14045551234",\n  "pitch_context": "Website redesign for dental practices"\n}', response: '{\n  "status": "completed",\n  "duration_seconds": 142,\n  "summary": "Lead expressed interest...",\n  "recording_url": "https://..."\n}' },
  { slug: "forum-scout", method: "POST", desc: "Scout forums and communities for intent signals relevant to your niche.", credits: "2 lead credits", params: '{\n  "niche": "dental",\n  "keywords": "need website, redesign"\n}', response: '{\n  "matches": [\n    {\n      "url": "https://reddit.com/r/...",\n      "snippet": "Looking for someone to redesign...",\n      "suggested_reply": "Hi! I specialize in..."\n    }\n  ]\n}' },
];

export default function ApiDocs() {
  const [copied, setCopied] = useState<string | null>(null);
  const [expandedEndpoint, setExpandedEndpoint] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const baseUrl = "https://api.peoplefailsystemswork.com/v1";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="pt-28 pb-16 border-b border-border">
        <div className="container max-w-5xl mx-auto px-4">
          <div className="flex items-center gap-2 mb-4">
            <Badge variant="outline" className="text-[10px] tracking-wider uppercase border-primary/30 text-primary">
              <Cpu className="h-3 w-3 mr-1" /> REST API
            </Badge>
            <Badge variant="outline" className="text-[10px] tracking-wider uppercase">v1.0</Badge>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground tracking-tight mb-4">
            API Documentation
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl leading-relaxed mb-8">
            Integrate PFSW's autonomous AI agents into your platform. Prospect leads, audit websites, 
            send outreach, and close deals — all via simple REST calls.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg" className="tracking-wide gap-2">
              <Link to="/login">
                Get API Key <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="tracking-wide gap-2">
              <a href="#endpoints">
                <BookOpen className="h-4 w-4" /> View Endpoints
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* Quick Overview Cards */}
      <section className="py-16 border-b border-border">
        <div className="container max-w-5xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: Server, title: "Base URL", desc: baseUrl, detail: "All endpoints are accessed via this base URL with your API key." },
              { icon: Shield, title: "Authentication", desc: "Bearer Token", detail: "Pass your API key as a Bearer token in the Authorization header." },
              { icon: BarChart3, title: "Rate Limit", desc: "60 req/min", detail: "Per API key. Credits are consumed per call based on endpoint type." },
            ].map((item) => (
              <Card key={item.title} className="bg-card border-border">
                <CardContent className="p-6">
                  <div className="p-2.5 rounded-lg bg-primary/10 border border-primary/20 w-fit mb-4">
                    <item.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground mb-1">{item.title}</h3>
                  <p className="text-sm font-mono text-primary mb-2">{item.desc}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{item.detail}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Authentication Section */}
      <section className="py-16 border-b border-border">
        <div className="container max-w-5xl mx-auto px-4">
          <div className="flex items-center gap-2 mb-6">
            <Key className="h-5 w-5 text-primary" />
            <h2 className="text-2xl font-bold text-foreground">Authentication</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground leading-relaxed">
                All API requests must include your API key in the <code className="font-mono text-foreground bg-muted/50 px-1.5 py-0.5 rounded text-xs">Authorization</code> header as a Bearer token.
              </p>
              <div className="space-y-3">
                {[
                  "Create an account and subscribe to a plan",
                  "Navigate to the API Portal from your dashboard",
                  "Generate a new API key — it's shown only once",
                  "Include the key in all API requests",
                ].map((step, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-[10px] font-bold text-primary">{i + 1}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{step}</p>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="bg-muted/30 border border-border rounded-lg p-5 relative">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-3 font-semibold">Example Request Header</p>
                <pre className="text-xs font-mono text-foreground leading-relaxed">{`Authorization: Bearer oc_live_abc123...
Content-Type: application/json`}</pre>
                <Button
                  size="sm" variant="ghost"
                  className="absolute top-3 right-3 h-7 text-xs"
                  onClick={() => handleCopy('Authorization: Bearer oc_live_YOUR_KEY\nContent-Type: application/json', 'auth-header')}
                >
                  {copied === 'auth-header' ? <CheckCheck className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                </Button>
              </div>
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 mt-4 flex items-start gap-2.5">
                <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-300/90 leading-relaxed">
                  API keys are displayed only once when created. Store them securely. If lost, revoke the old key and generate a new one.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Endpoints */}
      <section id="endpoints" className="py-16 border-b border-border">
        <div className="container max-w-5xl mx-auto px-4">
          <div className="flex items-center gap-2 mb-2">
            <Globe className="h-5 w-5 text-primary" />
            <h2 className="text-2xl font-bold text-foreground">Endpoints</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-8">All endpoints accept POST requests and return JSON responses.</p>

          <div className="space-y-4">
            {ENDPOINTS.map((ep) => (
              <Card key={ep.slug} className="bg-card border-border overflow-hidden">
                <button
                  className="w-full text-left"
                  onClick={() => setExpandedEndpoint(expandedEndpoint === ep.slug ? null : ep.slug)}
                >
                  <CardContent className="p-5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="text-[10px] h-5 font-mono bg-primary/10 text-primary border-primary/30 shrink-0">
                        {ep.method}
                      </Badge>
                      <code className="text-sm text-foreground font-mono">/v1/{ep.slug}</code>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="text-[10px] h-5 hidden sm:inline-flex">{ep.credits}</Badge>
                      <ArrowRight className={`h-4 w-4 text-muted-foreground transition-transform ${expandedEndpoint === ep.slug ? 'rotate-90' : ''}`} />
                    </div>
                  </CardContent>
                </button>

                {expandedEndpoint === ep.slug && (
                  <div className="border-t border-border px-5 pb-5 space-y-4">
                    <p className="text-sm text-muted-foreground pt-4">{ep.desc}</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">Request Body</p>
                        <div className="bg-muted/30 border border-border rounded-md p-4 relative">
                          <pre className="text-[11px] font-mono text-foreground whitespace-pre">{ep.params}</pre>
                          <Button size="sm" variant="ghost" className="absolute top-2 right-2 h-6 w-6 p-0" onClick={(e) => { e.stopPropagation(); handleCopy(ep.params, `req-${ep.slug}`); }}>
                            {copied === `req-${ep.slug}` ? <CheckCheck className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                          </Button>
                        </div>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">Response</p>
                        <div className="bg-muted/30 border border-border rounded-md p-4 relative">
                          <pre className="text-[11px] font-mono text-foreground whitespace-pre">{ep.response}</pre>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Code Examples */}
      <section className="py-16 border-b border-border">
        <div className="container max-w-5xl mx-auto px-4">
          <div className="flex items-center gap-2 mb-6">
            <Code2 className="h-5 w-5 text-primary" />
            <h2 className="text-2xl font-bold text-foreground">Quick Start</h2>
          </div>

          <Tabs defaultValue="curl" className="space-y-4">
            <TabsList>
              <TabsTrigger value="curl" className="text-xs">cURL</TabsTrigger>
              <TabsTrigger value="js" className="text-xs">JavaScript</TabsTrigger>
              <TabsTrigger value="python" className="text-xs">Python</TabsTrigger>
            </TabsList>

            {[
              { key: "curl", code: `curl -X POST "${baseUrl}/lead-prospector" \\
  -H "Authorization: Bearer oc_live_YOUR_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"city": "Atlanta, GA", "category": "Dental practices"}'` },
              { key: "js", code: `const response = await fetch("${baseUrl}/lead-prospector", {
  method: "POST",
  headers: {
    "Authorization": "Bearer oc_live_YOUR_KEY",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    city: "Atlanta, GA",
    category: "Dental practices",
  }),
});

const data = await response.json();
console.log(data);` },
              { key: "python", code: `import requests

response = requests.post(
    "${baseUrl}/lead-prospector",
    headers={
        "Authorization": "Bearer oc_live_YOUR_KEY",
        "Content-Type": "application/json",
    },
    json={
        "city": "Atlanta, GA",
        "category": "Dental practices",
    },
)

print(response.json())` },
            ].map((ex) => (
              <TabsContent key={ex.key} value={ex.key}>
                <div className="bg-muted/30 border border-border rounded-lg p-5 relative">
                  <pre className="text-xs font-mono text-foreground whitespace-pre leading-relaxed overflow-x-auto">{ex.code}</pre>
                  <Button
                    size="sm" variant="ghost"
                    className="absolute top-3 right-3 h-7 text-xs gap-1"
                    onClick={() => handleCopy(ex.code, `example-${ex.key}`)}
                  >
                    {copied === `example-${ex.key}` ? <CheckCheck className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                    {copied === `example-${ex.key}` ? "Copied" : "Copy"}
                  </Button>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container max-w-5xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-foreground mb-4">Ready to integrate?</h2>
          <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
            Create your account, grab an API key, and start making calls in minutes. Credits start at $29 for 100 leads.
          </p>
          <div className="flex justify-center gap-4">
            <Button asChild size="lg" className="tracking-wide gap-2">
              <Link to="/login">Get Started <ArrowRight className="h-4 w-4" /></Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="tracking-wide">
              <Link to="/contact">Talk to Us</Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
