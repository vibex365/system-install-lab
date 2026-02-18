import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

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

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = await req.text();
    
    // Parse the event (in production, verify webhook signature)
    const event = JSON.parse(body) as Stripe.Event;

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const metadata = session.metadata || {};
      const type = metadata.type;

      if (type === "application") {
        // Application payment — insert the application record
        const { error } = await supabaseAdmin.from("applications").insert({
          name: metadata.name,
          email: metadata.email,
          phone_number: metadata.phone_number || null,
          role: metadata.role,
          stage: metadata.stage,
          product: metadata.product,
          bottleneck: metadata.bottleneck,
          monthly_revenue: metadata.monthly_revenue || null,
          hours_per_week: metadata.hours_per_week || null,
          team_status: metadata.team_status || null,
          failed_projects: metadata.failed_projects || null,
          failure_reason: metadata.failure_reason || null,
          peak_productivity: metadata.peak_productivity || null,
          momentum_loss: metadata.momentum_loss || null,
          disruptive_emotion: metadata.disruptive_emotion || null,
          avoiding: metadata.avoiding || null,
          why_now: metadata.why_now || null,
          consequence: metadata.consequence || null,
          willing_structure: metadata.willing_structure === "true" ? true : metadata.willing_structure === "false" ? false : null,
          willing_reviews: metadata.willing_reviews === "true" ? true : metadata.willing_reviews === "false" ? false : null,
          user_id: metadata.user_id || null,
          payment_status: "paid",
          stripe_session_id: session.id,
          status: "submitted",
        });

        if (error) {
          console.error("Error inserting application:", error);
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        console.log("Application created for:", metadata.email);
      } else if (type === "membership") {
        // Membership payment — activate the user
        const userId = metadata.user_id;
        if (!userId) {
          console.error("No user_id in membership metadata");
          return new Response(JSON.stringify({ error: "No user_id" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Read system_meta to determine tier
        const { data: systemMeta } = await supabaseAdmin
          .from("system_meta")
          .select("version")
          .limit(1)
          .single();

        const isV1 = systemMeta?.version === "v1";

        const { error } = await supabaseAdmin.from("profiles").update({
          member_status: "active",
          member_tier: isV1 ? "founding" : "standard",
          invite_multiplier: isV1 ? 1.5 : 1.0,
        }).eq("id", userId);

        if (error) {
          console.error("Error activating membership:", error);
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        console.log("Membership activated for user:", userId, "tier:", isV1 ? "founding" : "standard");
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Webhook error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
