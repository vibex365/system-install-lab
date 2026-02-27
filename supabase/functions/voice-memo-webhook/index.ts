import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * Voice Memo Webhook: Serves TwiML for voice memo playback.
 * When Twilio connects the call, this returns <Say> with the personalized script.
 * Also handles status callbacks to update memo status.
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204 });
  }

  try {
    const url = new URL(req.url);
    const memoId = url.searchParams.get("memo_id");
    const event = url.searchParams.get("event");

    if (!memoId) {
      return new Response("<Response><Say>Sorry, something went wrong.</Say></Response>", {
        headers: { "Content-Type": "text/xml" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Handle status callback
    if (event === "status") {
      const formData = await req.formData();
      const callStatus = formData.get("CallStatus")?.toString() || "";
      const duration = parseInt(formData.get("CallDuration")?.toString() || "0", 10);

      const statusMap: Record<string, string> = {
        completed: "delivered",
        busy: "failed",
        "no-answer": "failed",
        failed: "failed",
        canceled: "failed",
      };

      const mappedStatus = statusMap[callStatus] || callStatus;
      await supabase.from("voice_memos").update({ status: mappedStatus }).eq("id", memoId);

      console.log(`Voice memo ${memoId} status: ${callStatus} -> ${mappedStatus}`);
      return new Response("OK", { status: 200 });
    }

    // Serve TwiML with the script
    const { data: memo } = await supabase
      .from("voice_memos")
      .select("script")
      .eq("id", memoId)
      .single();

    if (!memo?.script) {
      return new Response("<Response><Say>Sorry, something went wrong.</Say></Response>", {
        headers: { "Content-Type": "text/xml" },
      });
    }

    // Escape XML special characters in the script
    const safeScript = memo.script
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");

    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Pause length="1"/>
  <Say voice="Polly.Matthew" language="en-US">${safeScript}</Say>
  <Pause length="1"/>
  <Say voice="Polly.Matthew" language="en-US">Thanks for listening. Talk soon!</Say>
</Response>`;

    await supabase.from("voice_memos").update({ status: "playing" }).eq("id", memoId);

    return new Response(twiml, {
      headers: { "Content-Type": "text/xml" },
    });
  } catch (err) {
    console.error("voice-memo-webhook error:", err);
    return new Response("<Response><Say>Sorry, something went wrong.</Say></Response>", {
      headers: { "Content-Type": "text/xml" },
    });
  }
});
