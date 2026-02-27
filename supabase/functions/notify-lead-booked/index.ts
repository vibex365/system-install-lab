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
    const { lead_id, lead_name, user_id, scheduled_at } = await req.json();

    if (!lead_name || !user_id) {
      return new Response(
        JSON.stringify({ error: "lead_name and user_id are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const serviceSupabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get user profile email
    const { data: profile } = await serviceSupabase
      .from("profiles")
      .select("email, full_name")
      .eq("id", user_id)
      .single();

    if (!profile?.email) {
      return new Response(
        JSON.stringify({ error: "User profile not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      console.error("[notify-lead-booked] RESEND_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const greeting = profile.full_name ? `Hi ${profile.full_name}` : "Hi there";
    const scheduleLine = scheduled_at
      ? `\n\nScheduled for: ${new Date(scheduled_at).toLocaleString("en-US", { dateStyle: "full", timeStyle: "short" })}`
      : "";

    const emailBody = `${greeting},\n\nGreat news — "${lead_name}" has been moved to the booked stage in your PFSW pipeline!${scheduleLine}\n\nLog in to your dashboard to review the details and prepare for your call.\n\nBest,\nThe PFSW Team\nPeople Fail. Systems Work.`;

    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "PFSW Alerts <noreply@peoplefailsystemswork.com>",
        to: [profile.email],
        subject: `🎯 Lead Booked: ${lead_name}`,
        text: emailBody,
      }),
    });

    const resendData = await resendRes.json();

    if (!resendRes.ok) {
      console.error("[notify-lead-booked] Resend error:", resendData);
      return new Response(
        JSON.stringify({ error: "Email send failed", details: resendData }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Also create an in-app notification
    await serviceSupabase.from("user_notifications").insert({
      user_id,
      title: `Lead Booked: ${lead_name}`,
      body: `"${lead_name}" has been moved to the booked stage.${scheduled_at ? ` Call scheduled for ${new Date(scheduled_at).toLocaleDateString()}.` : ""}`,
      type: "lead_booked",
    });

    return new Response(
      JSON.stringify({ success: true, id: resendData.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("[notify-lead-booked] Error:", err.message);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
