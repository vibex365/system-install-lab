import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Plus } from "lucide-react";

const templates: Record<string, string> = {
  idea: "## Idea\n\n## System\n\n## Next Action\n",
  problem: "## Problem\n\n## Constraint\n\n## Plan\n",
  buildlog: "## Build Log\n\n## Metrics\n\n## Lesson\n\n## Next Sprint\n",
};

interface PostComposerModalProps {
  boardId: string;
  onCreated: () => void;
}

export function PostComposerModal({ boardId, onCreated }: PostComposerModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const applyTemplate = (key: string) => {
    if (key && templates[key]) setBody(templates[key]);
  };

  const submit = async () => {
    if (!user || !title.trim() || !body.trim()) return;
    setSubmitting(true);
    const tags = tagsInput.split(",").map((t) => t.trim()).filter(Boolean);
    const { error } = await supabase.from("posts").insert({
      board_id: boardId,
      author_id: user.id,
      title: title.trim(),
      body: body.trim(),
      tags,
    });
    setSubmitting(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Post created" });
    setTitle("");
    setBody("");
    setTagsInput("");
    setOpen(false);
    onCreated();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="tracking-wide">
          <Plus className="h-3.5 w-3.5 mr-1" /> New Post
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">New Post</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Input
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="bg-background border-border"
          />
          <div className="flex gap-2">
            <Select onValueChange={applyTemplate}>
              <SelectTrigger className="w-40 bg-background border-border text-sm">
                <SelectValue placeholder="Template" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="idea">Idea</SelectItem>
                <SelectItem value="problem">Problem</SelectItem>
                <SelectItem value="buildlog">Build Log</SelectItem>
              </SelectContent>
            </Select>
            <Input
              placeholder="Tags (comma-separated)"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              className="flex-1 bg-background border-border text-sm"
            />
          </div>
          <Textarea
            placeholder="Write your post (markdown supported)..."
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={10}
            className="bg-background border-border font-mono text-sm"
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={submit} disabled={submitting || !title.trim() || !body.trim()}>
              {submitting ? "Posting..." : "Post"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
