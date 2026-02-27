import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { NicheMagazine, NicheMagazineSection } from "@/data/nicheMagazinePages";

interface Props {
  section: NicheMagazineSection;
  magazine: NicheMagazine;
  domain: string;
}

export default function NicheCTA({ section, magazine, domain }: Props) {
  return (
    <section className="py-24">
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
          <a href={`${domain}/intake-funnel`}>
            Take the Assessment <ArrowRight className="size-4" />
          </a>
        </Button>
        <p className="text-[10px] text-white/20 tracking-widest uppercase">People Fail. Systems Work.</p>
      </motion.div>
    </section>
  );
}
