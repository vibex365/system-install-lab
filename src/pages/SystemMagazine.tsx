import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { systemMagazinePages } from "@/data/systemMagazinePages";
import { ChevronLeft, ChevronRight, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSEO } from "@/hooks/use-seo";

const GoldDivider = () => (
  <div className="flex items-center justify-center py-8">
    <div className="h-px w-20 bg-gradient-to-r from-transparent via-amber-400 to-transparent" />
  </div>
);

export default function SystemMagazine() {
  useSEO({
    title: "Inside the Machine — How the PFSW System Works",
    description: "A complete breakdown of the AI agents, intelligent workflows, voice system, and automation engine that powers PFSW.",
    canonical: "https://peoplefailsystemswork.com/magazine/system",
  });

  const [page, setPage] = useState(0);
  const current = systemMagazinePages[page];
  const total = systemMagazinePages.length;

  const go = (next: number) => {
    setPage(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Cover page
  if (current.isCover) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center">
        <div className="relative z-10 text-center px-6 max-w-3xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key="cover"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
            >
              <p className="text-xs uppercase tracking-[0.5em] text-amber-400 mb-8">
                PFSW — Technical Breakdown
              </p>
              <h1 className="font-serif text-6xl sm:text-8xl font-bold text-white leading-none mb-6">
                Inside the
                <br />
                <span className="bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">Machine.</span>
              </h1>
              <div className="flex items-center justify-center my-8">
                <div className="h-px w-24 bg-gradient-to-r from-transparent via-amber-400 to-transparent" />
              </div>
              <p className="text-xl sm:text-2xl font-serif text-neutral-400 italic mb-4">
                "AI Agents. Intelligent Workflows. Automated Revenue."
              </p>
              <p className="text-sm text-neutral-500 tracking-widest uppercase mb-16">
                Agents · Workflows · Voice · CRM · Funnels
              </p>
              <Button
                onClick={() => go(1)}
                size="lg"
                className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-500/90 hover:to-orange-600/90 text-black tracking-widest px-12 py-6 text-base font-bold uppercase border-0"
              >
                Begin Reading
              </Button>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <main className="pt-12 pb-20">
        <div className="max-w-2xl mx-auto px-6">

          {/* Table of Contents */}
          <details className="mb-8 group">
            <summary className="text-xs uppercase tracking-[0.3em] text-amber-400 cursor-pointer select-none hover:text-amber-300 transition-colors">
              Table of Contents
            </summary>
            <nav className="mt-4 space-y-1 border-l border-amber-400/20 pl-4">
              {systemMagazinePages.map((p, i) => (
                <button
                  key={i}
                  onClick={() => go(i)}
                  className={`block text-left text-sm transition-colors w-full px-2 py-1.5 rounded-r-md ${
                    i === page
                      ? "text-amber-400 font-medium bg-amber-400/5"
                      : "text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800/50"
                  }`}
                >
                  {p.isCover ? (
                    <span className="font-medium">Cover</span>
                  ) : (
                    <>
                      <span className="text-[10px] text-neutral-600 mr-2">{String(p.pageNumber).padStart(2, "0")}</span>
                      {p.title}
                    </>
                  )}
                </button>
              ))}
            </nav>
          </details>

          <AnimatePresence mode="wait">
            <motion.div
              key={page}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.35 }}
            >
              <p className="text-xs uppercase tracking-[0.3em] text-amber-400 mb-4">{current.chapter}</p>

              <h1 className="font-serif text-4xl sm:text-5xl font-bold text-white leading-tight mb-3">
                {current.title}
              </h1>
              {current.subtitle && (
                <p className="text-neutral-400 leading-relaxed mb-2 text-lg">{current.subtitle}</p>
              )}

              {current.sections.map((s, i) => (
                <div key={i}>
                  <GoldDivider />
                  <section className="py-2">
                    {s.heading && (
                      <h2 className="font-serif text-2xl sm:text-3xl font-bold text-white mb-4">{s.heading}</h2>
                    )}
                    <p className="text-neutral-400 leading-relaxed whitespace-pre-line">{s.body}</p>
                  </section>
                </div>
              ))}

              {/* Final page CTA */}
              {page === total - 1 && (
                <>
                  <GoldDivider />
                  <div className="text-center py-8">
                    <div className="inline-flex items-center gap-2 bg-amber-400/10 text-amber-400 text-xs font-semibold px-4 py-2 rounded-full mb-6">
                      <Zap className="h-3.5 w-3.5" />
                      Ready to see it in action?
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-3">
                      Find Out If This System Is Right For You
                    </h3>
                    <p className="text-neutral-400 mb-6 max-w-md mx-auto">
                      Take the 2-minute quiz. See your score. Get a live AI demo call that walks you through exactly how this system would work for your business.
                    </p>
                    <Button
                      asChild
                      size="lg"
                      className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-500/90 hover:to-orange-600/90 text-black tracking-wide px-10 py-6 text-lg font-bold border-0"
                    >
                      <Link to="/intake-funnel">Take the Quiz →</Link>
                    </Button>
                    <p className="text-xs text-neutral-600 mt-4">Free · 2 minutes · No signup required</p>
                  </div>
                </>
              )}
            </motion.div>
          </AnimatePresence>

          <GoldDivider />

          {/* Pagination */}
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              disabled={page === 0}
              onClick={() => go(page - 1)}
              className="text-neutral-500 hover:text-white gap-1"
            >
              <ChevronLeft className="h-4 w-4" /> Previous
            </Button>

            <span className="text-xs text-neutral-600 tracking-wider">
              {current.isCover ? "Cover" : `${current.pageNumber} / ${total - 1}`}
            </span>

            <Button
              variant="ghost"
              size="sm"
              disabled={page === total - 1}
              onClick={() => go(page + 1)}
              className="text-neutral-500 hover:text-white gap-1"
            >
              Next <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <p className="text-center text-xs text-neutral-600 tracking-wide pt-8 pb-4">
            PFSW — Inside the Machine
          </p>
        </div>
      </main>
    </div>
  );
}
