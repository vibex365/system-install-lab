import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/** Scrape a website via Firecrawl and return a short summary + branding info */
async function enrichWithFirecrawl(website: string, firecrawlKey: string): Promise<string> {
  try {
    let url = website.trim();
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = `https://${url}`;
    }

    const res = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${firecrawlKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url,
        formats: ["summary", "markdown"],
        onlyMainContent: true,
      }),
    });

    if (!res.ok) {
      console.warn(`Firecrawl scrape failed for ${url}: ${res.status}`);
      return "";
    }

    const raw = await res.json();
    const d = raw.data || raw;
    const summary = d.summary || "";
    const markdown = (d.markdown || "").slice(0, 1500);
    return summary ? `Website summary: ${summary}\nContent preview: ${markdown}` : markdown ? `Content preview: ${markdown}` : "";
  } catch (e) {
    console.warn("Firecrawl enrichment error:", e);
    return "";
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { workflow_id, step_id, user_id, params, memory } = await req.json();

    if (!workflow_id || !step_id || !user_id) {
      throw new Error("Missing required fields: workflow_id, step_id, user_id");
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("AI not configured");

    const firecrawlKey = Deno.env.get("FIRECRAWL_API_KEY") || "";

    const serviceSupabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const minScore = params?.min_score ?? 60;
    const maxLeads = params?.max_leads ?? 50;
    const criteria = params?.criteria || "business readiness, contact info completeness, niche fit, website quality";

    const { data: leads, error: leadsErr } = await serviceSupabase
      .from("leads")
      .select("*")
      .eq("user_id", user_id)
      .in("pipeline_status", ["scraped", "new"])
      .order("created_at", { ascending: false })
      .limit(200);

    if (leadsErr) throw leadsErr;

    if (!leads || leads.length === 0) {
      await serviceSupabase.from("workflow_steps").update({
        status: "completed",
        output: { qualified: 0, message: "No unqualified leads found" },
        completed_at: new Date().toISOString(),
      }).eq("id", step_id);

      return new Response(JSON.stringify({
        success: true,
        data: { qualified: 0 },
        memory_update: { qualifier_results: { qualified: 0 } },
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- Firecrawl enrichment: scrape websites for leads that have one ---
    console.log(`Enriching ${leads.length} leads via Firecrawl...`);
    const enrichmentMap: Record<string, string> = {};

    if (firecrawlKey) {
      // Scrape up to 20 leads' websites in parallel (batched to avoid rate limits)
      const leadsWithWebsite = leads.filter((l) => l.website).slice(0, 20);
      const batchSize = 5;

      for (let i = 0; i < leadsWithWebsite.length; i += batchSize) {
        const batch = leadsWithWebsite.slice(i, i + batchSize);
        const results = await Promise.allSettled(
          batch.map((l) => enrichWithFirecrawl(l.website!, firecrawlKey))
        );
        results.forEach((r, idx) => {
          if (r.status === "fulfilled" && r.value) {
            enrichmentMap[batch[idx].id] = r.value;
          }
        });
      }
      console.log(`Enriched ${Object.keys(enrichmentMap).length} leads with website data`);
    } else {
      console.warn("FIRECRAWL_API_KEY not set — skipping website enrichment");
    }

    // Build lead summaries for AI scoring (now with website intel)
    const leadSummaries = leads.map((l, i) => {
      const base = `Lead ${i + 1} (ID: ${l.id}): ${l.business_name || "Unknown"} | Phone: ${l.phone || "none"} | Email: ${l.email || "none"} | Website: ${l.website || "none"} | Category: ${l.category || "unknown"} | City: ${l.city || "unknown"} | Source: ${l.source}`;
      const enrichment = enrichmentMap[l.id];
      return enrichment ? `${base}\n${enrichment}` : base;
    }).join("\n\n");

    // Use AI to score leads
    const scoreRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are a lead qualification AI for MLM/affiliate/coaching businesses. Score each lead 0-100 based on: ${criteria}.

Scoring rubric:
- Has phone AND email: +25 points
- Has phone OR email: +12 points  
- Has website: +10 points
- Website shows active business with services/products: +15 points
- Website has clear call-to-action or booking: +5 points
- Business name is specific (not generic): +8 points
- Has city/location data: +5 points
- Category matches niche: +10 points
- Source is "agent_scout" or "manual": +5 points

Return ONLY a JSON array: [{"id":"lead-uuid","score":85,"reason":"Has complete contact info, active website with coaching services","website_quality":"good"}]
Include ALL leads. No explanations outside JSON.`,
          },
          { role: "user", content: leadSummaries },
        ],
        temperature: 0.1,
        max_tokens: 8000,
      }),
    });

    if (!scoreRes.ok) {
      const errText = await scoreRes.text();
      console.error("AI scoring error:", scoreRes.status, errText);
      if (scoreRes.status === 429) throw new Error("Rate limited - please try again shortly");
      if (scoreRes.status === 402) throw new Error("AI credits depleted - please add credits");
      throw new Error(`AI scoring failed: ${scoreRes.status}`);
    }

    const scoreData = await scoreRes.json();
    const raw = scoreData.choices?.[0]?.message?.content || "[]";
    const match = raw.match(/\[[\s\S]*\]/);

    let scores: Array<{ id: string; score: number; reason: string; website_quality?: string }> = [];
    try {
      scores = JSON.parse(match ? match[0] : "[]");
    } catch {
      console.error("Failed to parse AI scores, using fallback scoring");
      scores = leads.map((l) => {
        let score = 0;
        if (l.phone && l.email) score += 25;
        else if (l.phone || l.email) score += 12;
        if (l.website) score += 10;
        if (enrichmentMap[l.id]) score += 15; // website had content
        if (l.business_name && l.business_name.length > 3) score += 8;
        if (l.city) score += 5;
        if (l.category) score += 10;
        score += 5;
        return { id: l.id, score, reason: "Heuristic scoring (AI parse failed)" };
      });
    }

    // Update leads with scores, pipeline status, and website quality
    let qualified = 0;
    for (const s of scores) {
      const newStatus = s.score >= minScore ? "qualified" : "unqualified";
      if (s.score >= minScore) qualified++;

      const updateData: Record<string, any> = {
        rating: s.score,
        pipeline_status: newStatus,
        notes: s.reason ? `AI Score: ${s.score}/100 — ${s.reason}` : `AI Score: ${s.score}/100`,
      };

      // Store website quality score if enriched
      if (s.website_quality && enrichmentMap[s.id]) {
        const wqMap: Record<string, number> = { excellent: 90, good: 70, average: 50, poor: 25, none: 0 };
        updateData.website_quality_score = wqMap[s.website_quality] ?? 50;
        if (enrichmentMap[s.id]) {
          updateData.audit_summary = enrichmentMap[s.id].slice(0, 500);
        }
      }

      await serviceSupabase.from("leads").update(updateData).eq("id", s.id).eq("user_id", user_id);
    }

    const qualifiedLeads = scores
      .filter((s) => s.score >= minScore)
      .sort((a, b) => b.score - a.score)
      .slice(0, maxLeads);

    const result = {
      total_scored: scores.length,
      qualified: qualifiedLeads.length,
      enriched_with_firecrawl: Object.keys(enrichmentMap).length,
      min_score: minScore,
      top_leads: qualifiedLeads.slice(0, 10).map((s) => ({
        id: s.id,
        score: s.score,
        reason: s.reason,
        website_quality: s.website_quality,
      })),
    };

    // Update the workflow step
    await serviceSupabase.from("workflow_steps").update({
      status: "completed",
      output: result,
      completed_at: new Date().toISOString(),
    }).eq("id", step_id);

    // Start next step if exists
    const { data: nextStep } = await serviceSupabase
      .from("workflow_steps")
      .select("id")
      .eq("workflow_id", workflow_id)
      .eq("status", "pending")
      .order("position", { ascending: true })
      .limit(1)
      .single();

    if (nextStep) {
      await serviceSupabase.from("workflow_steps").update({
        status: "running",
        started_at: new Date().toISOString(),
      }).eq("id", nextStep.id);
    } else {
      await serviceSupabase.from("workflows").update({
        status: "completed",
        updated_at: new Date().toISOString(),
      }).eq("id", workflow_id);
    }

    await serviceSupabase.from("workflows").update({
      memory: { ...memory, qualifier_results: result },
      updated_at: new Date().toISOString(),
    }).eq("id", workflow_id);

    return new Response(JSON.stringify({
      success: true,
      data: result,
      memory_update: { qualifier_results: result },
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Qualifier agent error:", err);
    return new Response(JSON.stringify({
      success: false,
      error: (err as Error).message,
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
