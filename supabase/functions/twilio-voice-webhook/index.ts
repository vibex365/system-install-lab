import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: { "Content-Type": "text/xml" } });
  }

  try {
    const url = new URL(req.url);
    const callLogId = url.searchParams.get("call_log_id");
    const leadId = url.searchParams.get("lead_id");
    const event = url.searchParams.get("event");
    const respondentName = url.searchParams.get("respondent_name") || "";
    const quizScore = url.searchParams.get("quiz_score") || "0";
    const quizResult = url.searchParams.get("quiz_result") || "";

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    let formData: FormData | null = null;
    if (req.method === "POST") {
      try { formData = await req.formData(); } catch { /* not form data */ }
    }

    if (event === "recording") return await handleRecordingCallback(formData, supabase);
    if (event === "status") return await handleStatusCallback(formData, { supabase, callLogId, respondentName, quizScore, quizResult });
    if (event === "gather") return await handleGatherEvent(formData, { supabase, callLogId, leadId, respondentName, quizScore, quizResult });

    const callerPhone = formData?.get("From")?.toString() || "";
    const callSid = formData?.get("CallSid")?.toString() || "";
    console.log("Inbound call from:", callerPhone, "CallSid:", callSid);

    if (!callLogId && !leadId && callerPhone) return await handleInboundCall(supabase, callerPhone, callSid);
    return await handleInitialAnswer({ supabase, callLogId, leadId, respondentName, quizScore, quizResult }, callSid);

  } catch (err) {
    console.error("twilio-voice-webhook FATAL:", err);
    return twimlSay("Sorry, we're experiencing technical difficulties. We'll follow up shortly.");
  }
});

interface Ctx {
  supabase: any;
  callLogId: string | null;
  leadId?: string | null;
  respondentName: string;
  quizScore: string;
  quizResult: string;
}

// ─── INBOUND CALL HANDLER ───
async function handleInboundCall(supabase: any, callerPhone: string, callSid: string) {
  if (callSid) {
    setTimeout(() => startCallRecording(callSid).catch(e => console.error("Recording error:", e)), 3000);
  }

  try {
    // Find awaiting_callback
    const { data: awaitingLogs } = await supabase
      .from("call_logs")
      .select("*")
      .eq("phone_number", callerPhone)
      .eq("status", "awaiting_callback")
      .order("created_at", { ascending: false })
      .limit(1);

    let callLog = awaitingLogs?.[0] || null;

    // Try recent call with quiz data
    if (!callLog) {
      const { data: recentLogs } = await supabase
        .from("call_logs")
        .select("*")
        .eq("phone_number", callerPhone)
        .gt("quiz_score", 0)
        .order("created_at", { ascending: false })
        .limit(1);

      if (recentLogs?.[0]) {
        const prev = recentLogs[0];
        const prevQuiz = (prev.quiz_answers as any) || {};
        const { data: newLog } = await supabase.from("call_logs").insert({
          user_id: prev.user_id,
          lead_id: prev.lead_id,
          phone_number: callerPhone,
          call_type: "funnel_callback",
          status: "awaiting_callback",
          quiz_score: prev.quiz_score,
          quiz_result_label: prev.quiz_result_label,
          quiz_answers: { ...prevQuiz },
        }).select("*").maybeSingle();
        callLog = newLog;
      }
    }

    // Fallback: known lead
    if (!callLog) {
      const { data: leads } = await supabase
        .from("leads")
        .select("id, user_id, contact_name, business_name, source")
        .eq("phone", callerPhone)
        .order("created_at", { ascending: false })
        .limit(1);

      const lead = leads?.[0];
      if (lead) {
        const leadName = lead.contact_name || lead.business_name || "there";
        const { data: newCallLog } = await supabase.from("call_logs").insert({
          user_id: lead.user_id,
          lead_id: lead.id,
          phone_number: callerPhone,
          call_type: "inbound",
          status: "in-progress",
          quiz_answers: { inbound: true, lead_name: leadName },
        }).select("id").maybeSingle();

        const opening = `Hi ${leadName.split(" ")[0]}! Thanks for calling back. How can I help you today?`;
        return twimlGather(opening, buildGatherParams({ callLogId: newCallLog?.id || null, leadId: null, respondentName: leadName, quizScore: "0", quizResult: "" }));
      }

      return twimlSay("Hi there! Thanks for calling. I don't see a recent submission from your number. Please visit our website to get started. Have a great day!");
    }

    // Found matching callback
    const quizData = (callLog.quiz_answers as any) || {};
    const callerName = quizData.respondent_name || "";
    const firstName = callerName.split(" ")[0] || "there";
    const score = quizData.score || callLog.quiz_score || 0;
    const result = quizData.result || callLog.quiz_result_label || "";

    let quizAnswersDetail = "";
    if (quizData.summary) {
      quizAnswersDetail = `Score: ${score}/100, Result: ${result}\n\n${quizData.summary}`;
    }

    await supabase.from("call_logs").update({
      status: "in-progress",
      quiz_answers: { ...quizData, conversation_history: [], quiz_answers_detail: quizAnswersDetail },
    }).eq("id", callLog.id);

    let opening: string;
    try {
      opening = await generateAIOpening({ firstName, score: String(score), result, quizAnswersDetail });
    } catch (e) {
      console.error("AI opening error, using fallback:", e);
      opening = `Hi ${firstName}! Thanks for calling back. I'm a growth specialist from PFSW. I've got your Automation Readiness results right here — you scored ${score} out of 100, putting you in the ${result} category. I found some really interesting insights about your business. Want me to walk you through them?`;
    }

    const gatherParams = buildGatherParams({ callLogId: callLog.id, leadId: null, respondentName: callerName, quizScore: String(score), quizResult: result });

    await supabase.from("call_logs").update({
      quiz_answers: { ...quizData, conversation_history: [{ role: "assistant", content: opening }], quiz_answers_detail: quizAnswersDetail },
    }).eq("id", callLog.id);

    return twimlGather(opening, gatherParams);
  } catch (err) {
    console.error("handleInboundCall error:", err);
    return twimlSay("Thanks for calling! We're having a brief technical issue. We'll call you right back. Goodbye!");
  }
}

