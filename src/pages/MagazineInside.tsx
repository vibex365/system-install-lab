import { useState } from "react";
import { Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { AuthGate } from "@/components/AuthGate";
import { Button } from "@/components/ui/button";
import { magazinePages } from "@/data/magazinePages";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const GoldDivider = () => (
  <div className="flex items-center justify-center py-8">
    <div className="h-px w-20 bg-gradient-to-r from-transparent via-primary to-transparent" />
  </div>
);

export default function MagazineInside() {
  const [page, setPage] = useState(0);
  const current = magazinePages[page];
  const total = magazinePages.length;

  const go = (next: number) => {
    setPage(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <AuthGate requireActive>
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-24 pb-20">
          <div className="max-w-2xl mx-auto px-6">

            {/* Table of Contents toggle */}
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
                    <span className="text-[10px] text-muted-foreground mr-2">{String(p.pageNumber).padStart(2, "0")}</span>
                    {p.title}
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
                {/* Chapter label */}
                <p className="text-xs uppercase tracking-[0.3em] text-primary mb-4">{current.chapter}</p>

                {/* Page title */}
                <h1 className="font-serif text-4xl sm:text-5xl font-bold text-foreground leading-tight mb-3">
                  {current.title}
                </h1>
                {current.subtitle && (
                  <p className="text-muted-foreground leading-relaxed mb-2 text-lg">{current.subtitle}</p>
                )}

                {/* Sections */}
                {current.sections.map((s, i) => (
                  <div key={i}>
                    <GoldDivider />
                    <section className="py-2">
                      {s.heading && (
                        <h2 className="font-serif text-2xl sm:text-3xl font-bold text-foreground mb-4">{s.heading}</h2>
                      )}
                      <p className="text-muted-foreground leading-relaxed">{s.body}</p>
                    </section>
                  </div>
                ))}

                {/* CTA on final page */}
                {page === total - 1 && (
                  <>
                    <GoldDivider />
                    <div className="text-center py-8">
                      <Button asChild size="lg" className="tracking-wide px-10 py-6 text-lg font-bold gold-glow-strong">
                        <Link to="/apply">Apply for Access</Link>
                      </Button>
                      <p className="text-xs text-muted-foreground mt-4">$5 application fee · Reviewed within 48 hours</p>
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
                className="text-muted-foreground hover:text-foreground gap-1"
              >
                <ChevronLeft className="h-4 w-4" /> Previous
              </Button>

              <span className="text-xs text-muted-foreground tracking-wider">
                {current.pageNumber} / {total}
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
              PFSW — Prompt Architecture Institution
            </p>
          </div>
        </main>
        <Footer />
      </div>
    </AuthGate>
  );
}
