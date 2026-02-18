import { useEffect, useState, useMemo } from "react";
import { useParams, Navigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { AuthGate } from "@/components/AuthGate";
import { PostCard } from "@/components/board/PostCard";
import { PostComposerModal } from "@/components/board/PostComposerModal";
import { TagFilter } from "@/components/board/TagFilter";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Search, Lock } from "lucide-react";

interface PostRow {
  id: string;
  title: string;
  body: string;
  tags: string[];
  status: string;
  pinned: boolean;
  created_at: string;
  author_id: string;
  board_id: string;
  author: { full_name: string | null; email: string } | null;
  vote_count: number;
  comment_count: number;
}

export default function BoardFeed() {
  const { slug } = useParams<{ slug: string }>();
  const boardSlug = slug || "main";
  const { user, isAdmin } = useAuth();
  const [board, setBoard] = useState<{ id: string; name: string; description: string | null; is_locked: boolean } | null>(null);
  const [posts, setPosts] = useState<PostRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"new" | "top" | "pinned">("new");
  const [search, setSearch] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const fetchBoard = async () => {
    const { data } = await supabase.from("boards").select("*").eq("slug", boardSlug).single();
    setBoard(data);
    return data;
  };

  const fetchPosts = async (boardId: string) => {
    // Fetch posts with author info
    const { data: postsData } = await supabase
      .from("posts")
      .select("*, author:profiles!posts_author_id_fkey(full_name, email)")
      .eq("board_id", boardId)
      .order("created_at", { ascending: false });

    if (!postsData) { setPosts([]); return; }

    // Fetch vote counts
    const postIds = postsData.map((p) => p.id);
    const { data: votesData } = await supabase.from("votes").select("post_id").in("post_id", postIds);
    const { data: commentsData } = await supabase.from("comments").select("post_id").eq("status", "active").in("post_id", postIds);

    const voteCounts: Record<string, number> = {};
    const commentCounts: Record<string, number> = {};
    votesData?.forEach((v) => { voteCounts[v.post_id] = (voteCounts[v.post_id] || 0) + 1; });
    commentsData?.forEach((c) => { commentCounts[c.post_id] = (commentCounts[c.post_id] || 0) + 1; });

    setPosts(
      postsData.map((p) => ({
        ...p,
        author: p.author as any,
        vote_count: voteCounts[p.id] || 0,
        comment_count: commentCounts[p.id] || 0,
      }))
    );
  };

  const load = async () => {
    setLoading(true);
    const b = await fetchBoard();
    if (b) await fetchPosts(b.id);
    setLoading(false);
  };

  useEffect(() => { load(); }, [boardSlug]);

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    posts.forEach((p) => p.tags.forEach((t) => tags.add(t)));
    return Array.from(tags).sort();
  }, [posts]);

  const filtered = useMemo(() => {
    let result = [...posts];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((p) => p.title.toLowerCase().includes(q) || p.body.toLowerCase().includes(q));
    }
    if (selectedTags.length > 0) {
      result = result.filter((p) => selectedTags.some((t) => p.tags.includes(t)));
    }
    if (tab === "top") result.sort((a, b) => b.vote_count - a.vote_count);
    if (tab === "pinned") result = result.filter((p) => p.pinned);
    if (tab === "new") result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    // Always show pinned first in non-pinned tabs
    if (tab !== "pinned") {
      result.sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));
    }
    return result;
  }, [posts, search, selectedTags, tab]);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]);
  };

  if (!boardSlug) return <Navigate to="/board/main" replace />;

  return (
    <AuthGate requireActive>
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-24 pb-20">
          <div className="container max-w-3xl">
            {loading ? (
              <div className="flex justify-center py-20">
                <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : !board ? (
              <p className="text-center text-muted-foreground py-20">Board not found.</p>
            ) : (
              <>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl font-bold text-foreground">{board.name}</h1>
                    {board.is_locked && <Lock className="h-4 w-4 text-muted-foreground" />}
                  </div>
                  {!board.is_locked && <PostComposerModal boardId={board.id} onCreated={load} />}
                </div>
                {board.description && <p className="text-sm text-muted-foreground mb-6">{board.description}</p>}

                <div className="flex flex-col sm:flex-row gap-3 mb-4">
                  <Tabs value={tab} onValueChange={(v) => setTab(v as any)} className="w-auto">
                    <TabsList className="h-8">
                      <TabsTrigger value="new" className="text-xs px-3 h-7">New</TabsTrigger>
                      <TabsTrigger value="top" className="text-xs px-3 h-7">Top</TabsTrigger>
                      <TabsTrigger value="pinned" className="text-xs px-3 h-7">Pinned</TabsTrigger>
                    </TabsList>
                  </Tabs>
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      placeholder="Search posts..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-8 h-8 bg-background border-border text-sm"
                    />
                  </div>
                </div>

                <TagFilter allTags={allTags} selected={selectedTags} onToggle={toggleTag} />

                <div className="mt-4 space-y-2">
                  {filtered.length === 0 ? (
                    <p className="text-center text-muted-foreground py-12 text-sm">No posts yet. Be the first.</p>
                  ) : (
                    filtered.map((p) => (
                      <PostCard
                        key={p.id}
                        id={p.id}
                        title={p.title}
                        authorName={p.author?.full_name || p.author?.email || "Unknown"}
                        tags={p.tags}
                        voteCount={p.vote_count}
                        commentCount={p.comment_count}
                        createdAt={p.created_at}
                        pinned={p.pinned}
                        status={p.status}
                      />
                    ))
                  )}
                </div>
              </>
            )}
          </div>
        </main>
        <Footer />
      </div>
    </AuthGate>
  );
}