// ─── Generate opening with Lovable AI ───
async function generateAIOpening(ctx: { firstName: string; score: string; result: string; quizAnswersDetail: string }): Promise<string> {
  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) throw new Error("No LOVABLE_API_KEY");

  const prompt = `You are a growth specialist from PFSW (People Fail, Systems Work), a platform that provides quiz funnels and AI agents for digital entrepreneurs. You're opening a live phone call with ${ctx.firstName}, a business owner who just completed the Automation Readiness Quiz.

Here are their EXACT quiz results:
${ctx.quizAnswersDetail || `Score: ${ctx.score}/100, Result: ${ctx.result}`}

Generate a warm, personalized 3-4 sentence opening that:
1. Greets them by name and thanks them for calling back
2. References 1-2 SPECIFIC answers from their quiz
3. Teases a key insight from their results
4. Asks if they have a few minutes to go through the findings

Keep it conversational, NOT scripted. Do NOT say you're AI. Just natural speech.`;

  const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 200,
    }),
  });

  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`AI error ${resp.status}: ${errText}`);
  }
  const data = await resp.json();
  return data.choices?.[0]?.message?.content || "";
}

// ─── Gather Event Handler (Multi-Turn AI Conversation) ───
async function handleGatherEvent(formData: FormData | null, ctx: Ctx & { leadId?: string | null }) {
  const { supabase, callLogId, respondentName, quizScore, quizResult } = ctx;
  const speechResult = formData?.get("SpeechResult")?.toString() || "";
  console.log("Gather speech:", speechResult);

  let conversationHistory: Array<{ role: string; content: string }> = [];
  let quizAnswersDetail = "";

  if (callLogId) {
    try {
      const { data: callLog } = await supabase.from("call_logs").select("quiz_answers").eq("id", callLogId).single();
      const existing = (callLog?.quiz_answers as any) || {};
      conversationHistory = existing?.conversation_history || [];
      quizAnswersDetail = existing?.quiz_answers_detail || "";
      if (!quizAnswersDetail && existing?.summary) {
        quizAnswersDetail = `Score: ${existing.score || quizScore}, Result: ${existing.result || quizResult}\n\n${existing.summary}`;
      }
    } catch { /* fresh */ }
  }

  conversationHistory.push({ role: "user", content: speechResult });

  let resolvedUserId = "";
  if (callLogId) {
    try {
      const { data: cl } = await supabase.from("call_logs").select("user_id").eq("id", callLogId).single();
      resolvedUserId = cl?.user_id || "";
    } catch {}
  }

  const systemPrompt = await buildConversationSystemPrompt({ respondentName, quizScore, quizResult, quizAnswersDetail, supabase, userId: resolvedUserId });

  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  let aiResponse = "Thank you for your time. We'll follow up with you shortly. Have a great day!";
  let shouldEnd = false;

  if (apiKey) {
    try {
      const messages = conversationHistory.map(m => ({
        role: m.role === "assistant" ? "assistant" as const : "user" as const,
        content: m.content,
      }));

      const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [{ role: "system", content: systemPrompt }, ...messages],
          max_tokens: 250,
        }),
      });

      if (!resp.ok) {
        console.error("AI error:", resp.status, await resp.text());
      } else {
        const data = await resp.json();
        aiResponse = data.choices?.[0]?.message?.content || aiResponse;
      }

      // Handle booking
      const bookingMatch = aiResponse.match(/\[BOOK(?::([^\]]*))?\]/i);
      if (bookingMatch && callLogId) {
        const dayPreference = bookingMatch[1]?.trim() || "";
        try {
          const booked = await createAppointmentFromCall({ supabase, callLogId, respondentName, dayPreference });
          if (booked) {
            aiResponse = aiResponse.replace(/\[BOOK(?::[^\]]*)?\]/gi, "").trim();
            if (!aiResponse.toLowerCase().includes("booked") && !aiResponse.toLowerCase().includes("scheduled")) {
              aiResponse += ` I've got you booked for ${booked.dateStr}. I'll send you a text confirmation right now.`;
            }
            await sendBookingSms({ supabase, callLogId, appointmentDate: booked.dateStr, respondentName });
            await sendBookingEmail({ supabase, callLogId, appointmentDate: booked.dateStr, respondentName });
          }
        } catch (bookErr) { console.error("Booking error:", bookErr); }
      }

      const lowerResp = aiResponse.toLowerCase();
      shouldEnd = lowerResp.includes("[end_call]") || lowerResp.includes("have a great day") || lowerResp.includes("goodbye");
      aiResponse = aiResponse.replace(/\[end_call\]/gi, "").replace(/\[BOOK(?::[^\]]*)?\]/gi, "").trim();
    } catch (e) { console.error("AI conversation error:", e); }
  }

  conversationHistory.push({ role: "assistant", content: aiResponse });

  if (callLogId) {
    try {
      const { data: callLog } = await supabase.from("call_logs").select("quiz_answers").eq("id", callLogId).single();
      const existing = (callLog?.quiz_answers as any) || {};
      await supabase.from("call_logs").update({
        quiz_answers: { ...existing, conversation_history: conversationHistory, quiz_answers_detail: quizAnswersDetail },
      }).eq("id", callLogId);
    } catch { /* non-critical */ }
  }

  if (shouldEnd || conversationHistory.length > 40) {
    return twimlSay(aiResponse);
  }

  return twimlGather(aiResponse, buildGatherParams({ callLogId, leadId: ctx.leadId || null, respondentName, quizScore, quizResult }));
}

