import { motion } from "framer-motion";
import { CheckCircle2, XCircle } from "lucide-react";
import type { NicheMagazine, NicheMagazineSection } from "@/data/nicheMagazinePages";

interface Props {
  section: NicheMagazineSection;
  magazine: NicheMagazine;
}

export default function NicheBeforeAfter({ section, magazine }: Props) {
  return (
    <section className="py-20 border-b border-white/5">
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
  );
}
