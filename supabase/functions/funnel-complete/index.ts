import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * AI Completion Action Engine
 * After quiz completion, AI picks the best next action based on niche + score + answers.
 * Actions: book_consultation, book_trial_session, schedule_home_valuation, book_checkup,
 *          send_report, schedule_callback, send_link
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

    const {
      quiz_score,
      quiz_result_label,
      quiz_answers_summary,
      niche,
      lead_id,
      funnel_owner_id,
      phone_number,
      respondent_name,
      respondent_email,
      funnel_slug,
    } = await req.json();

    if (!niche || quiz_score === undefined) {
      throw new Error("niche and quiz_score are required");
    }

    // Get niche config for context
    const { data: nicheConfig } = await supabase
      .from("niche_config")
      .select("*")
      .eq("id", niche)
      .maybeSingle();

    // Use AI to determine the best completion action
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const nicheContext = nicheConfig?.quiz_prompt_context || niche;
    const ctaLabel = nicheConfig?.cta_label || "Book Your Call";

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          {
            role: "system",
            content: `You are a conversion optimization AI for the ${nicheContext} industry. Based on a quiz score (0-100) and answers, determine the single best next action to maximize conversion. You MUST respond with ONLY a JSON object.

Available actions by niche:
- lawyer: "book_consultation" (score >= 60), "send_case_review" (40-59), "schedule_callback" (< 40)
- fitness: "book_trial_session" (score >= 60), "send_program_guide" (40-59), "schedule_callback" (< 40)  
- real_estate: "schedule_home_valuation" (score >= 70), "send_market_report" (40-69), "book_consultation" (< 40)
- dentist: "book_checkup" (score >= 50), "send_new_patient_form" (30-49), "schedule_callback" (< 30)
- Default for other niches: "book_call" (score >= 60), "send_report" (40-59), "schedule_callback" (< 40)

Respond ONLY with: {"action":"action_name","reason":"one sentence why","cta_text":"Button text for the user","message":"Short personalized message to show the lead"}`,
          },
          {
            role: "user",
            content: `Niche: ${niche}\nQuiz Score: ${quiz_score}/100\nResult: ${quiz_result_label || "N/A"}\nAnswers: ${quiz_answers_summary || "N/A"}\nName: ${respondent_name || "Unknown"}`,
          },
        ],
      }),
    });

    if (!aiResponse.ok) {
      console.error("AI gateway error:", aiResponse.status);
      // Fallback to score-based logic
      return respondWithFallback(quiz_score, niche, ctaLabel, corsHeaders);
    }

    const aiData = await aiResponse.json();
    const aiText = aiData.choices?.[0]?.message?.content || "";

    let decision;
    try {
      const jsonMatch = aiText.match(/\{[\s\S]*\}/);
      decision = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch {
      return respondWithFallback(quiz_score, niche, ctaLabel, corsHeaders);
    }

    if (!decision?.action) {
      return respondWithFallback(quiz_score, niche, ctaLabel, corsHeaders);
    }

    // Execute the chosen action
    const actionResult = await executeAction({
      action: decision.action,
      supabase,
      lead_id,
      funnel_owner_id,
      phone_number,
      respondent_name,
      respondent_email,
      quiz_score,
      niche,
      funnel_slug,
    });

    return new Response(
      JSON.stringify({
        success: true,
        action: decision.action,
        reason: decision.reason,
        cta_text: decision.cta_text,
        message: decision.message,
        action_result: actionResult,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("funnel-complete error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

function respondWithFallback(score: number, niche: string, ctaLabel: string, headers: Record<string, string>) {
  const action = score >= 60 ? "book_call" : score >= 40 ? "send_report" : "schedule_callback";
  const cta = score >= 60 ? ctaLabel : score >= 40 ? "Get Your Report" : "We'll Call You";
  return new Response(
    JSON.stringify({
      success: true,
      action,
      reason: "Score-based fallback",
      cta_text: cta,
      message: score >= 60
        ? "You're a great fit! Let's get you scheduled."
        : score >= 40
        ? "We've prepared a personalized report for you."
        : "Our team will reach out to discuss your options.",
      action_result: { executed: false },
    }),
    { headers: { ...headers, "Content-Type": "application/json" } }
  );
}

async function executeAction(params: {
  action: string;
  supabase: any;
  lead_id?: string;
  funnel_owner_id?: string;
  phone_number?: string;
  respondent_name?: string;
  respondent_email?: string;
  quiz_score: number;
  niche: string;
  funnel_slug?: string;
}) {
  const { action, supabase, lead_id, funnel_owner_id, phone_number, respondent_name, quiz_score, niche } = params;

  // For booking actions, trigger the funnel-call flow (SMS with callback)
  if (["book_consultation", "book_trial_session", "schedule_home_valuation", "book_checkup", "book_call"].includes(action)) {
    if (phone_number) {
      try {
        await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/funnel-call`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            phone_number,
            respondent_name,
            respondent_email: params.respondent_email,
            quiz_score,
            quiz_result_label: `${niche} - ${action}`,
            quiz_title: `${niche} Assessment`,
            quiz_questions_summary: `Action: ${action}`,
            funnel_slug: params.funnel_slug,
            funnel_owner_id,
          }),
        });
        return { executed: true, type: "callback_sms_sent" };
      } catch (e) {
        console.error("Failed to trigger funnel-call:", e);
      }
    }
    return { executed: false, type: "no_phone" };
  }

  // For report/guide actions, log for follow-up
  if (["send_report", "send_case_review", "send_program_guide", "send_market_report", "send_new_patient_form"].includes(action)) {
    if (lead_id && funnel_owner_id) {
      await supabase.from("outreach_log").insert({
        user_id: funnel_owner_id,
        lead_id,
        channel: "email",
        company_name: respondent_name,
        email_subject: `Your ${niche} Assessment Results`,
        delivery_status: "queued",
      });
    }
    return { executed: true, type: "report_queued" };
  }

  // Schedule callback
  if (action === "schedule_callback") {
    if (phone_number && funnel_owner_id) {
      try {
        await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/funnel-call`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            phone_number,
            respondent_name,
            respondent_email: params.respondent_email,
            quiz_score,
            quiz_result_label: "Callback requested",
            quiz_title: `${niche} Assessment`,
            funnel_slug: params.funnel_slug,
            funnel_owner_id,
          }),
        });
        return { executed: true, type: "callback_scheduled" };
      } catch (e) {
        console.error("Failed to schedule callback:", e);
      }
    }
    return { executed: false, type: "no_phone" };
  }

  return { executed: false, type: "unknown_action" };
}