// ─── Initial Answer (outbound calls) ───
async function handleInitialAnswer(ctx: Ctx, callSid?: string) {
  const { supabase, callLogId, respondentName, quizScore, quizResult } = ctx;
  const firstName = respondentName.split(" ")[0] || "there";

  const opening = `Hi ${firstName}, this is a growth specialist from PFSW. You completed our Automation Readiness Quiz and scored in the ${quizResult} range. I'd love to walk you through what we found about your business and show you how quiz funnels and AI agents can help. Is now a good time?`;

  if (callLogId) {
    await supabase.from("call_logs").update({ status: "in-progress" }).eq("id", callLogId);
  }

  return twimlGather(opening, buildGatherParams({ callLogId, leadId: ctx.leadId || null, respondentName, quizScore, quizResult }));
}

// ─── Status Callback ───
async function handleStatusCallback(formData: FormData | null, ctx: Ctx) {
  const { supabase, callLogId, respondentName, quizScore, quizResult } = ctx;
  const callStatus = formData?.get("CallStatus")?.toString() || "";
  const duration = parseInt(formData?.get("CallDuration")?.toString() || "0", 10);

  if (callLogId) {
    const finalStatus = callStatus === "completed" ? "completed" : callStatus === "busy" ? "busy" : callStatus === "no-answer" ? "no-answer" : "failed";
    let summary: string | null = null;
    if (finalStatus === "completed" && duration > 10) {
      summary = await generateCallSummary({ supabase, callLogId, respondentName, quizScore, quizResult, duration });
    }
    await supabase.from("call_logs").update({ status: finalStatus, call_duration_seconds: duration, call_summary: summary }).eq("id", callLogId);
  }

  return new Response('<?xml version="1.0" encoding="UTF-8"?><Response></Response>', { headers: { "Content-Type": "text/xml" } });
}

