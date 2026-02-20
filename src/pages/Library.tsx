import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { AuthGate } from "@/components/AuthGate";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { Search, BookOpen, ArrowRight, History, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";

export default function Library() {
  const navigate = useNavigate();
  const [packages, setPackages] = useState<any[]>([]);
  const [prompts, setPrompts] = useState<any[]>([]);
  const [selectedPkg, setSelectedPkg] = useState<string>("client-web");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "title">("newest");
  const [loading, setLoading] = useState(true);
  const [versions, setVersions] = useState<any[]>([]);
  const [versionsPromptId, setVersionsPromptId] = useState<string | null>(null);
  const [versionsLoading, setVersionsLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      const [pkgRes, promptRes] = await Promise.all([
        supabase.from("prompt_packages").select("*").order("name"),
        supabase.from("prompts").select("*, package:prompt_packages!prompts_package_id_fkey(name, slug)").eq("status", "approved").order("created_at", { ascending: false }),
      ]);
      setPackages(pkgRes.data || []);
      setPrompts(promptRes.data || []);
      setLoading(false);
    };
    load();
  }, []);

  const loadVersions = async (promptId: string) => {
    setVersionsPromptId(promptId);
    setVersionsLoading(true);
    const { data } = await supabase
      .from("prompt_versions")
      .select("*")
      .eq("prompt_id", promptId)
      .order("version", { ascending: false });
    setVersions(data || []);
    setVersionsLoading(false);
  };

  const filtered = prompts
    .filter((p) => {
      if (selectedPkg !== "all" && p.package?.slug !== selectedPkg) return false;
      if (search) {
        const q = search.toLowerCase();
        return p.title.toLowerCase().includes(q) || p.summary?.toLowerCase().includes(q) || p.tags?.some((t: string) => t.toLowerCase().includes(q));
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "title") return a.title.localeCompare(b.title);
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  return (
    <AuthGate requireActive>
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-24 pb-20">
          <div className="container max-w-4xl">
            <div className="flex items-center gap-2 mb-1">
              <BookOpen className="h-5 w-5 text-primary" />
              <h1 className="text-xl font-bold text-foreground">Prompt Library</h1>
            </div>
            <p className="text-sm text-muted-foreground mb-6">Curated, approved prompts ready for the Engine.</p>

            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <Select value={selectedPkg} onValueChange={setSelectedPkg}>
                <SelectTrigger className="w-40 bg-background border-border"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Packages</SelectItem>
                  {packages.map((p) => (
                    <SelectItem key={p.id} value={p.slug}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
                <SelectTrigger className="w-32 bg-background border-border"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="title">A–Z</SelectItem>
                </SelectContent>
              </Select>
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input placeholder="Search prompts..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8 bg-background border-border" />
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-20">
                <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filtered.length === 0 ? (
              <p className="text-center text-muted-foreground py-12">No prompts found.</p>
            ) : (
              <div className="space-y-3">
                {filtered.map((p) => (
                  <Card key={p.id} className="bg-card border-border hover:border-primary/30 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h3 className="text-sm font-semibold text-foreground">{p.title}</h3>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary">{p.package?.name}</span>
                            {p.complexity && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{p.complexity}</span>
                            )}
                            <span className="text-[10px] text-muted-foreground">v{p.version}</span>
                          </div>
                          {p.summary && <p className="text-xs text-muted-foreground mb-2">{p.summary}</p>}
                          {p.tags?.length > 0 && (
                            <div className="flex gap-1 flex-wrap">
                              {p.tags.map((t: string) => (
                                <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{t}</span>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button size="sm" variant="ghost" className="text-xs h-7" onClick={() => loadVersions(p.id)}>
                                <History className="h-3 w-3" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-lg bg-card border-border">
                              <DialogHeader>
                                <DialogTitle className="text-sm">Version History — {p.title}</DialogTitle>
                              </DialogHeader>
                              {versionsLoading ? (
                                <div className="flex justify-center py-8"><div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
                              ) : versions.length === 0 ? (
                                <p className="text-xs text-muted-foreground py-4">No version history.</p>
                              ) : (
                                <div className="space-y-3 max-h-80 overflow-y-auto">
                                  {versions.map((v) => (
                                    <div key={v.id} className="border border-border rounded p-3">
                                      <div className="flex items-center justify-between mb-1">
                                        <span className="text-xs font-semibold text-foreground">v{v.version}</span>
                                        <span className="text-[10px] text-muted-foreground">{format(new Date(v.created_at), "MMM d, yyyy")}</span>
                                      </div>
                                      {v.changelog && <p className="text-xs text-muted-foreground mb-2">{v.changelog}</p>}
                                      <p className="text-[10px] font-mono text-muted-foreground line-clamp-3">{v.prompt_text}</p>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
                          <Button size="sm" variant="ghost" className="text-xs text-primary h-7" onClick={() => navigate(`/engine?loadPrompt=${p.id}`)}>
                            Use <ArrowRight className="h-3 w-3 ml-1" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </main>
        <Footer />
      </div>
    </AuthGate>
  );
}
