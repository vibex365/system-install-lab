import { useEffect } from "react";

interface SEOOptions {
  title: string;
  description: string;
  canonical?: string;
  ogImage?: string;
  ogType?: "website" | "article";
  noIndex?: boolean;
  jsonLd?: object;
}

const SITE_NAME = "PFSW — People Fail, Systems Work";
const SITE_URL = "https://system-install-lab.lovable.app";
const DEFAULT_OG_IMAGE =
  "https://storage.googleapis.com/gpt-engineer-file-uploads/nUTmFuH9giZitS0bvQQb0LPAA0j1/social-images/social-1771457292534-Untitled_design.webp";

export function useSEO({
  title,
  description,
  canonical,
  ogImage = DEFAULT_OG_IMAGE,
  ogType = "website",
  noIndex = false,
  jsonLd,
}: SEOOptions) {
  useEffect(() => {
    // Title
    const fullTitle = title === SITE_NAME ? title : `${title} | PFSW`;
    document.title = fullTitle;

    const setMeta = (selector: string, content: string) => {
      let el = document.querySelector(selector) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement("meta");
        // Detect attribute type
        if (selector.includes('name=')) {
          el.setAttribute("name", selector.match(/name="([^"]+)"/)?.[1] || "");
        } else if (selector.includes('property=')) {
          el.setAttribute("property", selector.match(/property="([^"]+)"/)?.[1] || "");
        }
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };

    const setLink = (rel: string, href: string) => {
      let el = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
      if (!el) {
        el = document.createElement("link");
        el.setAttribute("rel", rel);
        document.head.appendChild(el);
      }
      el.setAttribute("href", href);
    };

    setMeta('meta[name="description"]', description);
    setMeta('meta[name="robots"]', noIndex ? "noindex,nofollow" : "index,follow");

    // Open Graph
    setMeta('meta[property="og:title"]', fullTitle);
    setMeta('meta[property="og:description"]', description);
    setMeta('meta[property="og:type"]', ogType);
    setMeta('meta[property="og:image"]', ogImage);
    setMeta('meta[property="og:url"]', canonical || `${SITE_URL}${window.location.pathname}`);
    setMeta('meta[property="og:site_name"]', SITE_NAME);

    // Twitter / X
    setMeta('meta[name="twitter:card"]', "summary_large_image");
    setMeta('meta[name="twitter:title"]', fullTitle);
    setMeta('meta[name="twitter:description"]', description);
    setMeta('meta[name="twitter:image"]', ogImage);

    // Canonical
    setLink("canonical", canonical || `${SITE_URL}${window.location.pathname}`);

    // JSON-LD
    if (jsonLd) {
      const existingScript = document.querySelector('script[data-seo="true"]');
      if (existingScript) existingScript.remove();
      const script = document.createElement("script");
      script.type = "application/ld+json";
      script.setAttribute("data-seo", "true");
      script.textContent = JSON.stringify(jsonLd);
      document.head.appendChild(script);
    }

    return () => {
      // Cleanup JSON-LD on unmount
      if (jsonLd) {
        document.querySelector('script[data-seo="true"]')?.remove();
      }
    };
  }, [title, description, canonical, ogImage, ogType, noIndex, jsonLd]);
}