// ─── Recording Callback ───
async function handleRecordingCallback(formData: FormData | null, supabase: any) {
  const recordingUrl = formData?.get("RecordingUrl")?.toString() || "";
  if (recordingUrl) {
    const { data: callLogs } = await supabase
      .from("call_logs")
      .select("id")
      .in("status", ["in-progress", "completed"])
      .order("created_at", { ascending: false })
      .limit(1);
    if (callLogs?.[0]) {
      await supabase.from("call_logs").update({ call_recording_url: `${recordingUrl}.mp3` }).eq("id", callLogs[0].id);
    }
  }
  return new Response('<?xml version="1.0" encoding="UTF-8"?><Response></Response>', { headers: { "Content-Type": "text/xml" } });
}

// ─── Build conversation system prompt ───
async function buildConversationSystemPrompt(ctx: { respondentName: string; quizScore: string; quizResult: string; quizAnswersDetail: string; supabase?: any; userId?: string }): Promise<string> {
  const firstName = ctx.respondentName.split(" ")[0] || "there";
  const quizSection = ctx.quizAnswersDetail
    ? `\n\nHere are ${firstName}'s EXACT quiz answers — reference these specifically:\n${ctx.quizAnswersDetail}`
    : `\nTheir score: ${ctx.quizScore}/100, result: ${ctx.quizResult}`;

  let availabilitySection = "";
  if (ctx.supabase && ctx.userId) {
    availabilitySection = await buildAvailabilityString(ctx.supabase, ctx.userId);
  }

  return `You are a friendly, knowledgeable AI growth specialist from PFSW (People Fail, Systems Work), a platform that provides quiz funnels and AI agents for digital entrepreneurs (MLM, affiliate marketing, coaching, home business). You're on a live phone call with ${firstName}, a business owner who completed the Automation Readiness Quiz and called YOU back.
${quizSection}
${availabilitySection}

YOUR CONVERSATION GOALS (in order):
1. Have a consultative, back-and-forth conversation about their specific challenges — reference their ACTUAL quiz answers
2. Explain how PFSW solves 2-3 of their specific weak points with AI-powered lead generation (Scout Agents), automated qualification (Quiz Funnels), and smart follow-up (Voice + SMS agents)
3. Build urgency — "entrepreneurs using AI follow-up are closing 40% more leads"
4. Book a 15-minute strategy call — when it's time to book, TELL the caller the specific available times from the list above.
5. When they agree to a time/day, include [BOOK:their preference] in your response.

RULES:
- Keep EVERY response to 2-3 sentences MAX. This is a phone call, not a lecture.
- Be warm, consultative, NOT pushy.
- Reference their specific quiz answers naturally.
- Never say you're AI. You're a growth specialist.
- When offering to book, present the specific available time slots listed above.
- When they agree to book, include [BOOK:day/time preference].
- When the call is wrapping up, include [END_CALL].
- If they say they're not interested, gracefully wrap up with [END_CALL].`;
}

