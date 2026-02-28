import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const META_API_BASE = "https://graph.facebook.com/v21.0";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    const body = await req.json();
    let { user_id, campaign_name, objective, daily_budget_cents, target_audience, creative_urls } = body;
    const { stepId, workflowId, params, memory, workflow_id, step_id } = body;

    // Support orchestrator-style params
    const uid = user_id || params?.user_id || "";
    if (!uid) throw new Error("Missing user_id");
    user_id = uid;

    const wfId = workflowId || workflow_id;
    const sId = stepId || step_id;

    if (sId) {
      await supabaseAdmin.from("workflow_steps").update({ status: "running", started_at: new Date().toISOString() }).eq("id", sId);
    }

    // Pull chained data from workflow memory (carousel copy + generated images)
    let chainedCarousel: any = null;
    let chainedImages: string[] = [];

    if (wfId) {
      const { data: wf } = await supabaseAdmin.from("workflows").select("memory").eq("id", wfId).single();
      const wfMemory = (wf as any)?.memory || {};
      chainedCarousel = wfMemory.carousel_output;
      chainedImages = wfMemory.generated_images || [];
    }
    if (!chainedCarousel && memory?.carousel_output) chainedCarousel = memory.carousel_output;
    if (chainedImages.length === 0 && memory?.generated_images) chainedImages = memory.generated_images;

    // Use chained data if available
    if (!creative_urls?.length && chainedImages.length) {
      creative_urls = chainedImages;
      console.log("Using", chainedImages.length, "images from upstream image generator");
    }
    if (!campaign_name && chainedCarousel?.product) {
      campaign_name = `${chainedCarousel.product} Carousel Campaign`;
    }
    if (!target_audience && chainedCarousel?.carousel?.targeting_suggestions) {
      target_audience = { description: chainedCarousel.carousel.targeting_suggestions };
    }

    // 1. Fetch user's Meta credentials
    const { data: integration, error: intErr } = await supabaseAdmin
      .from("user_integrations")
      .select("credentials")
      .eq("user_id", user_id)
      .eq("provider", "meta_ads")
      .single();

    if (intErr || !integration) {
      throw new Error("Meta Ads credentials not found. Please connect your Meta account in settings.");
    }

    const { access_token, ad_account_id } = integration.credentials as {
      access_token: string;
      ad_account_id: string;
    };

    if (!access_token || !ad_account_id) {
      throw new Error("Incomplete Meta credentials. Please update your access token and ad account ID.");
    }

    const accountId = ad_account_id.startsWith("act_") ? ad_account_id : `act_${ad_account_id}`;

    // 2. Generate ad copy with AI
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    let generatedCopy = { headline: campaign_name, body: "", cta: "LEARN_MORE" };

    if (LOVABLE_API_KEY) {
      try {
        const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [
              {
                role: "system",
                content: "You are a Meta Ads copywriter. Generate compelling ad copy. Return ONLY a JSON object with keys: headline (max 40 chars), primary_text (max 125 chars), description (max 30 chars), cta (one of: LEARN_MORE, SIGN_UP, SHOP_NOW, BOOK_TRAVEL, CONTACT_US, GET_QUOTE, SUBSCRIBE, APPLY_NOW).",
              },
              {
                role: "user",
                content: `Campaign: ${campaign_name}\nObjective: ${objective}\nTarget audience: ${JSON.stringify(target_audience)}\n\nGenerate Facebook ad copy.`,
              },
            ],
          }),
        });

        if (aiResp.ok) {
          const aiData = await aiResp.json();
          const content = aiData.choices?.[0]?.message?.content || "";
          try {
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              const parsed = JSON.parse(jsonMatch[0]);
              generatedCopy = {
                headline: parsed.headline || campaign_name,
                body: parsed.primary_text || parsed.body || "",
                cta: parsed.cta || "LEARN_MORE",
                ...parsed,
              };
            }
          } catch {
            console.log("AI copy parse failed, using defaults");
          }
        }
      } catch (e) {
        console.log("AI generation failed:", e);
      }
    }

    // 3. Create Meta Campaign
    const campaignResp = await fetch(`${META_API_BASE}/${accountId}/campaigns`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: campaign_name,
        objective: objective || "OUTCOME_LEADS",
        status: "PAUSED",
        special_ad_categories: [],
        access_token,
      }),
    });

    const campaignData = await campaignResp.json();
    if (campaignData.error) {
      throw new Error(`Meta Campaign Error: ${campaignData.error.message}`);
    }
    const metaCampaignId = campaignData.id;

    // 4. Create Ad Set
    const audience = target_audience || {};
    const targeting: any = {};
    if (audience.locations?.length) {
      targeting.geo_locations = {
        cities: audience.locations.map((loc: string) => ({ key: loc })),
      };
    }
    if (audience.age_min) targeting.age_min = audience.age_min;
    if (audience.age_max) targeting.age_max = audience.age_max;
    if (audience.interests?.length) {
      targeting.flexible_spec = [
        {
          interests: audience.interests.map((i: string) => ({ name: i })),
        },
      ];
    }

    const adsetResp = await fetch(`${META_API_BASE}/${accountId}/adsets`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: `${campaign_name} - Ad Set`,
        campaign_id: metaCampaignId,
        daily_budget: daily_budget_cents || 1000,
        billing_event: "IMPRESSIONS",
        optimization_goal: objective === "OUTCOME_LEADS" ? "LEAD_GENERATION" : "LINK_CLICKS",
        targeting: Object.keys(targeting).length > 0 ? targeting : { geo_locations: { countries: ["US"] } },
        status: "PAUSED",
        access_token,
      }),
    });

    const adsetData = await adsetResp.json();
    if (adsetData.error) {
      throw new Error(`Meta Ad Set Error: ${adsetData.error.message}`);
    }
    const metaAdsetId = adsetData.id;

    // 5. Create Ad Creative with image
    let metaAdId = null;
    const imageUrl = creative_urls?.[0];

    if (imageUrl) {
      // Upload image to Meta
      const creativeResp = await fetch(`${META_API_BASE}/${accountId}/adcreatives`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `${campaign_name} - Creative`,
          object_story_spec: {
            link_data: {
              image_url: imageUrl,
              message: generatedCopy.body || generatedCopy.primary_text || "",
              name: generatedCopy.headline,
              description: generatedCopy.description || "",
              call_to_action: { type: generatedCopy.cta || "LEARN_MORE" },
            },
          },
          access_token,
        }),
      });

      const creativeData = await creativeResp.json();

      if (!creativeData.error) {
        // Create the Ad
        const adResp = await fetch(`${META_API_BASE}/${accountId}/ads`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: `${campaign_name} - Ad`,
            adset_id: metaAdsetId,
            creative: { creative_id: creativeData.id },
            status: "PAUSED",
            access_token,
          }),
        });

        const adData = await adResp.json();
        if (!adData.error) {
          metaAdId = adData.id;
        }
      }
    }

    // 6. Save campaign to database
    const { data: campaign, error: saveErr } = await supabaseAdmin
      .from("ad_campaigns")
      .insert({
        user_id,
        campaign_name,
        objective: objective || "OUTCOME_LEADS",
        daily_budget_cents: daily_budget_cents || 1000,
        target_audience: target_audience || {},
        ad_copy: generatedCopy,
        creative_urls: creative_urls || [],
        meta_campaign_id: metaCampaignId,
        meta_adset_id: metaAdsetId,
        meta_ad_id: metaAdId,
        status: "paused",
      })
      .select()
      .single();

    if (saveErr) throw new Error(`Failed to save campaign: ${saveErr.message}`);

    // 7. Deduct 5 lead credits
    const { data: credits } = await supabaseAdmin
      .from("credit_purchases")
      .select("*")
      .eq("user_id", user_id)
      .eq("resource_type", "leads")
      .gt("credits_remaining", 0)
      .order("purchased_at", { ascending: true });

    let remaining = 5;
    for (const credit of credits || []) {
      if (remaining <= 0) break;
      const deduct = Math.min(remaining, credit.credits_remaining);
      await supabaseAdmin
        .from("credit_purchases")
        .update({ credits_remaining: credit.credits_remaining - deduct })
        .eq("id", credit.id);
      remaining -= deduct;
    }

    const result = {
      success: true,
      campaign,
      meta_ids: {
        campaign_id: metaCampaignId,
        adset_id: metaAdsetId,
        ad_id: metaAdId,
      },
      ad_copy: generatedCopy,
      chained_from_carousel: !!chainedCarousel,
      images_used: creative_urls?.length || 0,
    };

    // Mark workflow step complete if chained
    if (sId) {
      await supabaseAdmin.from("workflow_steps").update({
        status: "done",
        completed_at: new Date().toISOString(),
        output: result,
      }).eq("id", sId);
    }

    if (wfId) {
      await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/orchestrator`, {
        method: "POST",
        headers: { Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`, "Content-Type": "application/json" },
        body: JSON.stringify({ workflowId: wfId, completedStepId: sId }),
      }).catch((e) => console.error("Chain error:", e));
    }

    return new Response(JSON.stringify(result),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e: any) {
    console.error("agent-media-buyer error:", e);

    // Try to save error to campaign if user_id available
    try {
      const body = await req.clone().json().catch(() => ({}));
      if (body.user_id && body.campaign_name) {
        await supabaseAdmin.from("ad_campaigns").insert({
          user_id: body.user_id,
          campaign_name: body.campaign_name || "Failed Campaign",
          status: "error",
          error_message: e.message,
        });
      }
    } catch {}

    return new Response(
      JSON.stringify({ error: e.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
