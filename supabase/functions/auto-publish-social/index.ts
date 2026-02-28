import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const LATE_API_BASE = "https://getlate.dev/api/v1";

// Helper: fetch connected accounts from Late.dev
async function fetchLateAccounts(apiKey: string) {
  const profilesResp = await fetch(`${LATE_API_BASE}/profiles`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  const profilesData = await profilesResp.json();
  const profiles = profilesData.profiles || [];
  if (!profiles.length) return [];

  const defaultProfile = profiles.find((p: any) => p.isDefault) || profiles[0];
  const profileId = defaultProfile._id || defaultProfile.id;

  const accountsResp = await fetch(`${LATE_API_BASE}/accounts?profileId=${profileId}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  const accountsData = await accountsResp.json();
  const accounts = accountsData.accounts || accountsData.data || (Array.isArray(accountsData) ? accountsData : []);
  return accounts.map((a: any) => ({
    id: a._id || a.id,
    platform: (a.platform || a.type || "").toLowerCase(),
    username: a.username || a.name || "",
    profileId,
  }));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    const LATE_API_KEY = Deno.env.get("LATE_API_KEY");
    if (!LATE_API_KEY) {
      return new Response(JSON.stringify({ error: "Late.dev API key not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const today = new Date().toISOString().split("T")[0];

    const { data: postsToPublish, error: fetchErr } = await supabaseAdmin
      .from("social_posts")
      .select("*")
      .eq("approval_status", "approved")
      .eq("scheduled_date", today)
      .neq("status", "published");

    if (fetchErr) throw fetchErr;

    if (!postsToPublish?.length) {
      return new Response(JSON.stringify({ message: "No posts to publish today", published: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch connected accounts once
    const accounts = await fetchLateAccounts(LATE_API_KEY);
    console.log("Late.dev connected accounts:", JSON.stringify(accounts));

    let published = 0;
    const errors: string[] = [];

    for (const post of postsToPublish) {
      try {
        const requestedPlatforms = post.platforms || ["facebook"];
        
        // Build platforms array for Late.dev
        const platformEntries: { platform: string; accountId: string }[] = [];
        for (const p of requestedPlatforms) {
          const match = accounts.find((a: any) => a.platform === p.toLowerCase());
          if (match) {
            platformEntries.push({ platform: match.platform, accountId: match.id });
          }
        }

        if (!platformEntries.length) {
          throw new Error(`No Late.dev accounts found for: ${requestedPlatforms.join(", ")}. Available: ${accounts.map((a: any) => a.platform).join(", ") || "none"}`);
        }

        // If post has image_variant but no media_urls, try to find a matching image in storage
        let mediaUrls = post.media_urls || [];
        if (!mediaUrls.length && post.image_variant) {
          // Look for a pre-uploaded brand image in storage
          const { data: brandFiles } = await supabaseAdmin.storage
            .from("social-images")
            .list("brand", { limit: 100 });
          const match = (brandFiles || []).find((f: any) => f.name.startsWith(post.image_variant));
          if (match) {
            const { data: urlData } = supabaseAdmin.storage.from("social-images").getPublicUrl(`brand/${match.name}`);
            mediaUrls = [urlData.publicUrl];
          } else {
            // Fallback: grab a random image from the gallery folder
            const { data: galleryFiles } = await supabaseAdmin.storage
              .from("social-images")
              .list("gallery", { limit: 50 });
            if (galleryFiles?.length) {
              const randomFile = galleryFiles[Math.floor(Math.random() * galleryFiles.length)];
              const { data: urlData } = supabaseAdmin.storage.from("social-images").getPublicUrl(`gallery/${randomFile.name}`);
              mediaUrls = [urlData.publicUrl];
            }
          }
        }

        const payload: any = {
          content: post.content,
          platforms: platformEntries,
        };
        if (mediaUrls.length) payload.mediaUrls = mediaUrls;

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
            console.log(`Post ${post.id} already published (409 duplicate), marking as published`);
            await supabaseAdmin.from("social_posts").update({ status: "published" }).eq("id", post.id);
            published++;
            continue;
          }
          throw new Error(`Late.dev error [${resp.status}]: ${JSON.stringify(data)}`);
        }

        await supabaseAdmin
          .from("social_posts")
          .update({
            status: "published",
            late_post_id: data._id || data.id || null,
          })
          .eq("id", post.id);

        published++;
      } catch (e: any) {
        console.error(`Failed to publish post ${post.id}:`, e.message);
        errors.push(`${post.id}: ${e.message}`);
      }

      if (postsToPublish.indexOf(post) < postsToPublish.length - 1) {
        await new Promise((r) => setTimeout(r, 500));
      }
    }

    if (published > 0) {
      const { data: adminRoles } = await supabaseAdmin
        .from("user_roles")
        .select("user_id")
        .eq("role", "chief_architect");

      for (const admin of adminRoles || []) {
        await supabaseAdmin.from("user_notifications").insert({
          user_id: admin.user_id,
          title: `${published} post${published > 1 ? "s" : ""} auto-published`,
          body: `${published} approved social post${published > 1 ? "s" : ""} went live today.${errors.length ? ` ${errors.length} failed.` : ""}`,
          type: "social_publish",
        });
      }
    }

    return new Response(JSON.stringify({
      message: `Published ${published} posts`,
      published,
      errors: errors.length ? errors : undefined,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("auto-publish-social error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
