import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * Twilio Voice Status Callback — tracks call status changes.
 * Set as Status Callback URL on your Twilio phone number for Voice.
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204 });
  }

  try {
    const formData = await req.formData();
    const callSid = formData.get("CallSid")?.toString() || "";
    const callStatus = formData.get("CallStatus")?.toString() || "";
    const from = formData.get("From")?.toString() || "";
    const to = formData.get("To")?.toString() || "";
    const duration = parseInt(formData.get("CallDuration")?.toString() || "0", 10);
    const direction = formData.get("Direction")?.toString() || "";

    console.log(`Voice Status: ${callStatus} | From: ${from} | To: ${to} | Duration: ${duration}s | SID: ${callSid} | Dir: ${direction}`);

    if (!callStatus) return new Response("OK", { status: 200 });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const statusMap: Record<string, string> = {
      initiated: "initiated",
      ringing: "ringing",
      "in-progress": "in-progress",
      completed: "completed",
      busy: "busy",
      "no-answer": "no-answer",
      failed: "failed",
      canceled: "canceled",
    };

    const mappedStatus = statusMap[callStatus] || callStatus;
    const phone = direction === "outbound-api" ? to : from;

    const { data: logs } = await supabase
      .from("call_logs")
      .select("id")
      .eq("phone_number", phone)
      .order("created_at", { ascending: false })
      .limit(1);

    if (logs?.[0]) {
      const updates: Record<string, any> = { status: mappedStatus };
      if (duration > 0) updates.call_duration_seconds = duration;
      await supabase.from("call_logs").update(updates).eq("id", logs[0].id);

      // Auto-trigger voice memo follow-up on completed calls
      if (mappedStatus === "completed" && duration > 15) {
        try {
          const fnUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/voice-memo-followup`;
          await fetch(fnUrl, {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ call_log_id: logs[0].id }),
          });
          console.log(`Voice memo follow-up triggered for call ${logs[0].id}`);
        } catch (vmErr) {
          console.error("Voice memo trigger failed:", vmErr);
        }
      }
    }

    return new Response("OK", { status: 200 });
  } catch (err) {
    console.error("twilio-voice-status error:", err);
    return new Response("OK", { status: 200 });
  }
});
