import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import type { NicheMagazine, NicheMagazineSection } from "@/data/nicheMagazinePages";

interface Props {
  section: NicheMagazineSection;
  magazine: NicheMagazine;
}

export default function NichePipeline({ section, magazine }: Props) {
  return (
    <section className="py-20 border-b border-white/5">
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
  );
}
