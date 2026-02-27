import { motion } from "framer-motion";
import { Search, Filter, Send, Calendar, Phone, Zap, ChevronRight } from "lucide-react";
import type { NicheMagazine, NicheMagazineSection } from "@/data/nicheMagazinePages";

const ICON_MAP: Record<string, any> = { Search, Filter, Send, Calendar, Phone };

interface Props {
  section: NicheMagazineSection;
  magazine: NicheMagazine;
}

export default function NicheAgentStack({ section, magazine }: Props) {
  return (
    <section className="py-20 border-b border-white/5">
      <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
        <h2 className="text-2xl font-bold mb-2">{section.title}</h2>
        <p className="text-sm text-white/40 mb-10">{section.subtitle}</p>

        {/* Agents illustration */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative w-full aspect-[16/7] rounded-2xl overflow-hidden mb-10 border border-white/5"
        >
          <img
            src={magazine.agents_image}
            alt={`${magazine.display_name} AI agents pipeline`}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30" />
          <div className="absolute bottom-4 left-6 right-6">
            <p className="text-[10px] tracking-widest uppercase text-white/30">
              Your 5 AI agents — working 24/7
            </p>
          </div>
        </motion.div>

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
  );
}