// ─── Build availability string ───
async function buildAvailabilityString(supabase: any, userId: string): Promise<string> {
  try {
    const { data: slots } = await supabase
      .from("availability_slots")
      .select("day_of_week, start_time, end_time")
      .eq("user_id", userId)
      .eq("is_active", true)
      .order("day_of_week")
      .order("start_time");

    if (!slots || slots.length === 0) return "";

    const now = new Date();
    const fourteenDaysOut = new Date(now.getTime() + 14 * 86400000);
    const { data: existingAppts } = await supabase
      .from("appointments")
      .select("start_at, end_at")
      .eq("user_id", userId)
      .gte("start_at", now.toISOString())
      .lte("start_at", fourteenDaysOut.toISOString())
      .in("status", ["scheduled", "confirmed"]);

    const conflicts = (existingAppts || []).map((a: any) => ({ start: new Date(a.start_at).getTime(), end: new Date(a.end_at).getTime() }));

    function hasConflict(start: Date, end: Date): boolean {
      return conflicts.some((c: any) => start.getTime() < c.end && end.getTime() > c.start);
    }

    const times: string[] = [];
    for (let i = 1; i <= 14 && times.length < 10; i++) {
      const date = new Date(now.getTime() + i * 86400000);
      const dow = date.getDay();
      const daySlots = slots.filter((s: any) => s.day_of_week === dow);

      for (const slot of daySlots) {
        const [sh, sm] = slot.start_time.split(":").map(Number);
        const [eh, em] = slot.end_time.split(":").map(Number);
        let h = sh, m = sm, count = 0;
        while ((h < eh || (h === eh && m < em)) && count < 3) {
          const candidate = new Date(date);
          candidate.setHours(h, m, 0, 0);
          const candidateEnd = new Date(candidate.getTime() + 30 * 60000);
          if (!hasConflict(candidate, candidateEnd)) {
            const ampm = h >= 12 ? "PM" : "AM";
            const displayH = h > 12 ? h - 12 : h === 0 ? 12 : h;
            times.push(`${date.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })} at ${displayH}:${m.toString().padStart(2, "0")} ${ampm}`);
            count++;
          }
          m += 30;
          if (m >= 60) { h++; m -= 60; }
        }
      }
    }

    if (times.length === 0) return "";
    return `\n\nAVAILABLE TIME SLOTS (offer 2-3 at a time):\n${times.map((t, i) => `${i + 1}. ${t}`).join("\n")}\n\nBOOKING INSTRUCTIONS: Present 2-3 options at a time. If none work, offer more.`;
  } catch (e) {
    console.error("buildAvailabilityString error:", e);
    return "";
  }
}

// ─── Generate call summary ───
async function generateCallSummary(ctx: { supabase: any; callLogId: string; respondentName: string; quizScore: string; quizResult: string; duration: number }): Promise<string | null> {
  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) return null;

  try {
    const { data: callLog } = await ctx.supabase.from("call_logs").select("quiz_answers").eq("id", ctx.callLogId).single();
    const history = (callLog?.quiz_answers as any)?.conversation_history || [];
    const text = history.map((m: any) => `${m.role}: ${m.content}`).join("\n");

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: `You are a sales strategist reviewing a ${ctx.duration}s call transcript with ${ctx.respondentName || "a prospect"} (Automation Readiness Score: ${ctx.quizScore}/100, Tier: ${ctx.quizResult}).

Produce a SALES INTELLIGENCE BRIEF with these sections:
1. **Buyer Temperature** (Cold / Warm / Hot) — how ready are they to buy?
2. **Pain Points Identified** — the 2-3 specific business problems they mentioned
3. **Objections & Hesitations** — what held them back, pricing concerns, timing issues
4. **Buying Signals** — positive indicators (asked about pricing, features, timeline)
5. **Recommended Close Strategy** — the specific approach to convert this lead (e.g., urgency play, ROI demo, social proof, free trial offer)
6. **Next Action** — exactly what to do next and when (e.g., "Send case study within 24hrs then call Thursday")
7. **Booking Status** — was a follow-up booked? If yes, when?

Keep it concise but actionable. This is for a sales closer, not a summary reader.

Transcript:
${text}` }],
        max_tokens: 500,
      }),
    });
    if (!resp.ok) return null;
    const data = await resp.json();
    return data.choices?.[0]?.message?.content || null;
  } catch (e) {
    console.error("Summary error:", e);
    return null;
  }
}

