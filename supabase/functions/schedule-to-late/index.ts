import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const LATE_API_BASE = "https://getlate.dev/api/v1";

async function fetchLateAccounts(apiKey: string) {
  const profilesResp = await fetch(`${LATE_API_BASE}/profiles`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  const profilesData = await profilesResp.json();
  const profiles = profilesData.profiles || [];
  if (!profiles.length) return { accounts: [], profileId: "" };

  const defaultProfile = profiles.find((p: any) => p.isDefault) || profiles[0];
  const profileId = defaultProfile._id || defaultProfile.id;

  const accountsResp = await fetch(`${LATE_API_BASE}/accounts?profileId=${profileId}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  const accountsData = await accountsResp.json();
  const accounts = accountsData.accounts || accountsData.data || (Array.isArray(accountsData) ? accountsData : []);
  return {
    profileId,
    accounts: accounts.map((a: any) => ({
      id: a._id || a.id,
      platform: (a.platform || a.type || "").toLowerCase(),
      username: a.username || a.name || "",
    })),
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: claimsErr } = await supabaseUser.auth.getClaims(token);
    if (claimsErr || !claims?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claims.claims.sub as string;

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verify chief_architect role
    const { data: isChief } = await supabaseAdmin.rpc("has_role", {
      _user_id: userId, _role: "chief_architect",
    });
    if (!isChief) {
      return new Response(JSON.stringify({ error: "Admin only" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LATE_API_KEY = Deno.env.get("LATE_API_KEY");
    if (!LATE_API_KEY) {
      return new Response(JSON.stringify({ error: "Late.dev API key not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { post_ids } = await req.json();
    if (!post_ids?.length) {
      return new Response(JSON.stringify({ error: "post_ids required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch posts
    const { data: postsToSchedule, error: fetchErr } = await supabaseAdmin
      .from("social_posts")
      .select("*")
      .in("id", post_ids);

    if (fetchErr) throw fetchErr;
    if (!postsToSchedule?.length) {
      return new Response(JSON.stringify({ error: "No posts found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch Late.dev accounts
    const { accounts, profileId } = await fetchLateAccounts(LATE_API_KEY);
    console.log("Late.dev accounts:", JSON.stringify(accounts));

    let scheduled = 0;
    const errors: string[] = [];

    for (const post of postsToSchedule) {
      try {
        const requestedPlatforms = (post.platforms || ["facebook"]).filter((p: string) => p !== "youtube");

        // Map platforms to Late.dev account IDs
        const platformEntries: { platform: string; accountId: string }[] = [];
        for (const p of requestedPlatforms) {
          const match = accounts.find((a: any) => a.platform === p.toLowerCase());
          if (match) platformEntries.push({ platform: match.platform, accountId: match.id });
        }

        if (!platformEntries.length) {
          throw new Error(`No Late.dev accounts for: ${requestedPlatforms.join(", ")}`);
        }

        // Resolve media URLs
        let mediaUrls = (post.media_urls || []).filter(Boolean);
        if (!mediaUrls.length && post.image_variant) {
          const { data: brandFiles } = await supabaseAdmin.storage
            .from("social-images").list("brand", { limit: 100 });
          const match = (brandFiles || []).find((f: any) => f.name.startsWith(post.image_variant));
          if (match) {
            const { data: urlData } = supabaseAdmin.storage.from("social-images").getPublicUrl(`brand/${match.name}`);
            mediaUrls = [urlData.publicUrl];
          } else {
            const { data: galleryFiles } = await supabaseAdmin.storage
              .from("social-images").list("gallery", { limit: 50 });
            if (galleryFiles?.length) {
              const randomFile = galleryFiles[Math.floor(Math.random() * galleryFiles.length)];
              const { data: urlData } = supabaseAdmin.storage.from("social-images").getPublicUrl(`gallery/${randomFile.name}`);
              mediaUrls = [urlData.publicUrl];
            }
          }
          // Persist resolved URLs
          if (mediaUrls.length) {
            await supabaseAdmin.from("social_posts").update({ media_urls: mediaUrls }).eq("id", post.id);
          }
        }

        // Build Late.dev payload — schedule for the post's scheduled_date at 10 AM ET
        const payload: any = {
          content: post.content,
          platforms: platformEntries,
        };

        if (post.scheduled_date) {
          // Schedule for 10:00 AM Eastern
          payload.scheduledAt = `${post.scheduled_date}T10:00:00-05:00`;
        }

        if (mediaUrls.length) {
          payload.mediaItems = mediaUrls.map((url: string) => ({ type: "image", url }));
        }

        console.log("Sending to Late.dev:", JSON.stringify(payload));

        const resp = await fetch(`${LATE_API_BASE}/posts`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LATE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        const data = await resp.json();

        if (!resp.ok) {
          if (resp.status === 409) {
            console.log(`Post ${post.id} duplicate (409), marking scheduled`);
            scheduled++;
            continue;
          }
          throw new Error(`Late.dev [${resp.status}]: ${JSON.stringify(data)}`);
        }

        // Update with Late post ID
        await supabaseAdmin.from("social_posts").update({
          late_post_id: data._id || data.id || null,
          status: "scheduled",
        }).eq("id", post.id);

        scheduled++;
      } catch (e: any) {
        console.error(`Failed to schedule post ${post.id}:`, e.message);
        errors.push(`${post.id}: ${e.message}`);
      }

      // Rate limit
      if (postsToSchedule.indexOf(post) < postsToSchedule.length - 1) {
        await new Promise((r) => setTimeout(r, 500));
      }
    }

    return new Response(JSON.stringify({ scheduled, errors: errors.length ? errors : undefined }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("schedule-to-late error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
