import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * Twilio SMS Status Callback — tracks delivery status of outbound messages.
 * Set this URL in Twilio Console → Phone Number → Status Callback URL
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: { "Content-Type": "text/xml" } });
  }

  try {
    const formData = await req.formData();
    const messageSid = formData.get("MessageSid")?.toString() || "";
    const messageStatus = formData.get("MessageStatus")?.toString() || "";
    const to = formData.get("To")?.toString() || "";
    const errorCode = formData.get("ErrorCode")?.toString() || null;

    console.log(`SMS Status: ${messageStatus} | To: ${to} | SID: ${messageSid} | Error: ${errorCode}`);

    if (!messageStatus) {
      return new Response("OK", { status: 200 });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Map Twilio status to our delivery_status
    const statusMap: Record<string, string> = {
      queued: "queued",
      sent: "sent",
      delivered: "delivered",
      undelivered: "failed",
      failed: "failed",
      read: "read",
    };

    const mappedStatus = statusMap[messageStatus] || messageStatus;

    // Update the most recent outreach_log entry matching this phone number
    const { data: logs } = await supabase
      .from("outreach_log")
      .select("id")
      .eq("channel", "sms")
      .eq("recipient_phone", to)
      .order("created_at", { ascending: false })
      .limit(1);

    if (logs?.[0]) {
      await supabase.from("outreach_log").update({
        delivery_status: mappedStatus,
      }).eq("id", logs[0].id);
    }

    return new Response("OK", { status: 200 });
  } catch (err) {
    console.error("twilio-status-webhook error:", err);
    return new Response("OK", { status: 200 });
  }
});
