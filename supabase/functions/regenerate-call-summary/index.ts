import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { call_log_id } = await req.json();
    if (!call_log_id) throw new Error("call_log_id required");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: callLog, error } = await supabase
      .from("call_logs")
      .select("*")
      .eq("id", call_log_id)
      .single();

    if (error || !callLog) throw new Error("Call log not found");

    const quizAnswers = (callLog.quiz_answers as any) || {};
    const history = quizAnswers.conversation_history || [];
    const transcript = history.map((m: any) => `${m.role}: ${m.content}`).join("\n");

    if (!transcript) {
      return new Response(JSON.stringify({ error: "No conversation transcript found for this call" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

    const duration = callLog.call_duration_seconds || callLog.duration_seconds || 0;
    const name = quizAnswers.respondent_name || "prospect";
    const score = callLog.quiz_score || quizAnswers.score || "N/A";
    const result = callLog.quiz_result_label || quizAnswers.result || "N/A";

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{
          role: "user",
          content: `You are a sales strategist reviewing a ${duration}s call transcript with ${name} (Automation Readiness Score: ${score}/100, Tier: ${result}).

Produce a SALES INTELLIGENCE BRIEF with these sections:
1. **Buyer Temperature** (Cold / Warm / Hot) — how ready are they to buy?
2. **Pain Points Identified** — the 2-3 specific business problems they mentioned
3. **Objections & Hesitations** — what held them back, pricing concerns, timing issues
4. **Buying Signals** — positive indicators (asked about pricing, features, timeline)
5. **Recommended Close Strategy** — the specific approach to convert this lead
6. **Next Action** — exactly what to do next and when
7. **Booking Status** — was a follow-up booked? If yes, when?

Keep it concise but actionable. This is for a sales closer, not a summary reader.

Transcript:
${transcript}`,
        }],
        max_tokens: 500,
      }),
    });

    if (!resp.ok) {
      const t = await resp.text();
      console.error("AI error:", resp.status, t);
      if (resp.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, try again in a moment" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI error: ${resp.status}`);
    }

    const data = await resp.json();
    const summary = data.choices?.[0]?.message?.content || null;

    if (summary) {
      await supabase.from("call_logs").update({ call_summary: summary }).eq("id", call_log_id);
    }

    return new Response(JSON.stringify({ summary }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("regenerate-call-summary error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
