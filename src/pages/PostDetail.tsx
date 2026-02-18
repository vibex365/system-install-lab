import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { AuthGate } from "@/components/AuthGate";
import { VoteButton } from "@/components/board/VoteButton";
import { CommentThread } from "@/components/board/CommentThread";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ArrowLeft, Pin, Lock, Trash2, RotateCcw } from "lucide-react";

export default function PostDetail() {
  const { id } = useParams<{ id: string }>();
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [post, setPost] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [voteCount, setVoteCount] = useState(0);
  const [hasVoted, setHasVoted] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchPost = async () => {
    if (!id) return;
    const { data } = await supabase
      .from("posts")
      .select("*, author:profiles!posts_author_id_fkey(full_name, email), board:boards!posts_board_id_fkey(slug, name)")
      .eq("id", id)
      .single();
    setPost(data);
    return data;
  };

  const fetchComments = async () => {
    if (!id) return;
    const { data } = await supabase
      .from("comments")
      .select("*, author:profiles!comments_author_id_fkey(full_name, email)")
      .eq("post_id", id)
      .order("created_at", { ascending: true });
    setComments(data || []);
  };

  const fetchVotes = async () => {
    if (!id || !user) return;
    const { data: allVotes } = await supabase.from("votes").select("user_id").eq("post_id", id);
    setVoteCount(allVotes?.length || 0);
    setHasVoted(!!allVotes?.find((v) => v.user_id === user.id));
  };

  const load = async () => {
    setLoading(true);
    await Promise.all([fetchPost(), fetchComments(), fetchVotes()]);
    setLoading(false);
  };

  useEffect(() => { load(); }, [id, user]);

  const modAction = async (actionType: string, updates: Record<string, any>) => {
    if (!user || !post) return;
    await supabase.from("posts").update(updates).eq("id", post.id);
    await supabase.from("moderation_actions").insert({
      admin_id: user.id,
      action_type: actionType,
      target_type: "post",
      target_id: post.id,
    });
    toast({ title: `Post ${actionType.replace("_", " ")}` });
    load();
  };

  if (loading) {
    return (
      <AuthGate requireActive>
        <div className="min-h-screen bg-background">
          <Navbar />
          <div className="flex justify-center pt-32">
            <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        </div>
      </AuthGate>
    );
  }

  if (!post) {
    return (
      <AuthGate requireActive>
        <div className="min-h-screen bg-background">
          <Navbar />
          <div className="container max-w-3xl pt-32 text-center">
            <p className="text-muted-foreground">Post not found.</p>
            <Button asChild variant="ghost" size="sm" className="mt-4">
              <Link to="/board">Back to Board</Link>
            </Button>
          </div>
        </div>
      </AuthGate>
    );
  }

  const isLocked = post.status === "locked";
  const isRemoved = post.status === "removed";

  return (
    <AuthGate requireActive>
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-24 pb-20">
          <div className="container max-w-3xl">
            <Link to={`/board/${post.board?.slug || "main"}`} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-6">
              <ArrowLeft className="h-3 w-3" /> Back to {post.board?.name || "Board"}
            </Link>

            <div className="flex gap-4">
              <VoteButton postId={post.id} initialCount={voteCount} initialVoted={hasVoted} onVoteChange={fetchVotes} />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  {post.pinned && <Pin className="h-3.5 w-3.5 text-primary" />}
                  {isLocked && <Lock className="h-3.5 w-3.5 text-muted-foreground" />}
                  {isRemoved && <span className="text-xs text-destructive border border-destructive/30 rounded px-1.5 py-0.5">Removed</span>}
                  <h1 className="text-lg font-bold text-foreground">{post.title}</h1>
                </div>
                <p className="text-xs text-muted-foreground mb-4">
                  {post.author?.full_name || post.author?.email || "Unknown"} · {format(new Date(post.created_at), "MMM d, yyyy 'at' h:mm a")}
                </p>
                {post.tags?.length > 0 && (
                  <div className="flex gap-1.5 mb-4 flex-wrap">
                    {post.tags.map((tag: string) => (
                      <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{tag}</span>
                    ))}
                  </div>
                )}
                <div className="prose prose-invert prose-sm max-w-none text-foreground whitespace-pre-wrap mb-8 border-b border-border pb-6">
                  {post.body}
                </div>

                {/* Admin controls */}
                {isAdmin && (
                  <div className="flex flex-wrap gap-2 mb-6 border border-border rounded-lg p-3 bg-muted/30">
                    <span className="text-xs text-muted-foreground self-center mr-2">Admin:</span>
                    {post.pinned ? (
                      <Button size="sm" variant="ghost" className="text-xs h-7" onClick={() => modAction("unpin_post", { pinned: false })}>Unpin</Button>
                    ) : (
                      <Button size="sm" variant="ghost" className="text-xs h-7" onClick={() => modAction("pin_post", { pinned: true })}>
                        <Pin className="h-3 w-3 mr-1" /> Pin
                      </Button>
                    )}
                    {isLocked ? (
                      <Button size="sm" variant="ghost" className="text-xs h-7" onClick={() => modAction("unlock_post", { status: "active" })}>Unlock</Button>
                    ) : (
                      <Button size="sm" variant="ghost" className="text-xs h-7" onClick={() => modAction("lock_post", { status: "locked" })}>
                        <Lock className="h-3 w-3 mr-1" /> Lock
                      </Button>
                    )}
                    {isRemoved ? (
                      <Button size="sm" variant="ghost" className="text-xs h-7" onClick={() => modAction("restore_post", { status: "active" })}>
                        <RotateCcw className="h-3 w-3 mr-1" /> Restore
                      </Button>
                    ) : (
                      <Button size="sm" variant="ghost" className="text-xs h-7 text-destructive" onClick={() => modAction("remove_post", { status: "removed" })}>
                        <Trash2 className="h-3 w-3 mr-1" /> Remove
                      </Button>
                    )}
                  </div>
                )}

                <CommentThread
                  postId={post.id}
                  comments={comments}
                  disabled={isLocked || isRemoved}
                  isAdmin={isAdmin}
                  onRefresh={fetchComments}
                />
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </AuthGate>
  );
}
