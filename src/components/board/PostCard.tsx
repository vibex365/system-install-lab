import { Link } from "react-router-dom";
import { MessageSquare, ArrowUp, Pin, Lock } from "lucide-react";
import { format } from "date-fns";

interface PostCardProps {
  id: string;
  title: string;
  authorName: string;
  tags: string[];
  voteCount: number;
  commentCount: number;
  createdAt: string;
  pinned: boolean;
  status: string;
}

export function PostCard({ id, title, authorName, tags, voteCount, commentCount, createdAt, pinned, status }: PostCardProps) {
  return (
    <Link
      to={`/post/${id}`}
      className="block rounded-lg border border-border bg-card p-4 hover:border-primary/30 transition-colors group"
    >
      <div className="flex items-start gap-3">
        <div className="flex flex-col items-center gap-1 pt-0.5 min-w-[2rem]">
          <ArrowUp className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
          <span className="text-xs font-semibold text-foreground">{voteCount}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {pinned && <Pin className="h-3 w-3 text-primary" />}
            {status === "locked" && <Lock className="h-3 w-3 text-muted-foreground" />}
            <h3 className="text-sm font-semibold text-foreground truncate">{title}</h3>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>{authorName}</span>
            <span>·</span>
            <span>{format(new Date(createdAt), "MMM d")}</span>
            <span>·</span>
            <span className="flex items-center gap-1">
              <MessageSquare className="h-3 w-3" /> {commentCount}
            </span>
          </div>
          {tags.length > 0 && (
            <div className="flex gap-1.5 mt-2 flex-wrap">
              {tags.map((tag) => (
                <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
