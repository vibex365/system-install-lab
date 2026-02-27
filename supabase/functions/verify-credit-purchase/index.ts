import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Maps pack_key to resource_type and credit amount
const PACK_MAP: Record<string, { resource: string; credits: number }> = {
  leads_50: { resource: "leads", credits: 50 },
  leads_200: { resource: "leads", credits: 200 },
  sms_100: { resource: "sms", credits: 100 },
  sms_500: { resource: "sms", credits: 500 },
  voice_10: { resource: "voice_calls", credits: 10 },
  voice_50: { resource: "voice_calls", credits: 50 },
  workflows_5: { resource: "workflows", credits: 5 },
  workflows_20: { resource: "workflows", credits: 20 },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    // Auth
    const supabaseAnon = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: userData } = await supabaseAnon.auth.getUser(token);
    const user = userData.user;
    if (!user) throw new Error("Not authenticated");

    const { session_id, pack_key } = await req.json();
    if (!session_id || !pack_key) throw new Error("Missing session_id or pack_key");

    const packInfo = PACK_MAP[pack_key];
    if (!packInfo) throw new Error("Invalid pack_key");

    // Check if already redeemed
    const { data: existing } = await supabase
      .from("credit_purchases")
      .select("id")
      .eq("stripe_session_id", session_id)
      .limit(1);

    if (existing && existing.length > 0) {
      return new Response(JSON.stringify({ success: true, already_redeemed: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify payment with Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });
    const session = await stripe.checkout.sessions.retrieve(session_id);
    if (session.payment_status !== "paid") {
      throw new Error("Payment not completed");
    }

    // Insert credit purchase
    const { error: insertErr } = await supabase.from("credit_purchases").insert({
      user_id: user.id,
      resource_type: packInfo.resource,
      credits_total: packInfo.credits,
      credits_remaining: packInfo.credits,
      stripe_session_id: session_id,
    });
    if (insertErr) throw new Error(insertErr.message);

    return new Response(
      JSON.stringify({ success: true, resource: packInfo.resource, credits: packInfo.credits }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
