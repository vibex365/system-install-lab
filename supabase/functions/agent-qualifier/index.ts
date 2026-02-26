import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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

    const serviceSupabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch unqualified leads for this user
    const minScore = params?.min_score ?? 60;
    const maxLeads = params?.max_leads ?? 50;
    const criteria = params?.criteria || "business readiness, contact info completeness, niche fit";

    const { data: leads, error: leadsErr } = await serviceSupabase
      .from("leads")
      .select("*")
      .eq("user_id", user_id)
      .in("pipeline_status", ["scraped", "new"])
      .order("created_at", { ascending: false })
      .limit(200);

    if (leadsErr) throw leadsErr;

    if (!leads || leads.length === 0) {
      // No leads to qualify
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

    // Build lead summaries for AI scoring
    const leadSummaries = leads.map((l, i) => 
      `Lead ${i + 1} (ID: ${l.id}): ${l.business_name || "Unknown"} | Phone: ${l.phone || "none"} | Email: ${l.email || "none"} | Website: ${l.website || "none"} | Category: ${l.category || "unknown"} | City: ${l.city || "unknown"} | Source: ${l.source}`
    ).join("\n");

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
- Has phone AND email: +30 points
- Has phone OR email: +15 points  
- Has website: +15 points
- Business name is specific (not generic): +10 points
- Has city/location data: +10 points
- Category matches niche: +15 points
- Source is "agent_scout" or "manual": +5 points

Return ONLY a JSON array: [{"id":"lead-uuid","score":85,"reason":"Has complete contact info and relevant business"}]
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
      
      if (scoreRes.status === 429) {
        throw new Error("Rate limited - please try again shortly");
      }
      if (scoreRes.status === 402) {
        throw new Error("AI credits depleted - please add credits");
      }
      throw new Error(`AI scoring failed: ${scoreRes.status}`);
    }

    const scoreData = await scoreRes.json();
    const raw = scoreData.choices?.[0]?.message?.content || "[]";
    const match = raw.match(/\[[\s\S]*\]/);
    
    let scores: Array<{ id: string; score: number; reason: string }> = [];
    try {
      scores = JSON.parse(match ? match[0] : "[]");
    } catch {
      console.error("Failed to parse AI scores, using fallback scoring");
      // Fallback: simple heuristic scoring
      scores = leads.map((l) => {
        let score = 0;
        if (l.phone && l.email) score += 30;
        else if (l.phone || l.email) score += 15;
        if (l.website) score += 15;
        if (l.business_name && l.business_name.length > 3) score += 10;
        if (l.city) score += 10;
        if (l.category) score += 15;
        score += 5; // base
        return { id: l.id, score, reason: "Heuristic scoring" };
      });
    }

    // Update leads with scores and pipeline status
    let qualified = 0;
    for (const s of scores) {
      const newStatus = s.score >= minScore ? "qualified" : "unqualified";
      if (s.score >= minScore) qualified++;

      await serviceSupabase.from("leads").update({
        rating: s.score,
        pipeline_status: newStatus,
        notes: s.reason ? `AI Score: ${s.score}/100 — ${s.reason}` : `AI Score: ${s.score}/100`,
      }).eq("id", s.id).eq("user_id", user_id);
    }

    // Cap qualified leads if needed
    const qualifiedLeads = scores
      .filter((s) => s.score >= minScore)
      .sort((a, b) => b.score - a.score)
      .slice(0, maxLeads);

    const result = {
      total_scored: scores.length,
      qualified: qualifiedLeads.length,
      min_score: minScore,
      top_leads: qualifiedLeads.slice(0, 10).map((s) => ({
        id: s.id,
        score: s.score,
        reason: s.reason,
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
      // No more steps — complete workflow
      await serviceSupabase.from("workflows").update({
        status: "completed",
        updated_at: new Date().toISOString(),
      }).eq("id", workflow_id);
    }

    // Update workflow memory
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
      error: (err as Error).message 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
