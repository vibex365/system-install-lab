import { cn } from "@/lib/utils";

interface TagFilterProps {
  allTags: string[];
  selected: string[];
  onToggle: (tag: string) => void;
}

export function TagFilter({ allTags, selected, onToggle }: TagFilterProps) {
  if (allTags.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {allTags.map((tag) => (
        <button
          key={tag}
          onClick={() => onToggle(tag)}
          className={cn(
            "text-[11px] px-2 py-0.5 rounded-full border transition-colors",
            selected.includes(tag)
              ? "bg-primary/10 border-primary/30 text-primary"
              : "bg-muted border-border text-muted-foreground hover:text-foreground"
          )}
        >
          {tag}
        </button>
      ))}
    </div>
  );
}
