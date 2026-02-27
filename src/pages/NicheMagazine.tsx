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

const ICON_MAP: Record<string, any> = {
  Search, Filter, Send, Calendar, Phone,
};

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
        <div className="max-w-4xl mx-auto px-6 h-12 flex items-center justify-between">
          <span className="text-[11px] tracking-[0.2em] uppercase text-white/40 font-medium">
            PFSW — {magazine.display_name}
          </span>
          <Button size="sm" className="h-7 text-[11px] px-3 rounded-full" style={{ background: magazine.color }} asChild>
            <a href={`${DOMAIN}/intake-funnel`}>Take the Assessment</a>
          </Button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6">
        {/* ─── HERO ─── */}
        <section className="pt-28 pb-20 border-b border-white/5">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <Badge className="mb-6 text-[10px] tracking-widest uppercase border-white/10 bg-white/5 text-white/50">
              {magazine.display_name} Edition
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold leading-[1.1] tracking-tight mb-6">
              {magazine.sections[0]?.title}
            </h1>
            <p className="text-lg text-white/50 max-w-2xl leading-relaxed mb-10">
              {magazine.sections[0]?.subtitle}
            </p>

            {/* Hero Stat */}
            <div className="flex items-end gap-4 border-l-2 pl-6" style={{ borderColor: magazine.color }}>
              <span className="text-6xl font-black" style={{ color: magazine.color }}>
                {magazine.hero_stat}
              </span>
              <p className="text-sm text-white/40 max-w-xs leading-snug pb-2">
                {magazine.hero_stat_label}
              </p>
            </div>
          </motion.div>
        </section>

        {/* ─── BEFORE / AFTER ─── */}
        {magazine.sections.filter(s => s.type === "before_after").map((section, i) => (
          <section key={i} className="py-20 border-b border-white/5">
            <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
              <h2 className="text-2xl font-bold mb-12 text-center">{section.title}</h2>
              <div className="grid md:grid-cols-2 gap-8">
                {/* BEFORE */}
                <div className="p-6 rounded-2xl border border-red-500/20 bg-red-500/5">
                  <div className="flex items-center gap-2 mb-5">
                    <XCircle className="size-5 text-red-400" />
                    <h3 className="text-base font-semibold text-red-400">{section.before?.title}</h3>
                  </div>
                  <ul className="space-y-3">
                    {section.before?.points.map((p, j) => (
                      <li key={j} className="flex items-start gap-3 text-sm text-white/60">
                        <span className="text-red-400/60 mt-0.5">—</span>
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* AFTER */}
                <div className="p-6 rounded-2xl border bg-opacity-5" style={{ borderColor: `${magazine.color}33`, background: `${magazine.color}0D` }}>
                  <div className="flex items-center gap-2 mb-5">
                    <CheckCircle2 className="size-5" style={{ color: magazine.color }} />
                    <h3 className="text-base font-semibold" style={{ color: magazine.color }}>{section.after?.title}</h3>
                  </div>
                  <ul className="space-y-3">
                    {section.after?.points.map((p, j) => (
                      <li key={j} className="flex items-start gap-3 text-sm text-white/80">
                        <CheckCircle2 className="size-3.5 mt-1 shrink-0" style={{ color: magazine.color }} />
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>
          </section>
        ))}

        {/* ─── AGENT STACK ─── */}
        {magazine.sections.filter(s => s.type === "agent_stack").map((section, i) => (
          <section key={i} className="py-20 border-b border-white/5">
            <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
              <h2 className="text-2xl font-bold mb-2">{section.title}</h2>
              <p className="text-sm text-white/40 mb-10">{section.subtitle}</p>

              <div className="space-y-4">
                {section.agents?.map((agent, j) => {
                  const Icon = ICON_MAP[agent.icon] || Zap;
                  return (
                    <motion.div
                      key={j}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: j * 0.1 }}
                      className="flex items-center gap-4 p-4 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
                    >
                      <div
                        className="size-10 rounded-lg flex items-center justify-center shrink-0"
                        style={{ background: `${magazine.color}15`, color: magazine.color }}
                      >
                        <Icon className="size-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white">{agent.name}</p>
                        <p className="text-xs text-white/40">{agent.action}</p>
                      </div>
                      <ChevronRight className="size-4 text-white/10 shrink-0" />
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          </section>
        ))}

        {/* ─── PIPELINE ─── */}
        {magazine.sections.filter(s => s.type === "pipeline").map((section, i) => (
          <section key={i} className="py-20 border-b border-white/5">
            <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
              <h2 className="text-2xl font-bold mb-10">{section.title}</h2>
              <div className="flex flex-wrap items-center gap-3">
                {section.stages?.map((stage, j) => (
                  <div key={j} className="flex items-center gap-3">
                    <div
                      className="px-4 py-2.5 rounded-lg border text-sm font-medium"
                      style={{
                        borderColor: `${magazine.color}33`,
                        background: j === (section.stages!.length - 1) ? `${magazine.color}20` : "transparent",
                        color: j === (section.stages!.length - 1) ? magazine.color : "rgba(255,255,255,0.7)",
                      }}
                    >
                      {stage}
                    </div>
                    {j < (section.stages!.length - 1) && (
                      <ArrowRight className="size-4 text-white/15" />
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          </section>
        ))}

        {/* ─── STATS ─── */}
        {magazine.sections.filter(s => s.type === "stats").map((section, i) => (
          <section key={i} className="py-20 border-b border-white/5">
            <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
              <div className="grid grid-cols-3 gap-6">
                {section.stats?.map((stat, j) => {
                  const icons = [Clock, BarChart3, Zap];
                  const StatIcon = icons[j % icons.length];
                  return (
                    <div key={j} className="text-center space-y-2 p-6 rounded-xl border border-white/5">
                      <StatIcon className="size-5 mx-auto" style={{ color: magazine.color }} />
                      <p className="text-3xl font-black" style={{ color: magazine.color }}>{stat.value}</p>
                      <p className="text-sm font-medium text-white/70">{stat.label}</p>
                      <p className="text-[11px] text-white/30">{stat.sub}</p>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </section>
        ))}

        {/* ─── CTA ─── */}
        {magazine.sections.filter(s => s.type === "cta").map((section, i) => (
          <section key={i} className="py-24">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center space-y-6"
            >
              <h2 className="text-3xl font-bold">{section.title}</h2>
              <p className="text-sm text-white/40 max-w-md mx-auto">{section.subtitle}</p>
              <Button
                size="lg"
                className="rounded-full text-sm px-8 gap-2"
                style={{ background: magazine.color }}
                asChild
              >
                <a href={`${DOMAIN}/intake-funnel`}>
                  Take the Assessment <ArrowRight className="size-4" />
                </a>
              </Button>
              <p className="text-[10px] text-white/20 tracking-widest uppercase">People Fail. Systems Work.</p>
            </motion.div>
          </section>
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
