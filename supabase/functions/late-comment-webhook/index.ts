import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
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
    const body = await req.json();
    console.log("Late.dev webhook payload:", JSON.stringify(body));

    // Handle test webhooks
    if (body.event === "webhook.test") {
      console.log("Test webhook received — OK");
      return new Response(JSON.stringify({ ok: true, test: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Late.dev webhook payload — adapt field names based on actual webhook shape
    const commentText = body.comment_text || body.text || body.message || body.content || "";
    const commenterName = body.commenter_name || body.author || body.user || body.username || "Unknown";
    const platform = body.platform || body.network || "";
    const latePostId = body.post_id || body.late_post_id || "";
    const lateCommentId = body.comment_id || body.id || "";
    const commentUrl = body.comment_url || body.url || body.permalink || "";

    if (!commentText) {
      return new Response(JSON.stringify({ ok: true, skipped: "no comment text" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Find matching social_post by late_post_id
    let socialPost: any = null;
    if (latePostId) {
      const { data } = await supabase
        .from("social_posts")
        .select("id, content, keyword, user_id")
        .eq("late_post_id", latePostId)
        .single();
      socialPost = data;
    }

    // Match against the universal CTA keyword: "SEND ME THE LINK"
    const TRIGGER_PHRASE = "send me the link";
    const commentLower = commentText.toLowerCase().replace(/['']/g, "'");
    const matchedKeywords: string[] = commentLower.includes(TRIGGER_PHRASE) ? [TRIGGER_PHRASE] : [];

    // Log the comment
    await supabase.from("social_comments").insert({
      late_comment_id: lateCommentId,
      late_post_id: latePostId,
      social_post_id: socialPost?.id || null,
      platform,
      commenter_name: commenterName,
      comment_text: commentText,
      comment_url: commentUrl,
      matched_keywords: matchedKeywords,
      sms_sent: false,
    });

    // ── Send SMS for EVERY comment ──
    const twilioSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const twilioToken = Deno.env.get("TWILIO_AUTH_TOKEN");
    const fromNumber = Deno.env.get("TWILIO_PHONE_NUMBER");
    const adminPhone = Deno.env.get("ADMIN_PHONE_NUMBER") || null;

    if (twilioSid && twilioToken && fromNumber && adminPhone) {
      const platformLabel = platform || "social media";
      const linkStr = commentUrl ? `\nReply: ${commentUrl}` : "";
      const keywordTag = matchedKeywords.length > 0 ? `\n🔑 KEYWORD MATCH: ${matchedKeywords.join(", ")}` : "";
      
      const smsBody = `💬 ${commenterName} on ${platformLabel}:\n"${commentText.slice(0, 120)}"${keywordTag}${linkStr}`;

      const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`;
      const twilioAuth = btoa(`${twilioSid}:${twilioToken}`);

      const smsRes = await fetch(twilioUrl, {
        method: "POST",
        headers: {
          Authorization: `Basic ${twilioAuth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          To: adminPhone,
          From: fromNumber,
          Body: smsBody,
        }),
      });

      const smsData = await smsRes.json();
      console.log("SMS result:", JSON.stringify(smsData));

      if (smsRes.ok) {
        // Mark as sms_sent
        await supabase
          .from("social_comments")
          .update({ sms_sent: true })
          .eq("late_comment_id", lateCommentId);
      }
    } else {
      console.warn("Missing Twilio config or admin phone for SMS alert");
    }

    return new Response(JSON.stringify({ ok: true, matched: matchedKeywords }), {
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