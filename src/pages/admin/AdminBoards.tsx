import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Lock, Unlock, Pin, Trash2, RotateCcw } from "lucide-react";

export default function AdminBoards() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [boards, setBoards] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [selectedBoard, setSelectedBoard] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchBoards = async () => {
    setLoading(true);
    const { data } = await supabase.from("boards").select("*").order("created_at");
    setBoards(data ?? []);
    if (data?.[0] && !selectedBoard) setSelectedBoard(data[0].id);
    setLoading(false);
  };

  const fetchPosts = async (boardId: string) => {
    const { data } = await supabase
      .from("posts")
      .select("*, author:profiles!posts_author_id_fkey(full_name, email)")
      .eq("board_id", boardId)
      .order("created_at", { ascending: false });
    setPosts(data ?? []);
  };

  useEffect(() => { fetchBoards(); }, []);
  useEffect(() => { if (selectedBoard) fetchPosts(selectedBoard); }, [selectedBoard]);

  const toggleBoardLock = async (board: any) => {
    const action = board.is_locked ? "unlock_board" : "lock_board";
    await supabase.from("boards").update({ is_locked: !board.is_locked }).eq("id", board.id);
    if (user) {
      await supabase.from("moderation_actions").insert({
        admin_id: user.id, action_type: action, target_type: "board", target_id: board.id,
      });
    }
    toast({ title: `Board ${board.is_locked ? "unlocked" : "locked"}` });
    fetchBoards();
  };

  const postAction = async (post: any, actionType: string, updates: Record<string, any>) => {
    await supabase.from("posts").update(updates).eq("id", post.id);
    if (user) {
      await supabase.from("moderation_actions").insert({
        admin_id: user.id, action_type: actionType, target_type: "post", target_id: post.id,
      });
    }
    toast({ title: actionType.replace("_", " ") });
    if (selectedBoard) fetchPosts(selectedBoard);
  };

  const currentBoard = boards.find((b) => b.id === selectedBoard);

  return (
    <AdminShell>
      <h1 className="text-xl font-bold text-foreground mb-4">Board Moderation</h1>

      {/* Board controls */}
      <div className="space-y-3 mb-6">
        {boards.map((b) => (
          <Card key={b.id} className={`bg-card border-border cursor-pointer ${selectedBoard === b.id ? "border-primary/30" : ""}`} onClick={() => setSelectedBoard(b.id)}>
            <CardContent className="p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {b.is_locked && <Lock className="h-3.5 w-3.5 text-muted-foreground" />}
                <span className="text-sm font-medium text-foreground">{b.name}</span>
                <span className="text-xs text-muted-foreground">/{b.slug}</span>
              </div>
              <Button size="sm" variant="ghost" className="text-xs h-7" onClick={(e) => { e.stopPropagation(); toggleBoardLock(b); }}>
                {b.is_locked ? <><Unlock className="h-3 w-3 mr-1" /> Unlock</> : <><Lock className="h-3 w-3 mr-1" /> Lock</>}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Posts in selected board */}
      {currentBoard && (
        <>
          <h2 className="text-sm font-semibold text-foreground mb-3">Posts in {currentBoard.name}</h2>
          <div className="rounded-lg border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left px-4 py-2 text-muted-foreground font-medium text-xs">Title</th>
                  <th className="text-left px-4 py-2 text-muted-foreground font-medium text-xs hidden sm:table-cell">Author</th>
                  <th className="text-left px-4 py-2 text-muted-foreground font-medium text-xs">Status</th>
                  <th className="text-left px-4 py-2 text-muted-foreground font-medium text-xs">Actions</th>
                </tr>
              </thead>
              <tbody>
                {posts.map((p) => (
                  <tr key={p.id} className="border-t border-border">
                    <td className="px-4 py-2 text-foreground">
                      {p.pinned && <Pin className="h-3 w-3 text-primary inline mr-1" />}
                      {p.title}
                    </td>
                    <td className="px-4 py-2 text-muted-foreground text-xs hidden sm:table-cell">{p.author?.email || "—"}</td>
                    <td className="px-4 py-2">
                      <span className={`text-xs ${p.status === "removed" ? "text-destructive" : p.status === "locked" ? "text-muted-foreground" : "text-foreground"}`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex gap-1">
                        {p.pinned
                          ? <Button size="sm" variant="ghost" className="text-xs h-6 px-1.5" onClick={() => postAction(p, "unpin_post", { pinned: false })}>Unpin</Button>
                          : <Button size="sm" variant="ghost" className="text-xs h-6 px-1.5" onClick={() => postAction(p, "pin_post", { pinned: true })}>Pin</Button>
                        }
                        {p.status === "locked"
                          ? <Button size="sm" variant="ghost" className="text-xs h-6 px-1.5" onClick={() => postAction(p, "unlock_post", { status: "active" })}>Unlock</Button>
                          : p.status === "active" && <Button size="sm" variant="ghost" className="text-xs h-6 px-1.5" onClick={() => postAction(p, "lock_post", { status: "locked" })}>Lock</Button>
                        }
                        {p.status === "removed"
                          ? <Button size="sm" variant="ghost" className="text-xs h-6 px-1.5" onClick={() => postAction(p, "restore_post", { status: "active" })}>Restore</Button>
                          : <Button size="sm" variant="ghost" className="text-xs h-6 px-1.5 text-destructive" onClick={() => postAction(p, "remove_post", { status: "removed" })}>Remove</Button>
                        }
                      </div>
                    </td>
                  </tr>
                ))}
                {posts.length === 0 && <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">No posts.</td></tr>}
              </tbody>
            </table>
          </div>
        </>
      )}
    </AdminShell>
  );
}
