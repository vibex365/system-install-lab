import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const LATE_API_BASE = "https://getlate.dev/api/v1";

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

    // Find approved posts scheduled for today that haven't been published
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

    let published = 0;
    const errors: string[] = [];

    for (const post of postsToPublish) {
      try {
        const payload: any = {
          text: post.content,
          platforms: post.platforms || ["facebook"],
        };

        // Include uploaded media if available
        if (post.media_urls?.length) {
          payload.mediaUrls = post.media_urls;
        }

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
          throw new Error(`Late.dev error [${resp.status}]: ${JSON.stringify(data)}`);
        }

        // Update post status
        await supabaseAdmin
          .from("social_posts")
          .update({
            status: "published",
            late_post_id: data.id || null,
          })
          .eq("id", post.id);

        published++;
      } catch (e: any) {
        console.error(`Failed to publish post ${post.id}:`, e.message);
        errors.push(`${post.id}: ${e.message}`);
      }

      // Small delay between posts
      if (postsToPublish.indexOf(post) < postsToPublish.length - 1) {
        await new Promise((r) => setTimeout(r, 500));
      }
    }

    // Send notification about published posts
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