// ─── Create appointment from call ───
async function createAppointmentFromCall(ctx: { supabase: any; callLogId: string; respondentName: string; dayPreference: string }): Promise<{ dateStr: string } | null> {
  const { supabase, callLogId, respondentName, dayPreference } = ctx;

  const { data: callLog } = await supabase.from("call_logs").select("user_id, lead_id").eq("id", callLogId).single();
  if (!callLog?.user_id) return null;

  const { data: slots } = await supabase
    .from("availability_slots")
    .select("day_of_week, start_time, end_time")
    .eq("user_id", callLog.user_id)
    .eq("is_active", true)
    .order("day_of_week");

  const now = new Date();
  const twoWeeksOut = new Date(now.getTime() + 14 * 86400000);
  const { data: existingAppts } = await supabase
    .from("appointments")
    .select("start_at, end_at")
    .eq("user_id", callLog.user_id)
    .gte("start_at", now.toISOString())
    .lte("start_at", twoWeeksOut.toISOString())
    .in("status", ["scheduled", "confirmed"]);

  const pref = dayPreference.toLowerCase();
  const availByDay = new Map<number, Array<{ startHour: number; startMin: number; endHour: number; endMin: number }>>();
  if (slots?.length) {
    for (const s of slots) {
      const [sh, sm] = s.start_time.split(":").map(Number);
      const [eh, em] = s.end_time.split(":").map(Number);
      if (!availByDay.has(s.day_of_week)) availByDay.set(s.day_of_week, []);
      availByDay.get(s.day_of_week)!.push({ startHour: sh, startMin: sm, endHour: eh, endMin: em });
    }
  }
  const hasAvailability = availByDay.size > 0;

  function hasConflict(start: Date, end: Date): boolean {
    if (!existingAppts) return false;
    return existingAppts.some((a: any) => {
      const aS = new Date(a.start_at).getTime(), aE = new Date(a.end_at).getTime();
      return start.getTime() < aE && end.getTime() > aS;
    });
  }

  function findSlotOnDate(date: Date): Date | null {
    const daySlots = availByDay.get(date.getDay());
    if (!daySlots?.length) return null;
    const preferAfternoon = pref.includes("afternoon") || pref.includes("evening");
    const sorted = [...daySlots].sort((a, b) => a.startHour - b.startHour);
    for (const slot of preferAfternoon ? sorted.reverse() : sorted) {
      let h = preferAfternoon ? Math.max(slot.startHour, 13) : slot.startHour;
      let m = slot.startMin;
      const slotEnd = new Date(date); slotEnd.setHours(slot.endHour, slot.endMin, 0, 0);
      while (true) {
        const candidate = new Date(date); candidate.setHours(h, m, 0, 0);
        const candidateEnd = new Date(candidate.getTime() + 30 * 60000);
        if (candidateEnd.getTime() > slotEnd.getTime()) break;
        if (!hasConflict(candidate, candidateEnd)) return candidate;
        m += 30; if (m >= 60) { h++; m -= 60; }
      }
    }
    return null;
  }

  let appointmentDate: Date | null = null;
  const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  const foundDay = dayNames.findIndex(d => pref.includes(d));

  if (foundDay >= 0 && hasAvailability) {
    let daysUntil = foundDay - now.getDay();
    if (daysUntil <= 0) daysUntil += 7;
    appointmentDate = findSlotOnDate(new Date(now.getTime() + daysUntil * 86400000));
  }
  if (!appointmentDate && hasAvailability) {
    for (let i = 1; i <= 14; i++) {
      appointmentDate = findSlotOnDate(new Date(now.getTime() + i * 86400000));
      if (appointmentDate) break;
    }
  }
  if (!appointmentDate) {
    appointmentDate = new Date(now.getTime() + 86400000);
    while (appointmentDate.getDay() === 0 || appointmentDate.getDay() === 6) {
      appointmentDate = new Date(appointmentDate.getTime() + 86400000);
    }
    appointmentDate.setHours(pref.includes("afternoon") ? 14 : 10, 0, 0, 0);
  }

  const endDate = new Date(appointmentDate.getTime() + 30 * 60000);

  const { data: appointment } = await supabase.from("appointments").insert({
    user_id: callLog.user_id,
    lead_id: callLog.lead_id || null,
    title: `Strategy Call — ${respondentName || "Lead"}`,
    description: `Booked via AI call agent. Day preference: ${dayPreference}`,
    start_at: appointmentDate.toISOString(),
    end_at: endDate.toISOString(),
    status: "confirmed",
    location: "Phone",
  }).select("id").maybeSingle();

  if (appointment) {
    await supabase.from("call_logs").update({ appointment_id: appointment.id, booking_made: true }).eq("id", callLogId);

    // Also create a booking entry for the calendar system
    const { data: callLogData } = await supabase.from("call_logs").select("phone_number").eq("id", callLogId).single();
    const guestPhone = callLogData?.phone_number || null;
    let guestEmail = "";
    if (callLog.lead_id) {
      const { data: lead } = await supabase.from("leads").select("email").eq("id", callLog.lead_id).single();
      guestEmail = lead?.email || `${(respondentName || "lead").toLowerCase().replace(/\s+/g, "")}@placeholder.local`;
    } else {
      guestEmail = `${(respondentName || "lead").toLowerCase().replace(/\s+/g, "")}@placeholder.local`;
    }

    await supabase.from("bookings").insert({
      host_user_id: callLog.user_id,
      lead_id: callLog.lead_id || null,
      guest_name: respondentName || "Lead",
      guest_email: guestEmail,
      guest_phone: guestPhone,
      scheduled_at: appointmentDate.toISOString(),
      duration_minutes: 30,
      status: "confirmed",
      notes: `Auto-booked via AI voice call. Preference: ${dayPreference}`,
    });

    // Log voice call to outreach_log
    await supabase.from("outreach_log").insert({
      user_id: callLog.user_id,
      lead_id: callLog.lead_id || null,
      channel: "voice",
      recipient_phone: guestPhone,
      company_name: respondentName || null,
      delivery_status: "sent",
      sms_body: `Voice call — booking confirmed for ${dateStr}`,
    });
  }

  const hour = appointmentDate.getHours();
  const ampm = hour >= 12 ? "PM" : "AM";
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  const dateStr = appointmentDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }) + ` at ${displayHour}:${appointmentDate.getMinutes().toString().padStart(2, "0")} ${ampm}`;

  return { dateStr };
}

