import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";

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

    const body = await req.json();
    const {
      name, email, phone_number, role, stage, product, monthly_revenue,
      hours_per_week, team_status, bottleneck, failed_projects, failure_reason,
      peak_productivity, momentum_loss, disruptive_emotion, avoiding,
      why_now, consequence, willing_structure, willing_reviews, user_id,
      success_url, cancel_url,
    } = body;

    if (!name || !email || !role || !stage || !product || !bottleneck) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Store form data in metadata (Stripe limits metadata values to 500 chars)
    const metadata: Record<string, string> = {
      type: "application",
      name,
      email,
      phone_number: phone_number || "",
      role,
      stage,
      product: product.substring(0, 500),
      bottleneck: bottleneck.substring(0, 500),
      monthly_revenue: monthly_revenue || "",
      hours_per_week: hours_per_week || "",
      team_status: team_status || "",
      failed_projects: (failed_projects || "").substring(0, 500),
      failure_reason: (failure_reason || "").substring(0, 500),
      peak_productivity: peak_productivity || "",
      momentum_loss: momentum_loss || "",
      disruptive_emotion: disruptive_emotion || "",
      avoiding: (avoiding || "").substring(0, 500),
      why_now: (why_now || "").substring(0, 500),
      consequence: (consequence || "").substring(0, 500),
      willing_structure: String(willing_structure ?? ""),
      willing_reviews: String(willing_reviews ?? ""),
      user_id: user_id || "",
    };

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price: "price_1T2C2OAsrgxssNTVFCy1eAgi",
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: success_url || `${req.headers.get("origin")}/application-under-review`,
      cancel_url: cancel_url || `${req.headers.get("origin")}/apply?cancelled=true`,
      customer_email: email,
      metadata,
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error creating checkout:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
