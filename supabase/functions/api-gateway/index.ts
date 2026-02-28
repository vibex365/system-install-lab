import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Credit cost map per agent slug
const CREDIT_COSTS: Record<string, { type: string; amount: number }> = {
  "lead-prospector": { type: "leads", amount: 1 },
  "site-audit": { type: "leads", amount: 1 },
  "cold-email-outreach": { type: "sms", amount: 1 },
  "email-drip": { type: "sms", amount: 1 },
  "sms-outreach": { type: "sms", amount: 1 },
  "cold-call": { type: "voice_calls", amount: 1 },
  "forum-scout": { type: "leads", amount: 2 },
  "website-proposal": { type: "leads", amount: 1 },
  "social-media": { type: "leads", amount: 1 },
  "competitor-intel": { type: "leads", amount: 1 },
  "prompt-packager": { type: "leads", amount: 1 },
  "weekly-recap": { type: "leads", amount: 1 },
  "video-content": { type: "leads", amount: 1 },
  "media-buyer": { type: "leads", amount: 5 },
};

async function hashKey(key: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(key);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  const url = new URL(req.url);
  const agentSlug = url.searchParams.get("agent");

  if (!agentSlug) {
    return new Response(
      JSON.stringify({ error: "Missing ?agent= parameter" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Extract API key
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer oc_live_")) {
    return new Response(
      JSON.stringify({ error: "Invalid API key. Expected Bearer oc_live_xxx" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const apiKey = authHeader.replace("Bearer ", "");
  const keyHash = await hashKey(apiKey);

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Look up the API key
  const { data: keyRow, error: keyError } = await supabaseAdmin
    .from("api_keys")
    .select("*")
    .eq("key_hash", keyHash)
    .eq("is_active", true)
    .is("revoked_at", null)
    .single();

  if (keyError || !keyRow) {
    return new Response(
      JSON.stringify({ error: "Invalid or revoked API key" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const userId = keyRow.user_id;

  // Rate limiting: 60 requests/minute per key
  const oneMinuteAgo = new Date(Date.now() - 60_000).toISOString();
  const { count: recentCalls } = await supabaseAdmin
    .from("api_usage_log")
    .select("id", { count: "exact", head: true })
    .eq("api_key_id", keyRow.id)
    .gte("created_at", oneMinuteAgo);

  if ((recentCalls || 0) >= 60) {
    return new Response(
      JSON.stringify({ error: "Rate limit exceeded. Max 60 requests/minute." }),
      { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Find the agent
  const { data: agent } = await supabaseAdmin
    .from("agents")
    .select("*")
    .eq("slug", agentSlug)
    .eq("status", "active")
    .single();

  if (!agent) {
    return new Response(
      JSON.stringify({ error: `Agent '${agentSlug}' not found or inactive` }),
      { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Check credits
  const creditConfig = CREDIT_COSTS[agentSlug] || { type: "leads", amount: 1 };
  const { data: credits } = await supabaseAdmin
    .from("credit_purchases")
    .select("*")
    .eq("user_id", userId)
    .eq("resource_type", creditConfig.type)
    .gt("credits_remaining", 0)
    .order("purchased_at", { ascending: true });

  const totalCredits = (credits || []).reduce((sum, c) => sum + c.credits_remaining, 0);
  if (totalCredits < creditConfig.amount) {
    return new Response(
      JSON.stringify({
        error: "Insufficient credits",
        required: creditConfig.amount,
        available: totalCredits,
        resource_type: creditConfig.type,
        buy_credits_url: "/upgrade",
      }),
      { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Deduct credits FIFO
  let remaining = creditConfig.amount;
  for (const credit of credits || []) {
    if (remaining <= 0) break;
    const deduct = Math.min(remaining, credit.credits_remaining);
    await supabaseAdmin
      .from("credit_purchases")
      .update({ credits_remaining: credit.credits_remaining - deduct })
      .eq("id", credit.id);
    remaining -= deduct;
  }

  // Find or create a lease for API usage
  let { data: lease } = await supabaseAdmin
    .from("agent_leases")
    .select("id")
    .eq("user_id", userId)
    .eq("agent_id", agent.id)
    .eq("status", "active")
    .single();

  if (!lease) {
    const { data: newLease } = await supabaseAdmin
      .from("agent_leases")
      .insert({
        user_id: userId,
        agent_id: agent.id,
        status: "active",
        leased_at: new Date().toISOString(),
      })
      .select("id")
      .single();
    lease = newLease;
  }

  if (!lease) {
    return new Response(
      JSON.stringify({ error: "Failed to create agent lease" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Parse request body
  let input = {};
  try {
    if (req.method === "POST") {
      input = await req.json();
    }
  } catch {
    // No body is fine for some agents
  }

  // Run the agent via the existing run-agent function
  let agentResult: any = null;
  let statusCode = 200;

  try {
    const runResponse = await fetch(
      `${Deno.env.get("SUPABASE_URL")}/functions/v1/run-agent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
        },
        body: JSON.stringify({
          agent_id: agent.id,
          lease_id: lease.id,
          input,
          user_id: userId,
        }),
      }
    );

    agentResult = await runResponse.json();
    if (!runResponse.ok) statusCode = runResponse.status;
  } catch (e: any) {
    statusCode = 500;
    agentResult = { error: e.message };
  }

  const responseTimeMs = Date.now() - startTime;

  // Log usage
  await supabaseAdmin.from("api_usage_log").insert({
    api_key_id: keyRow.id,
    user_id: userId,
    endpoint: `/v1/agents/${agentSlug}`,
    method: req.method,
    credits_consumed: creditConfig.amount,
    status_code: statusCode,
    response_time_ms: responseTimeMs,
  });

  // Update last_used_at
  await supabaseAdmin
    .from("api_keys")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", keyRow.id);

  return new Response(
    JSON.stringify({
      success: statusCode < 400,
      agent: agentSlug,
      credits_consumed: creditConfig.amount,
      response_time_ms: responseTimeMs,
      data: agentResult,
    }),
    {
      status: statusCode,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }
  );
});
