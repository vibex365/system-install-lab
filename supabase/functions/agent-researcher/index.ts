import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { topic, depth, niche, userId, stepId, workflowId } = await req.json();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Mark step started
    if (stepId) {
      await supabase.from("workflow_steps").update({ status: "running", started_at: new Date().toISOString() }).eq("id", stepId);
    }

    const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!FIRECRAWL_API_KEY) throw new Error("FIRECRAWL_API_KEY not configured");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // Step 1: Search the web for the topic
    console.log("Searching web for:", topic);
    const searchRes = await fetch("https://api.firecrawl.dev/v1/search", {
      method: "POST",
      headers: { Authorization: `Bearer ${FIRECRAWL_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ query: topic, limit: depth === "deep" ? 10 : 5, scrapeOptions: { formats: ["markdown"] } }),
    });

    const searchData = await searchRes.json();
    if (!searchRes.ok) throw new Error(`Firecrawl search failed: ${JSON.stringify(searchData)}`);

    const sources = (searchData.data || []).map((r: any) => ({
      url: r.url,
      title: r.title || r.url,
      content: (r.markdown || r.description || "").slice(0, 2000),
    }));

    // Step 2: Synthesize with AI
    console.log("Synthesizing research from", sources.length, "sources");
    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are a senior research analyst. Produce a comprehensive research report from the provided web sources. Include:
1. Executive Summary (2-3 sentences)
2. Key Findings (bullet points with source citations)
3. Market/Competitive Landscape
4. Opportunities & Threats
5. Recommendations
${niche ? `Context: The user operates in the ${niche} niche.` : ""}
Use markdown formatting. Cite sources as [Source: URL].`,
          },
          {
            role: "user",
            content: `Research topic: "${topic}"\n\nSources:\n${sources.map((s: any, i: number) => `--- Source ${i + 1}: ${s.title} (${s.url}) ---\n${s.content}`).join("\n\n")}`,
          },
        ],
      }),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      throw new Error(`AI gateway error [${aiRes.status}]: ${errText}`);
    }

    const aiData = await aiRes.json();
    const report = aiData.choices?.[0]?.message?.content || "No report generated.";

    const output = {
      report,
      sources_count: sources.length,
      sources: sources.map((s: any) => ({ url: s.url, title: s.title })),
      topic,
    };

    // Mark step complete
    if (stepId) {
      await supabase.from("workflow_steps").update({
        status: "done",
        completed_at: new Date().toISOString(),
        output,
      }).eq("id", stepId);
    }

    // Chain next workflow step
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
    console.error("agent-researcher error:", error);
    return new Response(JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
