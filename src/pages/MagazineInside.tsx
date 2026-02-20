import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { magazinePages } from "@/data/magazinePages";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import magazineCover from "@/assets/magazine-cover.jpg";

const GoldDivider = () => (
  <div className="flex items-center justify-center py-8">
    <div className="h-px w-20 bg-gradient-to-r from-transparent via-primary to-transparent" />
  </div>
);

export default function MagazineInside() {
  const { user, profile, isChiefArchitect, loading } = useAuth();
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const current = magazinePages[page];
  const total = magazinePages.length;

  useEffect(() => {
    if (loading) return;
    if (!user) { navigate("/login", { replace: true }); return; }
    const s = profile?.member_status as string;
    const allowed = s === "active" || s === "accepted_pending_payment" || isChiefArchitect;
    if (profile && !allowed) { navigate("/status", { replace: true }); return; }
  }, [user, profile, loading, isChiefArchitect, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  const go = (next: number) => {
    setPage(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Cover page rendering
  if (current.isCover) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main>
          <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
            {/* Cover image */}
            <img
              src={magazineCover}
              alt="PFSW Magazine Cover"
              className="absolute inset-0 w-full h-full object-cover"
            />
            {/* Dark overlay */}
            <div className="absolute inset-0 bg-black/75" />

            {/* Cover content */}
            <AnimatePresence mode="wait">
              <motion.div
                key="cover"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7 }}
                className="relative z-10 text-center px-6 max-w-3xl mx-auto"
              >
                <p className="text-xs uppercase tracking-[0.5em] text-primary mb-8">
                  PFSW — Prompt Architecture Institution
                </p>
                <h1 className="font-serif text-6xl sm:text-8xl font-bold text-white leading-none mb-6">
                  People Fail.
                  <br />
                  <span className="text-primary">Systems Work.</span>
                </h1>
                <div className="flex items-center justify-center my-8">
                  <div className="h-px w-24 bg-gradient-to-r from-transparent via-primary to-transparent" />
                </div>
                <p className="text-xl sm:text-2xl font-serif text-white/80 italic mb-4">
                  "No one is bigger than the program."
                </p>
                <p className="text-sm text-white/50 tracking-widest uppercase mb-16">
                  The Institutional Doctrine · Volume I
                </p>
                <Button
                  onClick={() => go(1)}
                  size="lg"
                  className="gold-glow-strong tracking-widest px-12 py-6 text-base font-bold uppercase"
                >
                  Begin Reading
                </Button>
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
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
                  {p.isCover ? (
                    <span className="font-medium">Cover — Manifesto</span>
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
              {/* Chapter label */}
              <p className="text-xs uppercase tracking-[0.3em] text-primary mb-4">{current.chapter}</p>

              {/* Editorial image */}
              {current.image && (
                <div className="relative w-full h-56 sm:h-72 mb-8 overflow-hidden rounded-lg">
                  <img
                    src={current.image}
                    alt={current.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent" />
                </div>
              )}

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
                      <Link to="/accepted">Activate My Membership</Link>
                    </Button>
                    <p className="text-xs text-muted-foreground mt-4">$197/month · Cohort assigned within 48 hours</p>
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
            PFSW — Prompt Architecture Institution
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
