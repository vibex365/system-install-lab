import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { NICHE_MAGAZINES } from "@/data/nicheMagazinePages";
import {
  Search, Filter, Send, Calendar, Phone, ArrowRight, ChevronRight,
  CheckCircle2, XCircle, Zap, BarChart3, Clock,
} from "lucide-react";
import { useSEO } from "@/hooks/use-seo";
import NicheHeroSection from "@/components/niche-magazine/NicheHeroSection";
import NicheBeforeAfter from "@/components/niche-magazine/NicheBeforeAfter";
import NicheAgentStack from "@/components/niche-magazine/NicheAgentStack";
import NichePipeline from "@/components/niche-magazine/NichePipeline";
import NicheStats from "@/components/niche-magazine/NicheStats";
import NicheCTA from "@/components/niche-magazine/NicheCTA";

const DOMAIN = "https://peoplefailsystemswork.com";

export default function NicheMagazine() {
  const { niche } = useParams<{ niche: string }>();
  const magazine = NICHE_MAGAZINES.find((m) => m.slug === niche);

  useSEO({
    title: magazine ? `PFSW for ${magazine.display_name} — Automated Growth System` : "PFSW Niche Solutions",
    description: magazine?.sections[0]?.subtitle || "See how PFSW automates your business pipeline.",
  });

  if (!magazine) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-white/60 text-sm">Magazine not found.</p>
          <Button variant="outline" asChild><Link to="/">Back to Home</Link></Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Minimal Top Bar */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-5xl mx-auto px-6 h-12 flex items-center justify-between">
          <span className="text-[11px] tracking-[0.2em] uppercase text-white/40 font-medium">
            PFSW — {magazine.display_name}
          </span>
          <Button size="sm" className="h-7 text-[11px] px-3 rounded-full" style={{ background: magazine.color }} asChild>
            <a href={`${DOMAIN}/intake-funnel`}>Take the Assessment</a>
          </Button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6">
        <NicheHeroSection magazine={magazine} />

        {magazine.sections.filter(s => s.type === "before_after").map((section, i) => (
          <NicheBeforeAfter key={i} section={section} magazine={magazine} />
        ))}

        {magazine.sections.filter(s => s.type === "agent_stack").map((section, i) => (
          <NicheAgentStack key={i} section={section} magazine={magazine} />
        ))}

        {magazine.sections.filter(s => s.type === "pipeline").map((section, i) => (
          <NichePipeline key={i} section={section} magazine={magazine} />
        ))}

        {magazine.sections.filter(s => s.type === "stats").map((section, i) => (
          <NicheStats key={i} section={section} magazine={magazine} />
        ))}

        {magazine.sections.filter(s => s.type === "cta").map((section, i) => (
          <NicheCTA key={i} section={section} magazine={magazine} domain={DOMAIN} />
        ))}
      </div>

      {/* Footer */}
      <div className="border-t border-white/5 py-8 text-center">
        <p className="text-[10px] text-white/20 tracking-widest uppercase">
          PFSW — Autonomous Growth Infrastructure — {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
