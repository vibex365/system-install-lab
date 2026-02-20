import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("FIRECRAWL_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "Firecrawl connector not linked. Connect it in Settings → Connectors." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { url } = await req.json();
    if (!url) {
      return new Response(
        JSON.stringify({ error: "URL is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Normalize URL
    let formattedUrl = url.trim();
    if (!formattedUrl.startsWith("http://") && !formattedUrl.startsWith("https://")) {
      formattedUrl = `https://${formattedUrl}`;
    }

    console.log("Scanning URL:", formattedUrl);

    const response = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: formattedUrl,
        formats: ["branding", "summary", "markdown"],
        onlyMainContent: true,
      }),
    });

    const raw = await response.json();

    if (!response.ok) {
      console.error("Firecrawl error:", raw);
      return new Response(
        JSON.stringify({ error: raw.error || `Firecrawl request failed (${response.status})` }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Normalise — Firecrawl v1 may nest under .data
    const d = raw.data || raw;
    const branding = d.branding || {};
    const colors = branding.colors || {};
    const fonts: string[] = (branding.fonts || []).map((f: any) =>
      typeof f === "string" ? f : f.family || ""
    ).filter(Boolean);

    const result = {
      siteName: d.metadata?.title || new URL(formattedUrl).hostname,
      summary: d.summary || "",
      pageContent: (d.markdown || "").slice(0, 3000),
      colors: {
        primary: colors.primary || "",
        secondary: colors.secondary || "",
        accent: colors.accent || "",
        background: colors.background || "",
        text: colors.textPrimary || colors.text || "",
      },
      fonts,
      logo: branding.images?.logo || branding.logo || null,
    };

    console.log("Scan result:", JSON.stringify(result).slice(0, 200));

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("scan-website error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Unexpected error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
