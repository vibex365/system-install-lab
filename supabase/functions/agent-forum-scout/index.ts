const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ForumLead {
  title: string;
  url: string;
  platform: string;
  snippet: string;
  intent: string;
  urgency: number;
  suggested_reply: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { user_id, niche, location } = await req.json();
    if (!user_id) {
      return new Response(JSON.stringify({ error: "user_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
    if (!FIRECRAWL_API_KEY) {
      return new Response(JSON.stringify({ error: "Firecrawl not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Get user profile for niche and location
    let userNiche = niche || "business";
    let userLocation = location || "";

    if (!niche || !location) {
      const profileRes = await fetch(
        `${SUPABASE_URL}/rest/v1/profiles?id=eq.${user_id}&select=niche,target_location`,
        {
          headers: {
            apikey: SUPABASE_SERVICE_ROLE_KEY,
            Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          },
        }
      );
      const profiles = await profileRes.json();
      if (profiles?.[0]) {
        userNiche = niche || profiles[0].niche || "business";
        userLocation = location || profiles[0].target_location || "";
      }
    }

    console.log(`Forum scout: niche=${userNiche}, location=${userLocation}`);

    // Build search queries for different platforms
    const nicheQueries: Record<string, string[]> = {
      lawyer: [
        `"looking for a lawyer" OR "need an attorney" OR "anyone know a good lawyer"`,
        `"recommend a lawyer" OR "legal help needed" OR "need legal advice"`,
      ],
      fitness: [
        `"looking for a personal trainer" OR "need a trainer" OR "recommend a gym"`,
        `"personal training recommendations" OR "best trainer near" OR "fitness coach"`,
      ],
      real_estate: [
        `"looking for a realtor" OR "need a real estate agent" OR "recommend a realtor"`,
        `"selling my home" OR "buying a house" OR "real estate agent recommendations"`,
      ],
      dentist: [
        `"looking for a dentist" OR "need a dentist" OR "recommend a dentist"`,
        `"dentist recommendations" OR "good dentist near" OR "dental office"`,
      ],
    };

    const baseQueries = nicheQueries[userNiche] || [
      `"looking for a ${userNiche}" OR "need a ${userNiche}" OR "recommend a ${userNiche}"`,
    ];

    const sites = ["site:reddit.com", "site:facebook.com", "site:nextdoor.com"];
    const allResults: any[] = [];

    // Search each site with each query
    for (const site of sites) {
      for (const baseQuery of baseQueries) {
        const query = `${baseQuery} ${site}${userLocation ? ` ${userLocation}` : ""}`;
        console.log(`Searching: ${query}`);

        try {
          const searchRes = await fetch("https://api.firecrawl.dev/v1/search", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              query,
              limit: 5,
              tbs: "qdr:m", // Last month
            }),
          });

          const searchData = await searchRes.json();
          if (searchData?.data) {
            allResults.push(
              ...searchData.data.map((r: any) => ({
                ...r,
                search_site: site.replace("site:", ""),
              }))
            );
          }
        } catch (e) {
          console.error(`Search failed for ${site}:`, e);
        }
      }
    }

    if (allResults.length === 0) {
      return new Response(
        JSON.stringify({ success: true, count: 0, leads: [], message: "No forum posts found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Deduplicate by URL
    const seen = new Set<string>();
    const unique = allResults.filter((r) => {
      if (!r.url || seen.has(r.url)) return false;
      seen.add(r.url);
      return true;
    });

    console.log(`Found ${unique.length} unique results, sending to AI for analysis`);

    // Use AI to extract structured leads and generate reply templates
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiPrompt = `You are analyzing forum posts to find potential clients for a ${userNiche} professional${userLocation ? ` in ${userLocation}` : ""}.

For each post below, extract:
1. A short title (the person's need)
2. The platform (reddit, facebook, nextdoor, or forum)
3. A one-line summary of their intent
4. An urgency score 1-10
5. A natural, helpful reply template they can copy-paste (NOT salesy, be genuinely helpful, mention you're a local ${userNiche} professional, offer to help)

Posts to analyze:
${unique
  .slice(0, 15)
  .map(
    (r, i) =>
      `[${i + 1}] URL: ${r.url}\nTitle: ${r.title || "N/A"}\nSnippet: ${r.description || r.markdown?.slice(0, 300) || "N/A"}\nSource: ${r.search_site}`
  )
  .join("\n\n")}

Return valid JSON array only, no markdown. Each item: { "title": "...", "url": "...", "platform": "...", "snippet": "...", "intent": "...", "urgency": N, "suggested_reply": "..." }
Only include posts that are genuinely from people looking for a ${userNiche} professional. Skip irrelevant results.`;

    const aiRes = await fetch("https://ai.lovable.dev/api/chat", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: aiPrompt }],
        temperature: 0.3,
      }),
    });

    const aiData = await aiRes.json();
    const aiText = aiData?.choices?.[0]?.message?.content || "[]";

    // Parse AI response
    let leads: ForumLead[] = [];
    try {
      const cleaned = aiText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      leads = JSON.parse(cleaned);
    } catch (e) {
      console.error("Failed to parse AI response:", aiText);
      leads = [];
    }

    console.log(`AI extracted ${leads.length} qualified leads`);

    // Insert into leads table
    let insertedCount = 0;
    const insertedLeads: any[] = [];

    for (const lead of leads) {
      // Check for duplicate by forum_post_url
      const checkRes = await fetch(
        `${SUPABASE_URL}/rest/v1/leads?user_id=eq.${user_id}&forum_post_url=eq.${encodeURIComponent(lead.url)}&select=id`,
        {
          headers: {
            apikey: SUPABASE_SERVICE_ROLE_KEY,
            Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          },
        }
      );
      const existing = await checkRes.json();
      if (existing?.length > 0) {
        console.log(`Skipping duplicate: ${lead.url}`);
        continue;
      }

      const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/leads`, {
        method: "POST",
        headers: {
          apikey: SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          "Content-Type": "application/json",
          Prefer: "return=representation",
        },
        body: JSON.stringify({
          user_id,
          business_name: lead.title,
          source: "forum_scout",
          pipeline_status: "scraped",
          category: userNiche,
          city: userLocation || null,
          website: lead.url,
          forum_post_url: lead.url,
          suggested_reply: lead.suggested_reply,
          notes: `[${lead.platform}] ${lead.intent} (urgency: ${lead.urgency}/10)\n\nSnippet: ${lead.snippet}`,
        }),
      });

      if (insertRes.ok) {
        const inserted = await insertRes.json();
        insertedCount++;
        insertedLeads.push({
          ...lead,
          id: inserted?.[0]?.id,
        });
      } else {
        const errText = await insertRes.text();
        console.error(`Insert failed:`, errText);
      }
    }

    console.log(`Inserted ${insertedCount} new forum leads`);

    return new Response(
      JSON.stringify({
        success: true,
        count: insertedCount,
        leads: insertedLeads,
        total_searched: unique.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Forum scout error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
