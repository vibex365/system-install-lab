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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: userData } = await supabase.auth.getUser(token);
    const user = userData.user;
    if (!user) throw new Error("Not authenticated");

    const { goal } = await req.json();
    if (!goal) throw new Error("Goal is required");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("AI not configured");

    // Step 1: Use AI to decompose the goal into agent steps
    const planRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are a workflow planner for an AI agent platform that helps MLM marketers, affiliate promoters, coaches, and home-business operators.

Available agents:
- scout: Discover leads by niche and location (params: niche, location, count)
- qualifier: AI-score leads for fit (params: min_score, max_leads)
- outreach_email: Send personalized email sequences (params: template)
- outreach_sms: Send SMS follow-ups (params: template, delay)
- booker: AI voice call to book meetings (params: script, hot_leads_only)
- funnel_builder: Generate a quiz funnel (params: niche, goal)
- competitor_intel: Research competitors (params: niche, location)

Given a user's goal, return a JSON array of steps. Each step has: agent (string), params (object).
Return ONLY valid JSON array, no explanation.`,
          },
          { role: "user", content: goal },
        ],
        temperature: 0.3,
        max_tokens: 1000,
      }),
    });

    const planData = await planRes.json();
    const raw = planData.choices?.[0]?.message?.content || "[]";
    const match = raw.match(/\[[\s\S]*\]/);
    let plan: Array<{ agent: string; params: Record<string, any> }> = [];

    try {
      plan = JSON.parse(match ? match[0] : "[]");
    } catch {
      // Fallback: simple scout + qualifier plan
      plan = [
        { agent: "scout", params: { niche: "general", location: "USA", count: 50 } },
        { agent: "qualifier", params: { min_score: 60, max_leads: 25 } },
      ];
    }

    if (plan.length === 0) {
      plan = [{ agent: "scout", params: { niche: "general", location: "USA", count: 50 } }];
    }

    // Step 2: Create workflow
    const { data: workflow, error: wfError } = await supabase
      .from("workflows")
      .insert({
        user_id: user.id,
        goal,
        status: "running",
        plan,
      })
      .select()
      .single();

    if (wfError) throw wfError;

    // Step 3: Create workflow steps
    const stepsToInsert = plan.map((step, i) => ({
      workflow_id: workflow.id,
      agent_id: step.agent,
      input: step.params,
      status: i === 0 ? "running" : "pending",
      position: i,
      started_at: i === 0 ? new Date().toISOString() : null,
    }));

    const { error: stepsError } = await supabase.from("workflow_steps").insert(stepsToInsert);
    if (stepsError) throw stepsError;

    // Step 4: Execute first step (scout) inline for immediate feedback
    const firstStep = plan[0];
    if (firstStep.agent === "scout") {
      try {
        // Use the existing firecrawl-search for scouting
        const serviceSupabase = createClient(
          Deno.env.get("SUPABASE_URL")!,
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
        );

        const searchQuery = `${firstStep.params.niche || "business"} ${firstStep.params.location || ""} contact phone email`;
        
        const firecrawlKey = Deno.env.get("FIRECRAWL_API_KEY");
        let scoutResult: any = { leads_found: 0, message: "Firecrawl not configured" };

        if (firecrawlKey) {
          const searchRes = await fetch("https://api.firecrawl.dev/v1/search", {
            method: "POST",
            headers: { Authorization: `Bearer ${firecrawlKey}`, "Content-Type": "application/json" },
            body: JSON.stringify({ query: searchQuery, limit: firstStep.params.count || 20 }),
          });
          const searchData = await searchRes.json();
          
          // AI extraction of contacts
          const results = searchData.data || [];
          if (results.length > 0) {
            const combined = results.map((r: any, i: number) => {
              const md = (r.markdown || "").slice(0, 2000);
              return `--- RESULT ${i + 1} ---\nURL: ${r.url || ""}\nTitle: ${r.title || ""}\n\n${md}`;
            }).join("\n\n");

            const extractRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
              method: "POST",
              headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
              body: JSON.stringify({
                model: "google/gemini-2.5-flash",
                messages: [
                  { role: "system", content: `Extract business contact info. Return JSON: {"businesses":[{"company_name":"...","phone":"...","email":"...","website":"...","address":"..."}]}. Only include real businesses with real contact details. Return empty array if none found.` },
                  { role: "user", content: combined },
                ],
                temperature: 0.1,
                max_tokens: 4000,
              }),
            });
            const extractData = await extractRes.json();
            const extractRaw = extractData.choices?.[0]?.message?.content || "";
            const extractMatch = extractRaw.match(/\{[\s\S]*\}/);
            if (extractMatch) {
              const parsed = JSON.parse(extractMatch[0]);
              const businesses = (parsed.businesses || []).filter((b: any) => b.company_name && (b.phone || b.email));

              // Save leads to the user's CRM
              for (const biz of businesses) {
                await serviceSupabase.from("leads").insert({
                  user_id: user.id,
                  business_name: biz.company_name,
                  phone: biz.phone || null,
                  email: biz.email || null,
                  website: biz.website || null,
                  address: biz.address || null,
                  source: "agent_scout",
                  pipeline_status: "scraped",
                }).catch(() => {});
              }

              scoutResult = { leads_found: businesses.length, businesses };
            }
          }
        }

        // Update step 1 as completed
        const { data: step1 } = await supabase
          .from("workflow_steps")
          .select("id")
          .eq("workflow_id", workflow.id)
          .eq("position", 0)
          .single();

        if (step1) {
          await serviceSupabase.from("workflow_steps").update({
            status: "completed",
            output: scoutResult,
            completed_at: new Date().toISOString(),
          }).eq("id", step1.id);
        }

        // Update workflow memory
        await serviceSupabase.from("workflows").update({
          memory: { scout_results: scoutResult },
        }).eq("id", workflow.id);

      } catch (scoutErr) {
        console.error("Scout step failed:", scoutErr);
      }
    }

    return new Response(JSON.stringify({ workflow_id: workflow.id, steps: plan.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Orchestrator error:", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
