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
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Fetch all active members with a niche set
    const profilesRes = await fetch(
      `${SUPABASE_URL}/rest/v1/profiles?member_status=eq.active&niche=not.is.null&select=id,niche,target_location`,
      {
        headers: {
          apikey: SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        },
      }
    );

    const profiles = await profilesRes.json();

    if (!profiles || profiles.length === 0) {
      console.log("No active users with niche configured");
      return new Response(
        JSON.stringify({ success: true, message: "No active users to scan", scanned: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Starting bulk forum scan for ${profiles.length} active users`);

    const results: { user_id: string; niche: string; status: string; count?: number; error?: string }[] = [];

    // Process each user sequentially to avoid rate limits
    for (const profile of profiles) {
      try {
        console.log(`Scanning for user ${profile.id} (${profile.niche})`);

        const scanRes = await fetch(
          `${SUPABASE_URL}/functions/v1/agent-forum-scout`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              user_id: profile.id,
              niche: profile.niche,
              location: profile.target_location,
            }),
          }
        );

        const scanData = await scanRes.json();

        if (scanData.success) {
          results.push({
            user_id: profile.id,
            niche: profile.niche,
            status: "success",
            count: scanData.count,
          });

          // Create notification if leads were found
          if (scanData.count > 0) {
            await fetch(`${SUPABASE_URL}/rest/v1/user_notifications`, {
              method: "POST",
              headers: {
                apikey: SUPABASE_SERVICE_ROLE_KEY,
                Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                user_id: profile.id,
                title: `Forum Scout: ${scanData.count} new lead${scanData.count > 1 ? "s" : ""} found`,
                body: `We found ${scanData.count} people asking for a ${profile.niche} professional in forums. Check your CRM for suggested reply templates.`,
                type: "agent_run",
              }),
            });
          }
        } else {
          results.push({
            user_id: profile.id,
            niche: profile.niche,
            status: "error",
            error: scanData.error,
          });
        }

        // Small delay between users to avoid rate limiting
        await new Promise((r) => setTimeout(r, 2000));
      } catch (e) {
        console.error(`Error scanning for user ${profile.id}:`, e);
        results.push({
          user_id: profile.id,
          niche: profile.niche,
          status: "error",
          error: e instanceof Error ? e.message : "Unknown error",
        });
      }
    }

    const successCount = results.filter((r) => r.status === "success").length;
    const totalLeads = results.reduce((sum, r) => sum + (r.count || 0), 0);

    console.log(`Bulk scan complete: ${successCount}/${profiles.length} users scanned, ${totalLeads} total leads found`);

    return new Response(
      JSON.stringify({
        success: true,
        users_scanned: profiles.length,
        users_successful: successCount,
        total_leads_found: totalLeads,
        results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Bulk forum scan error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
