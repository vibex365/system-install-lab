import { useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Send, Sparkles, Loader2, Calendar, Image, CheckCircle2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

const PLATFORMS = [
  { id: "facebook", label: "Facebook", color: "bg-blue-600" },
  { id: "instagram", label: "Instagram", color: "bg-pink-600" },
  { id: "twitter", label: "Twitter / X", color: "bg-zinc-700" },
  { id: "linkedin", label: "LinkedIn", color: "bg-blue-800" },
  { id: "tiktok", label: "TikTok", color: "bg-zinc-900" },
  { id: "threads", label: "Threads", color: "bg-zinc-600" },
  { id: "reddit", label: "Reddit", color: "bg-orange-600" },
  { id: "youtube", label: "YouTube", color: "bg-red-600" },
];

export default function AdminSocialPoster() {
  const { toast } = useToast();
  const [content, setContent] = useState("");
  const [topic, setTopic] = useState("");
  const [tone, setTone] = useState("professional");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(["facebook"]);
  const [generating, setGenerating] = useState(false);
  const [posting, setPosting] = useState(false);
  const [lastResult, setLastResult] = useState<{ success: boolean; message: string } | null>(null);

  const { data: recentPosts, refetch } = useQuery({
    queryKey: ["social-posts"],
    queryFn: async () => {
      const { data } = await supabase
        .from("social_posts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);
      return data || [];
    },
  });

  const togglePlatform = (id: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const handleGenerate = async () => {
    if (!topic.trim()) {
      toast({ title: "Enter a topic first", variant: "destructive" });
      return;
    }
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("social-post", {
        body: { action: "generate", topic, tone, platforms: selectedPlatforms },
      });
      if (error) throw error;
      const text = data?.generated?.text || "";
      const hashtags = data?.generated?.hashtags || [];
      setContent(text + (hashtags.length ? "\n\n" + hashtags.map((h: string) => `#${h}`).join(" ") : ""));
      toast({ title: "Content generated!" });
    } catch (e: any) {
      toast({ title: "Generation failed", description: e.message, variant: "destructive" });
    }
    setGenerating(false);
  };

  const handlePost = async () => {
    if (!content.trim()) {
      toast({ title: "Write some content first", variant: "destructive" });
      return;
    }
    if (!selectedPlatforms.length) {
      toast({ title: "Select at least one platform", variant: "destructive" });
      return;
    }
    setPosting(true);
    setLastResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("social-post", {
        body: { action: "post", text: content, platforms: selectedPlatforms },
      });
      if (error) throw error;
      setLastResult({ success: true, message: "Posted successfully!" });
      setContent("");
      setTopic("");
      refetch();
      toast({ title: "Posted to " + selectedPlatforms.join(", ") + "!" });
    } catch (e: any) {
      setLastResult({ success: false, message: e.message });
      toast({ title: "Post failed", description: e.message, variant: "destructive" });
    }
    setPosting(false);
  };

  return (
    <AdminShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-foreground">Social Media Poster</h1>
          <p className="text-sm text-muted-foreground">AI-powered posting to 13+ platforms via Late.dev</p>
        </div>

        {/* Compose Card */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Send className="h-4 w-4 text-primary" />
              Compose Post
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* AI Generation */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">AI Topic (optional)</label>
              <div className="flex gap-2">
                <Input
                  placeholder="e.g. New feature launch, Client success story..."
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="flex-1"
                />
                <Select value={tone} onValueChange={setTone}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="casual">Casual</SelectItem>
                    <SelectItem value="hype">Hype / Bold</SelectItem>
                    <SelectItem value="educational">Educational</SelectItem>
                    <SelectItem value="storytelling">Storytelling</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={handleGenerate} disabled={generating} variant="secondary">
                  {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  <span className="ml-1 hidden sm:inline">Generate</span>
                </Button>
              </div>
            </div>

            {/* Content */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Post Content</label>
              <Textarea
                placeholder="Write your post or generate with AI above..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={5}
                className="resize-none"
              />
              <p className="text-[10px] text-muted-foreground text-right">{content.length} chars</p>
            </div>

            {/* Platform Selection */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Platforms</label>
              <div className="flex flex-wrap gap-2">
                {PLATFORMS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => togglePlatform(p.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      selectedPlatforms.includes(p.id)
                        ? `${p.color} text-white`
                        : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                    }`}
                  >
                    <Checkbox
                      checked={selectedPlatforms.includes(p.id)}
                      className="h-3 w-3 border-current"
                      onCheckedChange={() => togglePlatform(p.id)}
                    />
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Result Banner */}
            {lastResult && (
              <div
                className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
                  lastResult.success
                    ? "bg-green-500/10 text-green-400 border border-green-500/20"
                    : "bg-destructive/10 text-destructive border border-destructive/20"
                }`}
              >
                {lastResult.success ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                {lastResult.message}
              </div>
            )}

            {/* Post Button */}
            <Button onClick={handlePost} disabled={posting || !content.trim()} className="w-full">
              {posting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Posting...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Post to {selectedPlatforms.length} Platform{selectedPlatforms.length !== 1 ? "s" : ""}
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Recent Posts */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-base">Recent Posts</CardTitle>
          </CardHeader>
          <CardContent>
            {!recentPosts?.length ? (
              <p className="text-sm text-muted-foreground">No posts yet.</p>
            ) : (
              <div className="space-y-3">
                {recentPosts.map((post: any) => (
                  <div key={post.id} className="p-3 rounded-lg border border-border bg-secondary/30 space-y-2">
                    <p className="text-sm text-foreground line-clamp-2">{post.content}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      {(post.platforms || []).map((p: string) => (
                        <Badge key={p} variant="secondary" className="text-[10px]">
                          {p}
                        </Badge>
                      ))}
                      <Badge
                        variant={post.status === "published" ? "default" : "secondary"}
                        className="text-[10px]"
                      >
                        {post.status}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground ml-auto">
                        {new Date(post.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  );
}
