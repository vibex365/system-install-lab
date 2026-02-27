import { motion } from "framer-motion";
import { Clock, BarChart3, Zap } from "lucide-react";
import type { NicheMagazine, NicheMagazineSection } from "@/data/nicheMagazinePages";

interface Props {
  section: NicheMagazineSection;
  magazine: NicheMagazine;
}

export default function NicheStats({ section, magazine }: Props) {
  const icons = [Clock, BarChart3, Zap];
  return (
    <section className="py-20 border-b border-white/5">
      <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
        <div className="grid grid-cols-3 gap-6">
          {section.stats?.map((stat, j) => {
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
  );
}