// ─── Send booking SMS ───
async function sendBookingSms(ctx: { supabase: any; callLogId: string; appointmentDate: string; respondentName: string }) {
  const { supabase, callLogId, appointmentDate, respondentName } = ctx;
  const { data: callLog } = await supabase.from("call_logs").select("phone_number, user_id").eq("id", callLogId).single();
  if (!callLog?.phone_number) return;

  const twilioSid = Deno.env.get("TWILIO_ACCOUNT_SID");
  const twilioToken = Deno.env.get("TWILIO_AUTH_TOKEN");
  const twilioPhone = Deno.env.get("TWILIO_PHONE_NUMBER");
  if (!twilioSid || !twilioToken || !twilioPhone) return;

  const firstName = respondentName.split(" ")[0] || "there";
  const smsBody = `Hi ${firstName}! ✅ Your PFSW strategy session is confirmed for ${appointmentDate}. We'll call you at this number. Looking forward to helping grow your business!`;

  try {
    await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`, {
      method: "POST",
      headers: { "Authorization": "Basic " + btoa(`${twilioSid}:${twilioToken}`), "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ To: callLog.phone_number, From: twilioPhone, Body: smsBody }).toString(),
    });
  } catch (e) { console.error("Booking SMS error:", e); }
}

// ─── Send booking email ───
async function sendBookingEmail(ctx: { supabase: any; callLogId: string; appointmentDate: string; respondentName: string }) {
  const resendKey = Deno.env.get("RESEND_API_KEY");
  if (!resendKey) return;

  const { supabase, callLogId, appointmentDate, respondentName } = ctx;
  const { data: callLog } = await supabase.from("call_logs").select("lead_id, user_id").eq("id", callLogId).single();
  if (!callLog) return;

  let leadEmail = "";
  if (callLog.lead_id) {
    const { data: lead } = await supabase.from("leads").select("email, contact_name").eq("id", callLog.lead_id).single();
    if (lead?.email) leadEmail = lead.email;
  }

  const firstName = respondentName.split(" ")[0] || "there";
  const subject = `✅ Your PFSW Strategy Session — ${appointmentDate}`;
  const htmlBody = `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;color:#333;">
<div style="background:#000;color:#fff;padding:24px;border-radius:12px 12px 0 0;text-align:center;">
  <h1 style="margin:0;font-size:22px;">Your Strategy Session is Confirmed!</h1>
</div>
<div style="background:#fff;border:1px solid #e5e5e5;border-top:none;border-radius:0 0 12px 12px;padding:24px;">
  <div style="background:#f8f9fa;border-radius:8px;padding:16px;margin-bottom:20px;text-align:center;">
    <p style="margin:0;font-size:18px;font-weight:bold;color:#000;">📅 ${appointmentDate}</p>
  </div>
  <p>Hi ${firstName},</p>
  <p>Your PFSW growth strategy session has been booked. During this session, we'll walk through your Automation Readiness results and show you exactly how quiz funnels + AI agents can automate your prospecting and grow your business.</p>
  <p>We'll call you at the number you called from. If you need to reschedule, just reply to this email.</p>
  <p>Looking forward to it!</p>
  <p>— The PFSW Team</p>
</div>
</body></html>`;

  if (leadEmail) {
    try {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Authorization": `Bearer ${resendKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from: "PFSW <noreply@peoplefailsystemswork.com>", to: [leadEmail], subject, html: htmlBody }),
      });
    } catch (e) { console.error("Booking email error:", e); }
  }
}

