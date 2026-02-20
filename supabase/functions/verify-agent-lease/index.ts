import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } }
  );

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const anonSupabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: authData, error: authError } = await anonSupabase.auth.getClaims(token);
    if (authError || !authData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const userId = authData.claims.sub;

    const { session_id, agent_id } = await req.json();
    if (!session_id || !agent_id) {
      return new Response(JSON.stringify({ error: "session_id and agent_id are required" }), { status: 400, headers: corsHeaders });
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, { apiVersion: "2025-08-27.basil" });

    // Retrieve Stripe session
    const session = await stripe.checkout.sessions.retrieve(session_id);
    if (session.payment_status !== "paid" && session.status !== "complete") {
      return new Response(JSON.stringify({ error: "Payment not completed" }), { status: 400, headers: corsHeaders });
    }

    // Check if lease already exists (idempotent)
    const { data: existing } = await supabase
      .from("agent_leases")
      .select("id")
      .eq("stripe_session_id", session_id)
      .maybeSingle();

    if (existing) {
      return new Response(JSON.stringify({ success: true, message: "Lease already recorded" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Create lease record — expires 30 days from now (managed via Stripe subscription in practice)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const { error: insertError } = await supabase
      .from("agent_leases")
      .insert({
        user_id: userId,
        agent_id,
        stripe_session_id: session_id,
        stripe_subscription_id: typeof session.subscription === "string" ? session.subscription : null,
        status: "active",
        leased_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString(),
      });

    if (insertError) {
      console.error("[verify-agent-lease] Insert error:", insertError);
      return new Response(JSON.stringify({ error: insertError.message }), { status: 500, headers: corsHeaders });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    console.error("[verify-agent-lease] Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
