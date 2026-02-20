import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const AI_GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-2.5-flash";

async function callAI(system: string, message: string): Promise<string> {
  const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!lovableApiKey) throw new Error("LOVABLE_API_KEY not set");

  const res = await fetch(AI_GATEWAY, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${lovableApiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: system },
        { role: "user", content: message },
      ],
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`AI call failed (${res.status}): ${text}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || "";
}

async function processJob(job: any) {
  const payload = job.payload_json || {};
  const submissionId = payload.submission_id;
  const rawPrompt = payload.raw_prompt || "";
  const title = payload.title || "";
  const problem = payload.problem || "";
  const scope = payload.scope || "";
  const integrations = payload.integrations || [];

  console.log(`Processing submission ${submissionId}: "${title}"`);

  const steps: any[] = [];

  // ── Step 1: Standardize ─────────────────────────────────────────────
  let standardizedPrompt = rawPrompt;
  try {
    const standardizeSystem = `You are a prompt engineer specializing in Lovable.dev build prompts.
Your job is to take a raw user-submitted prompt and rewrite it into a clean, well-structured,
production-ready prompt that follows best practices.

Rules:
- Keep the user's intent and requirements intact
- Organize into clear sections: Objective, Stack, Routes, Schema, UI/UX, Integrations, Admin Panel, Acceptance Criteria
- Remove redundancy, fix grammar, clarify vague instructions
- Add missing but obvious requirements (e.g. responsive design, error handling)
- Use imperative voice ("Create...", "Implement...", "Add...")
- If the prompt describes a SaaS, marketplace, platform, or any multi-user product, MUST include an "Admin Panel" section with:
  • A /admin route with a sidebar shell layout
  • Dashboard overview with key metrics (users, revenue, activity)
  • User/customer management (list, search, view details, suspend/activate)
  • Content or entity management relevant to the product domain
  • Settings page for system configuration
  • Role-based access control (admin vs regular user)
  • If payments/subscriptions exist: payments table, refund actions, subscription management
- Even if the user didn't mention an admin panel, add it for any SaaS/platform prompt
- Output ONLY the rewritten prompt, no commentary`;

    const standardizeInput = `Title: ${title}
Problem: ${problem}
Scope: ${scope}
Integrations: ${(integrations as string[]).join(", ") || "None specified"}

Raw Prompt:
${rawPrompt}`;

    standardizedPrompt = await callAI(standardizeSystem, standardizeInput);
    steps.push({
      step: "standardize",
      input_snippet: rawPrompt.slice(0, 200),
      output_snippet: standardizedPrompt.slice(0, 200),
      success: true,
    });
    console.log("✅ Standardized");
  } catch (err: any) {
    console.error(`⚠️  Standardize failed: ${err.message}`);
    steps.push({
      step: "standardize",
      input_snippet: rawPrompt.slice(0, 200),
      output_snippet: `Error: ${err.message}`,
      success: false,
    });
  }

  // ── Step 2: Classify ────────────────────────────────────────────────
  let summary = `Submission: ${title}`;
  let tags = ["unprocessed"];
  let complexity = "medium";

  try {
    const classifySystem = `You are a prompt classifier. Given a build prompt, output a JSON object with:
- "summary": A 1-2 sentence summary of what the prompt builds (max 150 chars)
- "tags": An array of 2-5 lowercase tags describing the tech/domain (e.g. ["auth","stripe","dashboard","crud"])
- "complexity": One of "simple", "medium", "complex", "advanced"

Output ONLY valid JSON, no markdown fences, no commentary.`;

    const classifyResult = await callAI(classifySystem, standardizedPrompt);

    const jsonMatch = classifyResult.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      summary = parsed.summary || summary;
      tags = Array.isArray(parsed.tags) ? parsed.tags : tags;
      complexity = parsed.complexity || complexity;
    }

    steps.push({
      step: "classify",
      input_snippet: standardizedPrompt.slice(0, 200),
      output_snippet: JSON.stringify({ summary, tags, complexity }),
      success: true,
    });
    console.log(`✅ Classified: [${tags.join(", ")}] — ${complexity}`);
  } catch (err: any) {
    console.error(`⚠️  Classify failed: ${err.message}`);
    steps.push({
      step: "classify",
      input_snippet: standardizedPrompt.slice(0, 200),
      output_snippet: `Error: ${err.message}`,
      success: false,
    });
  }

  return {
    job_id: job.id,
    submission_id: submissionId,
    standardized_prompt_text: standardizedPrompt,
    summary,
    tags,
    complexity,
    steps,
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Claim next queued job
    const { data: jobs } = await supabase
      .from("jobs")
      .select("*")
      .eq("status", "queued")
      .order("created_at", { ascending: true })
      .limit(1);

    if (!jobs || jobs.length === 0) {
      return new Response(JSON.stringify({ message: "No jobs in queue" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const job = jobs[0];

    // Mark as processing (optimistic lock)
    const { error: lockError } = await supabase
      .from("jobs")
      .update({ status: "processing" })
      .eq("id", job.id)
      .eq("status", "queued");

    if (lockError) {
      return new Response(JSON.stringify({ message: "Job already claimed" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`⚙️  Claimed job ${job.id} (type: ${job.type})`);

    // Process the job
    const result = await processJob(job);

    // Log steps to job_runs
    if (result.steps.length > 0) {
      const runs = result.steps.map((s: any) => ({
        job_id: job.id,
        step: s.step,
        input_snippet: s.input_snippet || null,
        output_snippet: s.output_snippet || null,
        success: s.success !== false,
      }));
      await supabase.from("job_runs").insert(runs);
    }

    // Mark job completed
    await supabase
      .from("jobs")
      .update({ status: "completed" })
      .eq("id", job.id);

    // Update the prompt_submission with packaged output
    if (result.submission_id) {
      await supabase
        .from("prompt_submissions")
        .update({
          packaged_prompt: result.standardized_prompt_text || null,
          packaged_summary: result.summary || null,
          packaged_tags: result.tags || [],
          packaged_complexity: result.complexity || null,
          status: "packaged",
        })
        .eq("id", result.submission_id);
    }

    console.log(`✅ Completed job ${job.id}`);

    return new Response(JSON.stringify({ success: true, job_id: job.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("process-jobs error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
