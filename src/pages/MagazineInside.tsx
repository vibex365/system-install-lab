import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { magazinePages } from "@/data/magazinePages";
import { ChevronLeft, ChevronRight, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSEO } from "@/hooks/use-seo";

const BlueDivider = () => (
  <div className="flex items-center justify-center py-8">
    <div className="h-px w-20 bg-gradient-to-r from-transparent via-primary to-transparent" />
  </div>
);

export default function MagazineInside() {
  useSEO({
    title: "The Prompt Engineer's Field Manual — PFSW",
    description: "Leaked system prompts from Cursor, Lovable, Windsurf, v0 & 30+ AI tools. Learn how to build automated systems with prompt engineering.",
    canonical: "https://peoplefailsystemswork.com/magazine/inside",
  });

  const { user } = useAuth();
  const [page, setPage] = useState(0);
  const current = magazinePages[page];
  const total = magazinePages.length;

  const go = (next: number) => {
    setPage(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Cover page — no navbar, no background image
  if (current.isCover) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <div className="relative z-10 text-center px-6 max-w-3xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key="cover"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
            >
              <p className="text-xs uppercase tracking-[0.5em] text-primary mb-8">
                PFSW — The Prompt Engineer's Field Manual
              </p>
              <h1 className="font-serif text-6xl sm:text-8xl font-bold text-foreground leading-none mb-6">
                System Prompts
                <br />
                <span className="bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">Decoded.</span>
              </h1>
              <div className="flex items-center justify-center my-8">
                <div className="h-px w-24 bg-gradient-to-r from-transparent via-primary to-transparent" />
              </div>
              <p className="text-xl sm:text-2xl font-serif text-muted-foreground italic mb-4">
                "30+ AI tool prompts. Leaked. Analyzed. Weaponized."
              </p>
              <p className="text-sm text-muted-foreground/60 tracking-widest uppercase mb-16">
                Cursor · Lovable · Windsurf · v0 · Claude · Replit & More
              </p>
              <Button
                onClick={() => go(1)}
                size="lg"
                className="bg-gradient-to-r from-primary to-violet-500 hover:from-primary/90 hover:to-violet-500/90 tracking-widest px-12 py-6 text-base font-bold uppercase border-0"
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
    <div className="min-h-screen bg-background">
      <main className="pt-12 pb-20">
        <div className="max-w-2xl mx-auto px-6">

          {/* Table of Contents */}
          <details className="mb-8 group">
            <summary className="text-xs uppercase tracking-[0.3em] text-primary cursor-pointer select-none hover:text-primary/80 transition-colors">
              Table of Contents
            </summary>
            <nav className="mt-4 space-y-1 border-l border-primary/20 pl-4">
              {magazinePages.map((p, i) => (
                <button
                  key={i}
                  onClick={() => go(i)}
                  className={`block text-left text-sm transition-colors w-full px-2 py-1.5 rounded-r-md ${
                    i === page
                      ? "text-primary font-medium bg-primary/5"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                >
                  {p.isCover ? (
                    <span className="font-medium">Cover</span>
                  ) : (
                    <>
                      <span className="text-[10px] text-muted-foreground mr-2">{String(p.pageNumber).padStart(2, "0")}</span>
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
              <p className="text-xs uppercase tracking-[0.3em] text-primary mb-4">{current.chapter}</p>

              <h1 className="font-serif text-4xl sm:text-5xl font-bold text-foreground leading-tight mb-3">
                {current.title}
              </h1>
              {current.subtitle && (
                <p className="text-muted-foreground leading-relaxed mb-2 text-lg">{current.subtitle}</p>
              )}

              {current.sections.map((s, i) => (
                <div key={i}>
                  <BlueDivider />
                  <section className="py-2">
                    {s.heading && (
                      <h2 className="font-serif text-2xl sm:text-3xl font-bold text-foreground mb-4">{s.heading}</h2>
                    )}
                    <p className="text-muted-foreground leading-relaxed">{s.body}</p>
                  </section>
                </div>
              ))}

              {/* Final page CTA — drive to quiz funnel */}
              {page === total - 1 && (
                <>
                  <BlueDivider />
                  <div className="text-center py-8">
                    <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-xs font-semibold px-4 py-2 rounded-full mb-6">
                      <Zap className="h-3.5 w-3.5" />
                      Ready to build?
                    </div>
                    <h3 className="text-2xl font-bold text-foreground mb-3">
                      Find Out Where You Stand
                    </h3>
                    <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                      Take the 2-minute Prompt Systems Quiz. Get your score, see where the gaps are, and discover how PFSW workflows can automate your execution.
                    </p>
                    <Button
                      asChild
                      size="lg"
                      className="bg-gradient-to-r from-primary to-violet-500 hover:from-primary/90 hover:to-violet-500/90 tracking-wide px-10 py-6 text-lg font-bold border-0"
                    >
                      <Link to="/intake-funnel">Take the Quiz →</Link>
                    </Button>
                    <p className="text-xs text-muted-foreground mt-4">Free · 2 minutes · No signup required</p>
                  </div>
                </>
              )}
            </motion.div>
          </AnimatePresence>

          <BlueDivider />

          {/* Pagination */}
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              disabled={page === 0}
              onClick={() => go(page - 1)}
              className="text-muted-foreground hover:text-foreground gap-1"
            >
              <ChevronLeft className="h-4 w-4" /> Previous
            </Button>

            <span className="text-xs text-muted-foreground tracking-wider">
              {current.isCover ? "Cover" : `${current.pageNumber} / ${total - 1}`}
            </span>

            <Button
              variant="ghost"
              size="sm"
              disabled={page === total - 1}
              onClick={() => go(page + 1)}
              className="text-muted-foreground hover:text-foreground gap-1"
            >
              Next <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <p className="text-center text-xs text-muted-foreground tracking-wide pt-8 pb-4">
            PFSW — The Prompt Engineer's Field Manual
          </p>
        </div>
      </main>
    </div>
  );
}
