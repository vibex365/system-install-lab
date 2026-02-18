import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    // Authenticate with worker secret
    const workerKey = req.headers.get("x-worker-key");
    const expectedKey = Deno.env.get("openclaw");
    if (!expectedKey || workerKey !== expectedKey) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const {
      job_id,
      standardized_prompt_text,
      summary,
      tags,
      complexity,
      steps, // array of { step, input_snippet, output_snippet, success }
    } = await req.json();

    if (!job_id) throw new Error("job_id required");

    // Get the job
    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .select("*")
      .eq("id", job_id)
      .single();

    if (jobError || !job) throw new Error("Job not found");

    // Log steps to job_runs
    if (steps && Array.isArray(steps)) {
      const runs = steps.map((s: any) => ({
        job_id,
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
      .eq("id", job_id);

    // Update the prompt_submission with packaged output
    const submissionId = (job.payload_json as any)?.submission_id;
    if (submissionId) {
      await supabase
        .from("prompt_submissions")
        .update({
          packaged_prompt: standardized_prompt_text || null,
          packaged_summary: summary || null,
          packaged_tags: tags || [],
          packaged_complexity: complexity || null,
        })
        .eq("id", submissionId);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("jobs-report error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
