import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const VAPI_API_KEY = Deno.env.get("VAPI_API_KEY");
const VAPI_BASE = "https://api.vapi.ai";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
  );
  const serviceSupabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } }
  );

  try {
    if (!VAPI_API_KEY) {
      return new Response(JSON.stringify({ error: "VAPI_API_KEY not configured" }), { status: 500, headers: corsHeaders });
    }

    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }
    const token = authHeader.replace("Bearer ", "");
    const { data: authData, error: authError } = await supabase.auth.getClaims(token);
    if (authError || !authData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }
    const userId = authData.claims.sub;

    // Verify caller is admin/chief_architect
    const { data: roles } = await serviceSupabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);

    const isAdmin = roles?.some((r) =>
      r.role === "admin" || r.role === "chief_architect"
    );
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: corsHeaders });
    }

    const { phone_number, call_type, context } = await req.json();

    if (!phone_number) {
      return new Response(JSON.stringify({ error: "phone_number is required" }), { status: 400, headers: corsHeaders });
    }

    // Build the assistant prompt based on call type
    let systemPrompt = "";
    let firstMessage = "";

    if (call_type === "applicant") {
      const name = context?.name || "there";
      const product = context?.product || "your project";
      systemPrompt = `You are a friendly enrollment advisor for PFSW (Prompt for Structured Work), an exclusive community for builders who use Lovable to ship real products.

You are calling ${name} who recently submitted an application to join PFSW. Your goal is to:
1. Confirm their interest and briefly explain what PFSW offers: weekly build cohorts, AI agent marketplace, curated Lovable prompt library, and accountability structure
2. Address any questions they have
3. Encourage them to upgrade and join — emphasize the community, the structure, and the agent tools
4. Be warm, confident, and concise. This is a 2-3 minute call maximum.

Their application mentioned they're building: ${product}

Do not be pushy. If they're not ready, get their best time for a follow-up.`;

      firstMessage = `Hey ${name}, this is the PFSW enrollment team calling. You recently applied to join our builder community and I just wanted to reach out personally. Do you have 2 minutes?`;
    } else if (call_type === "website_lead") {
      const businessName = context?.business_name || "your business";
      const website = context?.website || "";
      systemPrompt = `You are a web design consultant making a warm outbound call to a small business owner about rebuilding their website.

Business: ${businessName}
${website ? `Current website: ${website}` : ""}

Your goal:
1. Introduce yourself as a web designer who noticed their site could be improved
2. Mention 1-2 specific things that could be better (mobile experience, speed, modern design, booking/contact forms)
3. Explain you build sites quickly using the latest tools — typically 3-5 days
4. Ask if they'd be open to a 10-minute screen share to see what's possible
5. If interested, collect their email or offer to send a quick proposal

Be natural, not salesy. You're a professional offering genuine value, not a telemarketer.`;

      firstMessage = `Hi, is this ${businessName}? Great — my name is [your name] and I'm a web designer. I was looking at your website and I had a few ideas that might help you get more customers online. Do you have 2 minutes?`;
    } else {
      return new Response(JSON.stringify({ error: "Invalid call_type. Use 'applicant' or 'website_lead'" }), { status: 400, headers: corsHeaders });
    }

    // Create VAPI outbound call
    const vapiPayload = {
      phoneNumberId: undefined, // VAPI will use the default number on the account
      customer: {
        number: phone_number,
      },
      assistantOverrides: {
        firstMessage,
        model: {
          provider: "openai",
          model: "gpt-4o",
          systemPrompt,
        },
        voice: {
          provider: "11labs",
          voiceId: "sarah", // Professional female voice
        },
        endCallMessage: "Thanks for your time. Have a great day!",
        endCallPhrases: ["goodbye", "take care", "bye bye", "talk later", "not interested"],
        maxDurationSeconds: 300, // 5 min max
      },
    };

    const vapiRes = await fetch(`${VAPI_BASE}/call/phone`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${VAPI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(vapiPayload),
    });

    const vapiData = await vapiRes.json();

    if (!vapiRes.ok) {
      console.error("[vapi-call] VAPI error:", vapiData);
      return new Response(JSON.stringify({ error: vapiData?.message || "VAPI call failed" }), {
        status: vapiRes.status,
        headers: corsHeaders,
      });
    }

    console.log(`[vapi-call] Call initiated: ${vapiData.id} to ${phone_number} (${call_type})`);

    return new Response(JSON.stringify({
      success: true,
      call_id: vapiData.id,
      status: vapiData.status,
      phone_number,
      call_type,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    console.error("[vapi-call] Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
