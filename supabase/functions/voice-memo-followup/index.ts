import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * Voice Memo Follow-up: Auto-triggered after every completed booker call.
 * 1. Takes the call summary and generates a personalized voice memo script via AI.
 * 2. Initiates a Twilio outbound call that plays the script using TTS (<Say>).
 * 3. Logs the memo in voice_memos table.
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { call_log_id } = await req.json();
    if (!call_log_id) throw new Error("call_log_id is required");

    // Fetch the call log
    const { data: callLog, error: clErr } = await supabase
      .from("call_logs")
      .select("*")
      .eq("id", call_log_id)
      .single();

    if (clErr || !callLog) throw new Error("Call log not found");
    if (!callLog.call_summary) throw new Error("No call summary available");
    if (!callLog.phone_number) throw new Error("No phone number on call log");

    // Check if voice memo already sent for this call
    const { data: existing } = await supabase
      .from("voice_memos")
      .select("id")
      .eq("call_log_id", call_log_id)
      .limit(1);

    if (existing && existing.length > 0) {
      return new Response(
        JSON.stringify({ skipped: true, reason: "Voice memo already sent for this call" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get lead name from context or lead record
    let leadName = "there";
    if (callLog.lead_id) {
      const { data: lead } = await supabase
        .from("leads")
        .select("contact_name, business_name")
        .eq("id", callLog.lead_id)
        .single();
      if (lead) {
        leadName = lead.contact_name || lead.business_name || leadName;
      }
    } else if (callLog.context?.name) {
      leadName = callLog.context.name;
    }

    const firstName = leadName.split(" ")[0];

    // Generate personalized voice memo script using Lovable AI
    const aiResponse = await fetch("https://api.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You write short, warm, personalized voice memo scripts (30-45 seconds when read aloud). 
The memo should:
- Address the person by first name
- Reference 1-2 specific things from the call summary (pain points, goals, or interests)
- Express genuine interest in helping them
- End with a soft call-to-action (looking forward to next steps, etc.)
- Sound natural and conversational, NOT salesy
- Be 60-90 words maximum
- Do NOT include any stage directions, emojis, or non-spoken text
- Write ONLY the words to be spoken aloud`,
          },
          {
            role: "user",
            content: `Generate a voice memo script for ${firstName} based on this call summary:\n\n${callLog.call_summary}`,
          },
        ],
        temperature: 0.7,
        max_tokens: 200,
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      throw new Error(`AI script generation failed: ${errText}`);
    }

    const aiData = await aiResponse.json();
    const script = aiData.choices?.[0]?.message?.content?.trim();
    if (!script) throw new Error("AI returned empty script");

    // Create voice memo record
    const { data: memo, error: memoErr } = await supabase
      .from("voice_memos")
      .insert({
        user_id: callLog.user_id,
        lead_id: callLog.lead_id,
        call_log_id: call_log_id,
        phone_number: callLog.phone_number,
        script,
        status: "sending",
      })
      .select()
      .single();

    if (memoErr) throw new Error(`Failed to create voice memo: ${memoErr.message}`);

    // Initiate Twilio call with TTS
    const twilioSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const twilioToken = Deno.env.get("TWILIO_AUTH_TOKEN");
    const twilioPhone = Deno.env.get("TWILIO_PHONE_NUMBER");

    if (!twilioSid || !twilioToken || !twilioPhone) {
      throw new Error("Twilio not configured");
    }

    const webhookUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/voice-memo-webhook?memo_id=${memo.id}`;

    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Calls.json`;
    const callParams = new URLSearchParams({
      To: callLog.phone_number,
      From: twilioPhone,
      Url: webhookUrl,
      StatusCallback: `${Deno.env.get("SUPABASE_URL")}/functions/v1/voice-memo-webhook?memo_id=${memo.id}&event=status`,
      StatusCallbackEvent: "completed",
    });

    const twilioResponse = await fetch(twilioUrl, {
      method: "POST",
      headers: {
        Authorization: "Basic " + btoa(`${twilioSid}:${twilioToken}`),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: callParams.toString(),
    });

    const twilioData = await twilioResponse.json();

    if (!twilioResponse.ok) {
      await supabase.from("voice_memos").update({ status: "failed" }).eq("id", memo.id);
      throw new Error(twilioData.message || "Failed to initiate voice memo call");
    }

    await supabase
      .from("voice_memos")
      .update({ twilio_call_sid: twilioData.sid, status: "calling" })
      .eq("id", memo.id);

    console.log(`Voice memo initiated for ${firstName} (${callLog.phone_number}), memo_id: ${memo.id}`);

    return new Response(
      JSON.stringify({ success: true, memo_id: memo.id, twilio_sid: twilioData.sid }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("voice-memo-followup error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
