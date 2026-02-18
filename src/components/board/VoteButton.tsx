import { useState } from "react";
import { ArrowUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

interface VoteButtonProps {
  postId: string;
  initialCount: number;
  initialVoted: boolean;
  onVoteChange?: () => void;
}

export function VoteButton({ postId, initialCount, initialVoted, onVoteChange }: VoteButtonProps) {
  const { user } = useAuth();
  const [voted, setVoted] = useState(initialVoted);
  const [count, setCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);

  const toggle = async () => {
    if (!user || loading) return;
    setLoading(true);
    if (voted) {
      await supabase.from("votes").delete().eq("post_id", postId).eq("user_id", user.id);
      setVoted(false);
      setCount((c) => c - 1);
    } else {
      await supabase.from("votes").insert({ post_id: postId, user_id: user.id });
      setVoted(true);
      setCount((c) => c + 1);
    }
    setLoading(false);
    onVoteChange?.();
  };

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={cn(
        "flex flex-col items-center gap-0.5 rounded-lg px-2 py-1.5 transition-colors",
        voted ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      <ArrowUp className="h-4 w-4" />
      <span className="text-xs font-semibold">{count}</span>
    </button>
  );
}