// ─── Recording via Twilio REST API ───
async function startCallRecording(callSid: string) {
  const sid = Deno.env.get("TWILIO_ACCOUNT_SID");
  const token = Deno.env.get("TWILIO_AUTH_TOKEN");
  if (!sid || !token) return;

  const cb = `${Deno.env.get("SUPABASE_URL")}/functions/v1/twilio-voice-webhook?event=recording`;
  try {
    await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Calls/${callSid}/Recordings.json`, {
      method: "POST",
      headers: { "Authorization": "Basic " + btoa(`${sid}:${token}`), "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ RecordingStatusCallback: cb, RecordingStatusCallbackEvent: "completed", RecordingChannels: "dual" }).toString(),
    });
  } catch (e) { console.error("Recording API error:", e); }
}

// ─── Helpers ───
function buildGatherParams(ctx: { callLogId: string | null; leadId: string | null; respondentName: string; quizScore: string; quizResult: string }) {
  const p = new URLSearchParams();
  if (ctx.callLogId) p.set("call_log_id", ctx.callLogId);
  if (ctx.leadId) p.set("lead_id", ctx.leadId);
  if (ctx.respondentName) p.set("respondent_name", ctx.respondentName);
  if (ctx.quizScore) p.set("quiz_score", ctx.quizScore);
  if (ctx.quizResult) p.set("quiz_result", ctx.quizResult);
  p.set("event", "gather");
  return p;
}

function twimlGather(message: string, gatherParams: URLSearchParams): Response {
  const actionUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/twilio-voice-webhook?${gatherParams.toString()}`;
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Gather input="speech" timeout="5" speechTimeout="auto" action="${escapeXml(actionUrl)}">
    <Say voice="Polly.Joanna">${escapeXml(message)}</Say>
  </Gather>
  <Say voice="Polly.Joanna">I didn't catch that. No worries, I'll send you a text with next steps. Have a great day!</Say>
</Response>`;
  return new Response(twiml, { headers: { "Content-Type": "text/xml" } });
}

function twimlSay(message: string): Response {
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?><Response><Say voice="Polly.Joanna">${escapeXml(message)}</Say></Response>`,
    { headers: { "Content-Type": "text/xml" } }
  );
}

function escapeXml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}
