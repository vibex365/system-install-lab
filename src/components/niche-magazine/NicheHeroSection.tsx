import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import type { NicheMagazine } from "@/data/nicheMagazinePages";

interface Props {
  magazine: NicheMagazine;
}

export default function NicheHeroSection({ magazine }: Props) {
  return (
    <section className="pt-20 pb-0 border-b border-white/5">
      {/* Full-bleed hero image */}
      <motion.div
        initial={{ opacity: 0, scale: 1.05 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.2 }}
        className="relative w-full aspect-[16/7] rounded-2xl overflow-hidden mt-8 mb-12"
      >
        <img
          src={magazine.hero_image}
          alt={`${magazine.display_name} automation`}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12">
          <Badge className="mb-4 text-[10px] tracking-widest uppercase border-white/10 bg-black/60 text-white/60 backdrop-blur">
            {magazine.display_name} Edition
          </Badge>
          <h1 className="text-3xl md:text-5xl font-bold leading-[1.1] tracking-tight max-w-2xl">
            {magazine.sections[0]?.title}
          </h1>
        </div>
      </motion.div>

      {/* Subtitle + stat */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.3 }}
        className="pb-16"
      >
        <p className="text-lg text-white/50 max-w-2xl leading-relaxed mb-10">
          {magazine.sections[0]?.subtitle}
        </p>
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
  );
}
