import { useState, useMemo, useRef } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Send, Sparkles, Loader2, CalendarDays, CheckCircle2, AlertCircle,
  ChevronLeft, ChevronRight, Plus, Clock, Check, X, Eye, Zap, Bot,
  Upload, Trash2, Image as ImageIcon
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, getDay } from "date-fns";

import learnAiDark from "@/assets/social/learn-ai-dark.png";
import bottleneckDark from "@/assets/social/bottleneck-dark.png";
import replaceYourselfDark from "@/assets/social/replace-yourself-dark.png";
import fakeGuruDark from "@/assets/social/fake-guru-dark.png";
import fakeGuruYellow from "@/assets/social/fake-guru-yellow.png";
import replaceYourselfYellow from "@/assets/social/replace-yourself-yellow.png";
import bottleneckYellow from "@/assets/social/bottleneck-yellow.png";

const FB_GROUP_URL = "https://www.facebook.com/share/g/18ewsZUu7t/?mibextid=wwXIfr";
const QUIZ_FUNNEL_URL = "/systems-quiz";

const IMAGE_VARIANTS = [
  { id: "learn_ai_dark", label: "Learn AI (Dark)", src: learnAiDark },
  { id: "bottleneck_dark", label: "Bottleneck (Dark)", src: bottleneckDark },
  { id: "replace_yourself_dark", label: "Replace Yourself (Dark)", src: replaceYourselfDark },
  { id: "fake_guru_dark", label: "Fake Guru (Dark)", src: fakeGuruDark },
  { id: "fake_guru_yellow", label: "Fake Guru (Yellow)", src: fakeGuruYellow },
  { id: "replace_yourself_yellow", label: "Replace Yourself (Yellow)", src: replaceYourselfYellow },
  { id: "bottleneck_yellow", label: "Bottleneck (Yellow)", src: bottleneckYellow },
];

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
  const queryClient = useQueryClient();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [composerOpen, setComposerOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [previewPost, setPreviewPost] = useState<any>(null);
  const [autoGenerating, setAutoGenerating] = useState(false);

  // Composer state
  const [content, setContent] = useState("");
  const [topic, setTopic] = useState("");
  const [tone, setTone] = useState("professional");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(["facebook"]);
  const [imageVariant, setImageVariant] = useState("bottleneck_dark");
  const [includeQuizUrl, setIncludeQuizUrl] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [composerMediaUrls, setComposerMediaUrls] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const postFileInputRef = useRef<HTMLInputElement>(null);

  const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

  const handleUploadImages = async (files: FileList, postId?: string) => {
    setUploading(true);
    const urls: string[] = [];
    try {
      for (const file of Array.from(files)) {
        const ext = file.name.split(".").pop();
        const path = `${postId || "draft"}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error } = await supabase.storage
          .from("social-images")
          .upload(path, file, { upsert: true });
        if (error) throw error;
        const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/social-images/${path}`;
        urls.push(publicUrl);
      }

      if (postId) {
        // Update existing post's media_urls
        const existing = posts.find((p: any) => p.id === postId);
        const merged = [...(existing?.media_urls || []), ...urls];
        await supabase
          .from("social_posts")
          .update({ media_urls: merged } as any)
          .eq("id", postId);
        toast({ title: `${urls.length} image(s) uploaded` });
        refetch();
      } else {
        setComposerMediaUrls((prev) => [...prev, ...urls]);
        toast({ title: `${urls.length} image(s) added` });
      }
    } catch (e: any) {
      toast({ title: "Upload failed", description: e.message, variant: "destructive" });
    }
    setUploading(false);
  };

  const handleDeleteImage = async (postId: string, imageUrl: string) => {
    try {
      // Extract path from URL
      const pathMatch = imageUrl.match(/social-images\/(.+)$/);
      if (pathMatch) {
        await supabase.storage.from("social-images").remove([pathMatch[1]]);
      }
      const post = posts.find((p: any) => p.id === postId);
      const updated = (post?.media_urls || []).filter((u: string) => u !== imageUrl);
      await supabase
        .from("social_posts")
        .update({ media_urls: updated } as any)
        .eq("id", postId);
      toast({ title: "Image removed" });
      refetch();
      if (previewPost?.id === postId) {
        setPreviewPost({ ...previewPost, media_urls: updated });
      }
    } catch (e: any) {
      toast({ title: "Delete failed", description: e.message, variant: "destructive" });
    }
  };

  const handleAutoGenerate = async (days = 7) => {
    setAutoGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("auto-generate-social-calendar", {
        body: { days },
      });
      if (error) throw error;
      toast({ title: `Agent complete: ${data?.message || "Posts generated"}` });
      refetch();
    } catch (e: any) {
      toast({ title: "Auto-generate failed", description: e.message, variant: "destructive" });
    }
    setAutoGenerating(false);
  };

  const handleApproveAll = async () => {
    const pending = posts.filter((p: any) => (p as any).approval_status === "pending");
    if (!pending.length) return;
    const user = (await supabase.auth.getUser()).data.user;
    const { error } = await supabase
      .from("social_posts")
      .update({
        approval_status: "approved",
        approved_at: new Date().toISOString(),
        approved_by: user?.id,
        status: "scheduled",
      } as any)
      .in("id", pending.map((p: any) => p.id));
    if (!error) {
      toast({ title: `${pending.length} posts approved` });
      refetch();
    }
  };

  const { data: posts = [], refetch } = useQuery({
    queryKey: ["social-calendar-posts"],
    queryFn: async () => {
      const { data } = await supabase
        .from("social_posts")
        .select("*")
        .order("scheduled_date", { ascending: true });
      return data || [];
    },
  });

  const days = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const startDayOffset = getDay(startOfMonth(currentMonth));

  const getPostsForDay = (day: Date) =>
    posts.filter((p: any) => p.scheduled_date && isSameDay(new Date(p.scheduled_date + "T00:00:00"), day));

  const togglePlatform = (id: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const openComposer = (date?: Date) => {
    setSelectedDate(date || new Date());
    setContent("");
    setTopic("");
    setImageVariant("bottleneck_dark");
    setIncludeQuizUrl(false);
    setSelectedPlatforms(["facebook"]);
    setComposerMediaUrls([]);
    setComposerOpen(true);
  };

  const handleGenerate = async () => {
    if (!topic.trim()) {
      toast({ title: "Enter a topic first", variant: "destructive" });
      return;
    }
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("social-post", {
        body: {
          action: "generate",
          topic,
          tone,
          platforms: selectedPlatforms,
          includeGroupUrl: true,
          includeQuizUrl,
          fbGroupUrl: FB_GROUP_URL,
          quizFunnelUrl: `${window.location.origin}${QUIZ_FUNNEL_URL}`,
        },
      });
      if (error) throw error;
      const text = data?.generated?.text || "";
      const hashtags = data?.generated?.hashtags || [];
      let full = text;
      if (hashtags.length) full += "\n\n" + hashtags.map((h: string) => `#${h}`).join(" ");
      if (!full.includes(FB_GROUP_URL)) full += `\n\n${FB_GROUP_URL}`;
      if (includeQuizUrl && !full.includes(QUIZ_FUNNEL_URL)) {
        full += `\n\nTake the free quiz: ${window.location.origin}${QUIZ_FUNNEL_URL}`;
      }
      setContent(full);
      toast({ title: "Content generated" });
    } catch (e: any) {
      toast({ title: "Generation failed", description: e.message, variant: "destructive" });
    }
    setGenerating(false);
  };

  const handleSaveDraft = async () => {
    if (!content.trim() || !selectedDate) return;
    setSaving(true);
    try {
      let finalContent = content;
      if (!finalContent.includes(FB_GROUP_URL)) {
        finalContent += `\n\n${FB_GROUP_URL}`;
      }

      const { error } = await supabase.from("social_posts").insert({
        content: finalContent,
        platforms: selectedPlatforms,
        scheduled_date: format(selectedDate, "yyyy-MM-dd"),
        scheduled_for: null,
        approval_status: "pending",
        status: "draft",
        image_variant: imageVariant,
        include_quiz_url: includeQuizUrl,
        media_urls: composerMediaUrls,
        user_id: (await supabase.auth.getUser()).data.user?.id,
      } as any);
      if (error) throw error;
      toast({ title: "Post saved to calendar" });
      setComposerOpen(false);
      refetch();
    } catch (e: any) {
      toast({ title: "Save failed", description: e.message, variant: "destructive" });
    }
    setSaving(false);
  };

  const handleApprove = async (postId: string) => {
    const user = (await supabase.auth.getUser()).data.user;
    const { error } = await supabase
      .from("social_posts")
      .update({
        approval_status: "approved",
        approved_at: new Date().toISOString(),
        approved_by: user?.id,
        status: "scheduled",
      } as any)
      .eq("id", postId);
    if (error) {
      toast({ title: "Approval failed", variant: "destructive" });
    } else {
      toast({ title: "Post approved" });
      refetch();
    }
  };

  const handleReject = async (postId: string) => {
    const { error } = await supabase
      .from("social_posts")
      .update({ approval_status: "rejected", status: "draft" } as any)
      .eq("id", postId);
    if (!error) {
      toast({ title: "Post rejected" });
      refetch();
    }
  };

  const handlePublishNow = async (post: any) => {
    try {
      const { error } = await supabase.functions.invoke("social-post", {
        body: { action: "post", text: post.content, platforms: post.platforms },
      });
      if (error) throw error;
      await supabase
        .from("social_posts")
        .update({ status: "published", approval_status: "approved" } as any)
        .eq("id", post.id);
      toast({ title: "Published" });
      refetch();
    } catch (e: any) {
      toast({ title: "Publish failed", description: e.message, variant: "destructive" });
    }
  };

  const selectedVariantImg = IMAGE_VARIANTS.find((v) => v.id === imageVariant)?.src;
  const pendingCount = posts.filter((p: any) => (p as any).approval_status === "pending").length;

  return (
    <AdminShell>
      <div className="space-y-6">
        {/* Agent Automation Card */}
        <Card className="bg-card border-primary/20">
          <CardContent className="py-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Bot className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Social Agent Workflow</p>
                  <p className="text-xs text-muted-foreground">
                    Auto-generates posts weekly (Sun midnight) · You just approve
                  </p>
                </div>
              </div>
              <div className="flex gap-2 items-center">
                {pendingCount > 0 && (
                  <Button onClick={handleApproveAll} variant="outline" size="sm" className="text-xs">
                    <Check className="h-3 w-3 mr-1" /> Approve All ({pendingCount})
                  </Button>
                )}
                <Button
                  onClick={() => handleAutoGenerate(7)}
                  disabled={autoGenerating}
                  size="sm"
                  className="text-xs"
                >
                  {autoGenerating ? (
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  ) : (
                    <Zap className="h-3 w-3 mr-1" />
                  )}
                  {autoGenerating ? "Generating..." : "Generate Next 7 Days"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">Social Calendar</h1>
            <p className="text-sm text-muted-foreground">
              AI-generated posts with approval workflow
            </p>
          </div>
          <div className="flex gap-2">
            {pendingCount > 0 && (
              <Badge variant="destructive" className="text-xs">
                {pendingCount} pending approval
              </Badge>
            )}
            <Button onClick={() => openComposer()} size="sm">
              <Plus className="h-4 w-4 mr-1" /> New Post
            </Button>
          </div>
        </div>

        <Tabs defaultValue="calendar">
          <TabsList>
            <TabsTrigger value="calendar">Calendar</TabsTrigger>
            <TabsTrigger value="pending">
              Pending {pendingCount > 0 && `(${pendingCount})`}
            </TabsTrigger>
            <TabsTrigger value="all">All Posts</TabsTrigger>
          </TabsList>

          {/* Calendar View */}
          <TabsContent value="calendar">
            <Card className="bg-card border-border">
              <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
                <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <CardTitle className="text-base">{format(currentMonth, "MMMM yyyy")}</CardTitle>
                <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-7 gap-px">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                    <div key={d} className="text-center text-[10px] font-medium text-muted-foreground py-1">
                      {d}
                    </div>
                  ))}
                  {Array.from({ length: startDayOffset }).map((_, i) => (
                    <div key={`empty-${i}`} className="min-h-[80px]" />
                  ))}
                  {days.map((day) => {
                    const dayPosts = getPostsForDay(day);
                    const isToday = isSameDay(day, new Date());
                    return (
                      <div
                        key={day.toISOString()}
                        onClick={() => openComposer(day)}
                        className={`min-h-[80px] border border-border/50 rounded p-1 cursor-pointer hover:bg-secondary/50 transition-colors ${
                          isToday ? "bg-primary/5 border-primary/30" : ""
                        }`}
                      >
                        <span className={`text-[10px] font-medium ${isToday ? "text-primary" : "text-muted-foreground"}`}>
                          {format(day, "d")}
                        </span>
                        <div className="space-y-0.5 mt-0.5">
                          {dayPosts.slice(0, 3).map((p: any) => (
                            <div
                              key={p.id}
                              onClick={(e) => { e.stopPropagation(); setPreviewPost(p); }}
                              className={`text-[8px] px-1 py-0.5 rounded truncate cursor-pointer ${
                                (p as any).approval_status === "approved"
                                  ? "bg-green-500/20 text-green-400"
                                  : (p as any).approval_status === "rejected"
                                  ? "bg-destructive/20 text-destructive"
                                  : "bg-yellow-500/20 text-yellow-400"
                              }`}
                            >
                              {p.content?.slice(0, 20)}...
                            </div>
                          ))}
                          {dayPosts.length > 3 && (
                            <span className="text-[8px] text-muted-foreground">+{dayPosts.length - 3} more</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pending Approval */}
          <TabsContent value="pending">
            <div className="space-y-3">
              {posts.filter((p: any) => (p as any).approval_status === "pending").length === 0 && (
                <Card className="bg-card border-border">
                  <CardContent className="py-8 text-center text-muted-foreground text-sm">
                    No posts pending approval.
                  </CardContent>
                </Card>
              )}
              {posts
                .filter((p: any) => (p as any).approval_status === "pending")
                .map((post: any) => (
                  <PostApprovalCard
                    key={post.id}
                    post={post}
                    onApprove={() => handleApprove(post.id)}
                    onReject={() => handleReject(post.id)}
                    onPreview={() => setPreviewPost(post)}
                  />
                ))}
            </div>
          </TabsContent>

          {/* All Posts */}
          <TabsContent value="all">
            <div className="space-y-3">
              {posts.map((post: any) => (
                <Card key={post.id} className="bg-card border-border">
                  <CardContent className="py-3 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm text-foreground line-clamp-2 flex-1">{post.content}</p>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setPreviewPost(post)}>
                          <Eye className="h-3 w-3" />
                        </Button>
                        {(post as any).approval_status === "approved" && post.status !== "published" && (
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handlePublishNow(post)}>
                            <Send className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {(post.platforms || []).map((p: string) => (
                        <Badge key={p} variant="secondary" className="text-[10px]">{p}</Badge>
                      ))}
                      <ApprovalBadge status={(post as any).approval_status} />
                      {post.scheduled_date && (
                        <span className="text-[10px] text-muted-foreground ml-auto">
                          <CalendarDays className="h-3 w-3 inline mr-0.5" />
                          {post.scheduled_date}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Composer Dialog */}
        <Dialog open={composerOpen} onOpenChange={setComposerOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-primary" />
                Schedule Post — {selectedDate && format(selectedDate, "MMM d, yyyy")}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              {/* AI Generation */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">AI Topic</label>
                <div className="flex gap-2">
                  <Input
                    placeholder="e.g. Why systems beat hustle, Client success story..."
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="flex-1"
                  />
                  <Select value={tone} onValueChange={setTone}>
                    <SelectTrigger className="w-[130px]">
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
                  <Button onClick={handleGenerate} disabled={generating} variant="secondary" size="sm">
                    {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              {/* Content */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Post Content</label>
                <Textarea
                  placeholder="Write your post or generate with AI..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={5}
                  className="resize-none"
                />
                <p className="text-[10px] text-muted-foreground text-right">{content.length} chars</p>
              </div>

              {/* Image Variant */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Brand Image</label>
                <div className="grid grid-cols-4 gap-2">
                  {IMAGE_VARIANTS.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => setImageVariant(v.id)}
                      className={`rounded-lg overflow-hidden border-2 transition-all ${
                        imageVariant === v.id ? "border-primary" : "border-border/50 hover:border-border"
                      }`}
                    >
                      <img src={v.src} alt={v.label} className="w-full aspect-square object-cover" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Upload Images */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Post Images</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => e.target.files && handleUploadImages(e.target.files)}
                />
                <div className="flex flex-wrap gap-2">
                  {composerMediaUrls.map((url, i) => (
                    <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden border border-border group">
                      <img src={url} alt="" className="w-full h-full object-cover" />
                      <button
                        onClick={() => setComposerMediaUrls((prev) => prev.filter((_, idx) => idx !== i))}
                        className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                      >
                        <Trash2 className="h-4 w-4 text-white" />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="w-16 h-16 rounded-lg border-2 border-dashed border-border hover:border-primary/50 flex items-center justify-center transition-colors"
                  >
                    {uploading ? (
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    ) : (
                      <Upload className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>
                </div>
                <p className="text-[10px] text-muted-foreground">Upload images to attach to this post</p>
              </div>

              {/* Options Row */}
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                  <Checkbox
                    checked={includeQuizUrl}
                    onCheckedChange={(v) => setIncludeQuizUrl(!!v)}
                  />
                  Include quiz funnel link
                </label>
              </div>

              {/* Platforms */}
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
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button onClick={handleSaveDraft} disabled={saving || !content.trim()} className="flex-1">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Clock className="h-4 w-4 mr-2" />}
                  Save to Calendar (Pending Approval)
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Preview Dialog */}
        <Dialog open={!!previewPost} onOpenChange={() => setPreviewPost(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Post Preview</DialogTitle>
            </DialogHeader>
            {previewPost && (
              <div className="space-y-4">
                {(previewPost as any).image_variant && (
                  <img
                    src={IMAGE_VARIANTS.find((v) => v.id === (previewPost as any).image_variant)?.src}
                    alt="Post image"
                    className="w-full rounded-lg"
                  />
                )}

                {/* Uploaded images with delete */}
                {(previewPost.media_urls || []).length > 0 && (
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">Attached Images</label>
                    <div className="grid grid-cols-3 gap-2">
                      {(previewPost.media_urls || []).map((url: string, i: number) => (
                        <div key={i} className="relative rounded-lg overflow-hidden border border-border group aspect-square">
                          <img src={url} alt="" className="w-full h-full object-cover" />
                          <button
                            onClick={() => handleDeleteImage(previewPost.id, url)}
                            className="absolute top-1 right-1 bg-destructive/80 hover:bg-destructive rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="h-3 w-3 text-destructive-foreground" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Add images to existing post */}
                <div>
                  <input
                    ref={postFileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files) handleUploadImages(e.target.files, previewPost.id);
                    }}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => postFileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    {uploading ? (
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    ) : (
                      <Upload className="h-3 w-3 mr-1" />
                    )}
                    Add Images
                  </Button>
                </div>

                <p className="text-sm text-foreground whitespace-pre-wrap">{previewPost.content}</p>
                <div className="flex items-center gap-2 flex-wrap">
                  {(previewPost.platforms || []).map((p: string) => (
                    <Badge key={p} variant="secondary" className="text-[10px]">{p}</Badge>
                  ))}
                  <ApprovalBadge status={(previewPost as any).approval_status} />
                </div>
                {(previewPost as any).approval_status === "pending" && (
                  <div className="flex gap-2">
                    <Button
                      onClick={() => { handleApprove(previewPost.id); setPreviewPost(null); }}
                      className="flex-1"
                      size="sm"
                    >
                      <Check className="h-4 w-4 mr-1" /> Approve
                    </Button>
                    <Button
                      onClick={() => { handleReject(previewPost.id); setPreviewPost(null); }}
                      variant="destructive"
                      className="flex-1"
                      size="sm"
                    >
                      <X className="h-4 w-4 mr-1" /> Reject
                    </Button>
                  </div>
                )}
                {(previewPost as any).approval_status === "approved" && previewPost.status !== "published" && (
                  <Button
                    onClick={() => { handlePublishNow(previewPost); setPreviewPost(null); }}
                    className="w-full"
                    size="sm"
                  >
                    <Send className="h-4 w-4 mr-1" /> Publish Now
                  </Button>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminShell>
  );
}

function PostApprovalCard({ post, onApprove, onReject, onPreview }: {
  post: any; onApprove: () => void; onReject: () => void; onPreview: () => void;
}) {
  const variant = IMAGE_VARIANTS.find((v) => v.id === (post as any).image_variant);
  return (
    <Card className="bg-card border-border">
      <CardContent className="py-3">
        <div className="flex gap-3">
          {variant && (
            <img
              src={variant.src}
              alt={variant.label}
              className="w-16 h-16 rounded object-cover cursor-pointer"
              onClick={onPreview}
            />
          )}
          <div className="flex-1 min-w-0 space-y-2">
            <p className="text-sm text-foreground line-clamp-2">{post.content}</p>
            <div className="flex items-center gap-2 flex-wrap">
              {(post.platforms || []).map((p: string) => (
                <Badge key={p} variant="secondary" className="text-[10px]">{p}</Badge>
              ))}
              {post.scheduled_date && (
                <span className="text-[10px] text-muted-foreground">
                  <CalendarDays className="h-3 w-3 inline mr-0.5" />
                  {post.scheduled_date}
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <Button onClick={onApprove} size="sm" className="h-7 text-xs">
                <Check className="h-3 w-3 mr-1" /> Approve
              </Button>
              <Button onClick={onReject} size="sm" variant="destructive" className="h-7 text-xs">
                <X className="h-3 w-3 mr-1" /> Reject
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ApprovalBadge({ status }: { status: string }) {
  if (status === "approved") return <Badge className="text-[10px] bg-green-500/20 text-green-400 border-green-500/30">Approved</Badge>;
  if (status === "rejected") return <Badge className="text-[10px] bg-destructive/20 text-destructive border-destructive/30">Rejected</Badge>;
  return <Badge className="text-[10px] bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Pending</Badge>;
}
