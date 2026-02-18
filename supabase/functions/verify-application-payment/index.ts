import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
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
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("Stripe not configured");

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    const { session_id, application_data } = await req.json();

    if (!session_id || !application_data) {
      return new Response(JSON.stringify({ error: "session_id and application_data required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify the checkout session is paid
    const session = await stripe.checkout.sessions.retrieve(session_id);

    if (session.payment_status !== "paid") {
      return new Response(JSON.stringify({ error: "Payment not completed", status: session.payment_status }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Insert the application using service role (bypasses RLS)
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Check if application already exists for this session (idempotency)
    const { data: existing } = await supabaseAdmin
      .from("applications")
      .select("id")
      .eq("stripe_session_id", session_id)
      .limit(1);

    if (existing && existing.length > 0) {
      return new Response(JSON.stringify({ success: true, already_exists: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { error } = await supabaseAdmin.from("applications").insert({
      name: application_data.name,
      email: application_data.email,
      phone_number: application_data.phone_number || null,
      role: application_data.role,
      stage: application_data.stage,
      product: application_data.product,
      bottleneck: application_data.bottleneck,
      monthly_revenue: application_data.monthly_revenue || null,
      hours_per_week: application_data.hours_per_week || null,
      team_status: application_data.team_status || null,
      failed_projects: application_data.failed_projects || null,
      failure_reason: application_data.failure_reason || null,
      peak_productivity: application_data.peak_productivity || null,
      momentum_loss: application_data.momentum_loss || null,
      disruptive_emotion: application_data.disruptive_emotion || null,
      avoiding: application_data.avoiding || null,
      why_now: application_data.why_now || null,
      consequence: application_data.consequence || null,
      willing_structure: application_data.willing_structure,
      willing_reviews: application_data.willing_reviews,
      user_id: application_data.user_id || null,
      payment_status: "paid",
      stripe_session_id: session_id,
      status: "submitted",
    });

    if (error) {
      console.error("Error inserting application:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Verify payment error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
