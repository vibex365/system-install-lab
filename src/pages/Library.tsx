import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { AuthGate } from "@/components/AuthGate";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { Search, BookOpen, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Library() {
  const navigate = useNavigate();
  const [packages, setPackages] = useState<any[]>([]);
  const [prompts, setPrompts] = useState<any[]>([]);
  const [selectedPkg, setSelectedPkg] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

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

  const filtered = prompts.filter((p) => {
    if (selectedPkg !== "all" && p.package?.slug !== selectedPkg) return false;
    if (search) {
      const q = search.toLowerCase();
      return p.title.toLowerCase().includes(q) || p.summary?.toLowerCase().includes(q) || p.tags?.some((t: string) => t.toLowerCase().includes(q));
    }
    return true;
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
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-sm font-semibold text-foreground">{p.title}</h3>
                            {p.complexity && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{p.complexity}</span>
                            )}
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary">{p.package?.name}</span>
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
                        <Button size="sm" variant="ghost" className="text-xs text-primary shrink-0" onClick={() => navigate("/engine")}>
                          Use <ArrowRight className="h-3 w-3 ml-1" />
                        </Button>
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
