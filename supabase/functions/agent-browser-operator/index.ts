import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { instruction, urls, maxPages, extractSchema, userId, stepId, workflowId } = await req.json();

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    if (stepId) {
      await supabase.from("workflow_steps").update({ status: "running", started_at: new Date().toISOString() }).eq("id", stepId);
    }

    const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!FIRECRAWL_API_KEY) throw new Error("FIRECRAWL_API_KEY not configured");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const targetUrls: string[] = urls || [];
    const limit = maxPages || 5;

    // Step 1: If no URLs given, use AI to determine what to search/scrape
    if (targetUrls.length === 0) {
      console.log("Browser operator: planning navigation for:", instruction);
      const planRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role: "system",
              content: `You are a browser automation planner. Given a task, determine the best search query to find relevant pages. Return ONLY a JSON object: {"search_query": "...", "expected_data": "brief description of what to extract"}`,
            },
            { role: "user", content: instruction },
          ],
          temperature: 0.2,
        }),
      });
      const planData = await planRes.json();
      const planRaw = planData.choices?.[0]?.message?.content || "";
      const planMatch = planRaw.match(/\{[\s\S]*\}/);

      let searchQuery = instruction;
      if (planMatch) {
        try {
          const parsed = JSON.parse(planMatch[0]);
          searchQuery = parsed.search_query || instruction;
        } catch { /* use instruction as fallback */ }
      }

      // Search for relevant pages
      const searchRes = await fetch("https://api.firecrawl.dev/v1/search", {
        method: "POST",
        headers: { Authorization: `Bearer ${FIRECRAWL_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ query: searchQuery, limit, scrapeOptions: { formats: ["markdown"] } }),
      });
      const searchData = await searchRes.json();
      if (searchData.data) {
        for (const r of searchData.data) {
          if (r.url) targetUrls.push(r.url);
        }
      }
    }

    // Step 2: Scrape each URL
    console.log("Browser operator: scraping", targetUrls.length, "pages");
    const pageResults: any[] = [];

    for (const pageUrl of targetUrls.slice(0, limit)) {
      try {
        let formatted = pageUrl.trim();
        if (!formatted.startsWith("http")) formatted = `https://${formatted}`;

        const scrapeRes = await fetch("https://api.firecrawl.dev/v1/scrape", {
          method: "POST",
          headers: { Authorization: `Bearer ${FIRECRAWL_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({ url: formatted, formats: ["markdown", "links"], onlyMainContent: true }),
        });
        const scrapeData = await scrapeRes.json();
        const content = scrapeData.data?.markdown || scrapeData.markdown || "";
        const meta = scrapeData.data?.metadata || scrapeData.metadata || {};

        pageResults.push({
          url: formatted,
          title: meta.title || formatted,
          content: content.slice(0, 3000),
          links_count: (scrapeData.data?.links || []).length,
        });
      } catch (e) {
        console.error("Failed to scrape", pageUrl, e);
        pageResults.push({ url: pageUrl, title: pageUrl, content: "Failed to scrape", error: true });
      }
    }

    // Step 3: AI synthesizes results based on instruction
    console.log("Browser operator: synthesizing", pageResults.length, "pages");
    const synthesisRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are an autonomous browser operator that has just visited ${pageResults.length} web pages. Analyze the scraped content and complete the user's task.

Your response should include:
1. **Task Summary** — What was accomplished
2. **Extracted Data** — Structured findings from the pages (use tables where appropriate)
3. **Key Insights** — Patterns or notable findings
4. **Sources** — List of pages visited with relevance notes

${extractSchema ? `Extract data matching this schema: ${JSON.stringify(extractSchema)}` : ""}

Use markdown. Be thorough and structured.`,
          },
          {
            role: "user",
            content: `Task: ${instruction}\n\nPages visited:\n${pageResults.map((p, i) => `--- Page ${i + 1}: ${p.title} (${p.url}) ---\n${p.content}`).join("\n\n")}`,
          },
        ],
      }),
    });

    if (!synthesisRes.ok) {
      const errText = await synthesisRes.text();
      throw new Error(`AI gateway error [${synthesisRes.status}]: ${errText}`);
    }

    const synthesisData = await synthesisRes.json();
    const report = synthesisData.choices?.[0]?.message?.content || "No results.";

    const output = {
      report,
      pages_visited: pageResults.length,
      sources: pageResults.map((p) => ({ url: p.url, title: p.title })),
      instruction,
    };

    if (stepId) {
      await supabase.from("workflow_steps").update({ status: "done", completed_at: new Date().toISOString(), output }).eq("id", stepId);
    }

    if (workflowId) {
      await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/orchestrator`, {
        method: "POST",
        headers: { Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`, "Content-Type": "application/json" },
        body: JSON.stringify({ workflowId, completedStepId: stepId }),
      }).catch((e) => console.error("Chain error:", e));
    }

    return new Response(JSON.stringify({ success: true, data: output }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("agent-browser-operator error:", error);
    return new Response(JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
