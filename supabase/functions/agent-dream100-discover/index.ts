import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { user_id } = await req.json();
    if (!user_id) throw new Error("user_id is required");

    // Get user's niche and existing entries
    const { data: profile } = await supabase
      .from("profiles")
      .select("niche, target_location")
      .eq("id", user_id)
      .single();

    const niche = profile?.niche || "business coaching";
    const location = profile?.target_location || "";

    // Get existing names to avoid duplicates
    const { data: existing } = await supabase
      .from("dream_100")
      .select("name")
      .eq("user_id", user_id);

    const existingNames = new Set((existing || []).map((e: any) => e.name.toLowerCase()));

    // Use Firecrawl to search for niche influencers
    const firecrawlKey = Deno.env.get("FIRECRAWL_API_KEY");
    if (!firecrawlKey) throw new Error("Firecrawl not configured");

    const searchQueries = [
      `top ${niche} influencers on Instagram 2025`,
      `best ${niche} YouTubers to follow`,
      `${niche} thought leaders ${location}`.trim(),
    ];

    const allResults: any[] = [];

    for (const query of searchQueries) {
      try {
        const res = await fetch("https://api.firecrawl.dev/v1/search", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${firecrawlKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ query, limit: 5 }),
        });
        const data = await res.json();
        if (data.data) allResults.push(...data.data);
      } catch (e) {
        console.error("Search error for query:", query, e);
      }
    }

    if (allResults.length === 0) {
      return new Response(
        JSON.stringify({ success: true, count: 0, message: "No results found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use AI to extract structured influencer data from search results
    const resultsText = allResults
      .map((r: any) => `Title: ${r.title}\nURL: ${r.url}\nDescription: ${r.description || ""}`)
      .join("\n---\n");

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `Extract individual influencer/thought leader names from search results about ${niche}. Return a JSON array of objects with: name, platform (instagram/youtube/twitter/tiktok/linkedin/podcast/blog), url (if available), followers_estimate (number, rough estimate), reason (1 sentence why they're relevant). Only include real people/brands, not articles or listicle sites. Max 10 entries.`,
          },
          { role: "user", content: resultsText },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_influencers",
              description: "Extract influencer data from search results",
              parameters: {
                type: "object",
                properties: {
                  influencers: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        platform: { type: "string" },
                        url: { type: "string" },
                        followers_estimate: { type: "number" },
                        reason: { type: "string" },
                      },
                      required: ["name", "platform"],
                    },
                  },
                },
                required: ["influencers"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "extract_influencers" } },
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      throw new Error(`AI extraction failed: ${errText}`);
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("AI returned no tool call");

    const parsed = JSON.parse(toolCall.function.arguments);
    const influencers = parsed.influencers || [];

    // Filter out duplicates and insert
    const newEntries = influencers.filter(
      (i: any) => !existingNames.has(i.name.toLowerCase())
    );

    let insertedCount = 0;
    for (const inf of newEntries) {
      const { error } = await supabase.from("dream_100").insert({
        user_id,
        name: inf.name,
        platform: inf.platform || "instagram",
        url: inf.url || null,
        niche,
        followers_estimate: inf.followers_estimate || null,
        notes: inf.reason || null,
        status: "suggested",
        outreach_status: "not_started",
        ai_suggested: true,
      });
      if (!error) insertedCount++;
    }

    console.log(`Dream 100 discovery: found ${influencers.length}, inserted ${insertedCount} for user ${user_id}`);

    return new Response(
      JSON.stringify({ success: true, count: insertedCount }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("agent-dream100-discover error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
