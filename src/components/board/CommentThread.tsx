import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Trash2 } from "lucide-react";

interface Comment {
  id: string;
  body: string;
  status: string;
  created_at: string;
  author: { full_name: string | null; email: string } | null;
  author_id: string;
}

interface CommentThreadProps {
  postId: string;
  comments: Comment[];
  disabled: boolean;
  isAdmin: boolean;
  onRefresh: () => void;
}

export function CommentThread({ postId, comments, disabled, isAdmin, onRefresh }: CommentThreadProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!user || !body.trim()) return;
    setSubmitting(true);
    const { error } = await supabase.from("comments").insert({
      post_id: postId,
      author_id: user.id,
      body: body.trim(),
    });
    setSubmitting(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    setBody("");
    onRefresh();
  };

  const removeComment = async (id: string) => {
    await supabase.from("comments").update({ status: "removed" }).eq("id", id);
    onRefresh();
  };

  const restoreComment = async (id: string) => {
    await supabase.from("comments").update({ status: "active" }).eq("id", id);
    onRefresh();
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-foreground">{comments.length} Comment{comments.length !== 1 ? "s" : ""}</h3>
      <div className="space-y-3">
        {comments.map((c) => (
          <div
            key={c.id}
            className={`rounded-lg border p-3 text-sm ${
              c.status === "removed" ? "border-destructive/30 bg-destructive/5 opacity-60" : "border-border bg-background"
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">
                {c.author?.full_name || c.author?.email || "Unknown"} · {format(new Date(c.created_at), "MMM d, h:mm a")}
                {c.status === "removed" && <span className="ml-2 text-destructive">[removed]</span>}
              </span>
              {isAdmin && (
                <div className="flex gap-1">
                  {c.status === "active" ? (
                    <button onClick={() => removeComment(c.id)} className="text-xs text-destructive hover:underline">Remove</button>
                  ) : (
                    <button onClick={() => restoreComment(c.id)} className="text-xs text-primary hover:underline">Restore</button>
                  )}
                </div>
              )}
            </div>
            <p className="text-foreground whitespace-pre-wrap">{c.body}</p>
          </div>
        ))}
      </div>
      {!disabled && (
        <div className="space-y-2 pt-2">
          <Textarea
            placeholder="Add a comment..."
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={3}
            className="bg-background border-border text-sm"
          />
          <Button size="sm" onClick={submit} disabled={submitting || !body.trim()}>
            {submitting ? "Posting..." : "Comment"}
          </Button>
        </div>
      )}
      {disabled && (
        <p className="text-xs text-muted-foreground">Comments are disabled on this post.</p>
      )}
    </div>
  );
}
