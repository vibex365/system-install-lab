import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { url, userId, stepId, workflowId, leadId } = await req.json();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    if (stepId) {
      await supabase.from("workflow_steps").update({ status: "running", started_at: new Date().toISOString() }).eq("id", stepId);
    }

    const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!FIRECRAWL_API_KEY) throw new Error("FIRECRAWL_API_KEY not configured");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // Step 1: Scrape the website
    let formattedUrl = url.trim();
    if (!formattedUrl.startsWith("http")) formattedUrl = `https://${formattedUrl}`;

    console.log("Scraping website:", formattedUrl);
    const scrapeRes = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: { Authorization: `Bearer ${FIRECRAWL_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ url: formattedUrl, formats: ["markdown", "html", "links"], onlyMainContent: false }),
    });

    const scrapeData = await scrapeRes.json();
    if (!scrapeRes.ok) throw new Error(`Firecrawl scrape failed: ${JSON.stringify(scrapeData)}`);

    const pageContent = scrapeData.data?.markdown || scrapeData.markdown || "";
    const pageHtml = scrapeData.data?.html || scrapeData.html || "";
    const links = scrapeData.data?.links || scrapeData.links || [];
    const metadata = scrapeData.data?.metadata || scrapeData.metadata || {};

    // Step 2: AI audit
    console.log("Running AI audit on scraped content");
    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are a senior web consultant. Analyze the website and produce a detailed audit report with scores (1-10) for each category:

1. **SEO Score** — Title tags, meta descriptions, headings, keyword usage, alt text
2. **Performance Indicators** — Page structure, image optimization hints, script/style overhead
3. **UX & Design** — Navigation, readability, mobile-friendliness indicators, CTA clarity
4. **Content Quality** — Messaging clarity, value proposition, trust signals
5. **Conversion Optimization** — CTAs, forms, social proof, urgency elements

For each category provide: Score (1-10), Key Issues, Quick Wins.
End with an Overall Score (average) and Top 3 Priority Actions.
Use markdown. Be specific and actionable.`,
          },
          {
            role: "user",
            content: `Website: ${formattedUrl}
Title: ${metadata.title || "N/A"}
Description: ${metadata.description || "N/A"}
Links found: ${links.length}

Page content (truncated):
${pageContent.slice(0, 6000)}`,
          },
        ],
      }),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      throw new Error(`AI gateway error [${aiRes.status}]: ${errText}`);
    }

    const aiData = await aiRes.json();
    const auditReport = aiData.choices?.[0]?.message?.content || "No audit generated.";

    const output = {
      audit_report: auditReport,
      url: formattedUrl,
      page_title: metadata.title || null,
      links_count: links.length,
    };

    // Update lead if linked
    if (leadId) {
      await supabase.from("leads").update({
        audit_summary: auditReport.slice(0, 2000),
        website: formattedUrl,
      }).eq("id", leadId);
    }

    if (stepId) {
      await supabase.from("workflow_steps").update({
        status: "done",
        completed_at: new Date().toISOString(),
        output,
      }).eq("id", stepId);
    }

    if (workflowId) {
      const orchestratorUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/orchestrator`;
      await fetch(orchestratorUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ workflowId, completedStepId: stepId }),
      }).catch((e) => console.error("Orchestrator chain error:", e));
    }

    return new Response(JSON.stringify({ success: true, data: output }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("agent-website-auditor error:", error);
    return new Response(JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
