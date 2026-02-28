import { useState, useMemo, useRef, useCallback } from "react";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Send, Sparkles, Loader2, CalendarDays, CheckCircle2, AlertCircle,
  ChevronLeft, ChevronRight, Plus, Clock, Check, X, Eye, Zap, Bot,
  Upload, Trash2, Image as ImageIcon, GalleryHorizontalEnd, Download
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

const QUIZ_FUNNEL_URL = "/systems-quiz";

const KEYWORD_OPTIONS = [
  "SYSTEMS", "AUTOMATE", "REPLACE", "BUILD", "SCALE", "INSTALL",
  "FREEDOM", "LEVERAGE", "OPERATOR", "READY", "UPGRADE", "BLUEPRINT",
];

const IMAGE_VARIANTS = [
  { id: "learn_ai_dark", label: "Learn AI (Dark)", src: learnAiDark },
  { id: "bottleneck_dark", label: "Bottleneck (Dark)", src: bottleneckDark },
  { id: "replace_yourself_dark", label: "Replace Yourself (Dark)", src: replaceYourselfDark },
  { id: "fake_guru_dark", label: "Fake Guru (Dark)", src: fakeGuruDark },
  { id: "fake_guru_yellow", label: "Fake Guru (Yellow)", src: fakeGuruYellow },
  { id: "replace_yourself_yellow", label: "Replace Yourself (Yellow)", src: replaceYourselfYellow },
  { id: "bottleneck_yellow", label: "Bottleneck (Yellow)", src: bottleneckYellow },
];

const ALL_PLATFORMS = [
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
  const [keyword, setKeyword] = useState("SYSTEMS");
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [composerMediaUrls, setComposerMediaUrls] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const postFileInputRef = useRef<HTMLInputElement>(null);
  const galleryFileInputRef = useRef<HTMLInputElement>(null);

  const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

  // Fetch connected Late.dev profiles
  const { data: connectedProfiles = [], isLoading: profilesLoading } = useQuery({
    queryKey: ["late-connected-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("social-post", {
        body: { action: "accounts" },
      });
      if (error) throw error;
      const accounts = data?.accounts;
      const list = Array.isArray(accounts) ? accounts : accounts?.profiles || accounts?.data || [];
      return list.map((p: any) => ({
        id: p.id,
        profileId: p.profileId || "",
        platform: (p.platform || p.type || "unknown").toLowerCase(),
        name: p.name || p.username || p.display_name || p.platform || "Unknown",
      }));
    },
  });

  const connectedPlatformIds = connectedProfiles.map((p: any) => p.platform);

  // Gallery images query
  const { data: galleryImages = [], refetch: refetchGallery } = useQuery({
    queryKey: ["social-gallery-images"],
    queryFn: async () => {
      const { data, error } = await supabase.storage.from("social-images").list("gallery", {
        sortBy: { column: "created_at", order: "desc" },
      });
      if (error) return [];
      return (data || []).filter(f => !f.name.startsWith(".")).map(f => ({
        name: f.name,
        url: `${SUPABASE_URL}/storage/v1/object/public/social-images/gallery/${f.name}`,
        created_at: f.created_at,
      }));
    },
  });

  const handleGalleryUpload = async (files: FileList) => {
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const ext = file.name.split(".").pop();
        const safeName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error } = await supabase.storage
          .from("social-images")
          .upload(`gallery/${safeName}`, file, { upsert: true });
        if (error) throw error;
      }
      toast({ title: `${files.length} image(s) uploaded to gallery` });
      refetchGallery();
    } catch (e: any) {
      toast({ title: "Upload failed", description: e.message, variant: "destructive" });
    }
    setUploading(false);
  };

  const handleGalleryDelete = async (name: string) => {
    try {
      const { error } = await supabase.storage.from("social-images").remove([`gallery/${name}`]);
      if (error) throw error;
      toast({ title: "Image deleted" });
      refetchGallery();
    } catch (e: any) {
      toast({ title: "Delete failed", description: e.message, variant: "destructive" });
    }
  };

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

  const handleDeletePost = async (postId: string) => {
    try {
      const { error } = await supabase.from("social_posts").delete().eq("id", postId);
      if (error) throw error;
      toast({ title: "Post deleted" });
      if (previewPost?.id === postId) setPreviewPost(null);
      refetch();
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
      // Immediately trigger auto-publish for today's approved posts
      try {
        const { data, error: pubErr } = await supabase.functions.invoke("auto-publish-social");
        if (pubErr) console.error("Auto-publish trigger failed:", pubErr);
        else if (data?.published > 0) {
          toast({ title: `${data.published} post(s) published now` });
          refetch();
        }
      } catch (e) {
        console.error("Auto-publish trigger error:", e);
      }
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
    setKeyword("SYSTEMS");
    setSelectedPlatforms(connectedPlatformIds.length > 0 ? [...connectedPlatformIds] : ["facebook"]);
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
          keyword,
          includeQuizUrl,
          quizFunnelUrl: `${window.location.origin}${QUIZ_FUNNEL_URL}`,
        },
      });
      if (error) throw error;
      const text = data?.generated?.text || "";
      const hashtags = data?.generated?.hashtags || [];
      let full = text;
      if (hashtags.length) full += "\n\n" + hashtags.map((h: string) => `#${h}`).join(" ");
      setContent(full);
      toast({ title: "Content generated" });
    } catch (e: any) {
      toast({ title: "Generation failed", description: e.message, variant: "destructive" });
    }
    setGenerating(false);
  };

  // Helper: upload a brand image_variant to storage and return its public URL
  const uploadBrandImageToStorage = async (variantId: string): Promise<string | null> => {
    const variant = IMAGE_VARIANTS.find((v) => v.id === variantId);
    if (!variant) return null;
    try {
      // First check if already uploaded
      const { data: existing } = await supabase.storage
        .from("social-images")
        .list("brand", { limit: 100 });
      const existingMatch = (existing || []).find((f: any) => f.name.startsWith(variantId));
      if (existingMatch) {
        const { data: urlData } = supabase.storage.from("social-images").getPublicUrl(`brand/${existingMatch.name}`);
        return urlData.publicUrl;
      }

      // Fetch the local asset and convert to blob
      const resp = await fetch(variant.src);
      const blob = await resp.blob();
      // Validate we got an actual image, not HTML
      if (!blob.type.startsWith("image/")) {
        console.error("Brand image fetch returned non-image type:", blob.type);
        // Fallback: use gallery image
        return await getRandomGalleryImage();
      }
      const ext = blob.type.split("/")[1] || "png";
      const fileName = `brand/${variantId}-${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from("social-images")
        .upload(fileName, blob, { contentType: blob.type, upsert: true });
      if (uploadErr) throw uploadErr;
      const { data: urlData } = supabase.storage.from("social-images").getPublicUrl(fileName);
      return urlData.publicUrl;
    } catch (e: any) {
      console.error("Brand image upload failed:", e);
      // Fallback: use gallery image
      return await getRandomGalleryImage();
    }
  };

  const getRandomGalleryImage = async (): Promise<string | null> => {
    const { data: galleryFiles } = await supabase.storage
      .from("social-images")
      .list("gallery", { limit: 50 });
    if (galleryFiles?.length) {
      const randomFile = galleryFiles[Math.floor(Math.random() * galleryFiles.length)];
      const { data: urlData } = supabase.storage.from("social-images").getPublicUrl(`gallery/${randomFile.name}`);
      return urlData.publicUrl;
    }
    return null;
  };

  const handleSaveDraft = async () => {
    if (!content.trim() || !selectedDate) return;
    setSaving(true);
    try {
      // If brand image selected and no other media, upload it to storage
      let finalMediaUrls = [...composerMediaUrls];
      if (imageVariant && finalMediaUrls.length === 0) {
        const brandUrl = await uploadBrandImageToStorage(imageVariant);
        if (brandUrl) finalMediaUrls = [brandUrl];
      }

      const { error } = await supabase.from("social_posts").insert({
        content,
        platforms: selectedPlatforms,
        scheduled_date: format(selectedDate, "yyyy-MM-dd"),
        scheduled_for: null,
        approval_status: "pending",
        status: "draft",
        image_variant: imageVariant,
        include_quiz_url: includeQuizUrl,
        keyword,
        media_urls: finalMediaUrls,
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
    const post = posts.find((p: any) => p.id === postId);
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
      // If this post is scheduled for today, publish immediately
      const today = format(new Date(), "yyyy-MM-dd");
      if (post?.scheduled_date === today) {
        try {
          const { data, error: pubErr } = await supabase.functions.invoke("auto-publish-social");
          if (!pubErr && data?.published > 0) {
            toast({ title: `Published now!` });
            refetch();
          }
        } catch (e) {
          console.error("Auto-publish trigger error:", e);
        }
      }
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
      // If post has image_variant but no media_urls, upload brand image first
      let mediaUrls = post.media_urls || [];
      if ((!mediaUrls.length) && post.image_variant) {
        const brandUrl = await uploadBrandImageToStorage(post.image_variant);
        if (brandUrl) {
          mediaUrls = [brandUrl];
          // Also persist the URL to the post record
          await supabase.from("social_posts").update({ media_urls: mediaUrls } as any).eq("id", post.id);
        }
      }

      const { error } = await supabase.functions.invoke("social-post", {
        body: { action: "post", text: post.content, platforms: post.platforms, mediaUrls },
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

  const addGalleryImageToComposer = (url: string) => {
    setComposerMediaUrls(prev => [...prev, url]);
    toast({ title: "Image added to post" });
  };

  const handleExportCsv = useCallback(() => {
    // Filter posts that are approved/scheduled and not yet published
    const exportable = posts.filter((p: any) => 
      p.approval_status === "approved" && p.status !== "published"
    );
    if (!exportable.length) {
      toast({ title: "No approved posts to export", variant: "destructive" });
      return;
    }

    const headers = [
      "post_content","platforms","profiles","schedule_time","schedule_time_twitter",
      "schedule_time_instagram","schedule_time_facebook","schedule_time_youtube",
      "schedule_time_linkedin","schedule_time_tiktok","schedule_time_threads",
      "schedule_time_pinterest","schedule_time_reddit","schedule_time_bluesky",
      "schedule_time_googlebusiness","schedule_time_telegram","tz","media_urls",
      "is_draft","publish_now","use_queue","title","tags","hashtags","visibility",
      "mentions","crossposting_enabled","metadata"
    ];

    const csvEscape = (val: string) => `"${val.replace(/"/g, '""')}"`;
    
    // Build profile ID map from connected profiles — use Late.dev Profile ID, NOT account ID
    const profileIdSet = new Set<string>();
    connectedProfiles.forEach((p: any) => {
      if (p.profileId) profileIdSet.add(p.profileId);
    });
    const lateProfileId = [...profileIdSet][0] || "";

    const rows = exportable.map((post: any) => {
      const platforms = (post.platforms || []).join(",");
      const profileIds = lateProfileId;
      const scheduleTime = post.scheduled_date ? `${post.scheduled_date} 10:00` : "";
      const mediaUrls = (post.media_urls || []).join(",");
      const hashtags = (post.content.match(/#\w+/g) || []).join(",");

      return [
        csvEscape(post.content || ""),       // post_content
        csvEscape(platforms),                 // platforms
        csvEscape(profileIds),               // profiles
        csvEscape(scheduleTime),             // schedule_time
        "","","","","","","","","","","","",  // platform-specific schedule times
        csvEscape("America/New_York"),       // tz
        csvEscape(mediaUrls),                // media_urls
        '"false"',                           // is_draft
        '"false"',                           // publish_now
        '"false"',                           // use_queue
        csvEscape(post.headline || ""),      // title
        '""',                                // tags
        csvEscape(hashtags),                 // hashtags
        '"public"',                          // visibility
        '""',                                // mentions
        '"true"',                            // crossposting_enabled
        '""',                                // metadata
      ].join(",");
    });

    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `late-bulk-schedule-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: `Exported ${exportable.length} post(s) to CSV` });
  }, [posts, connectedProfiles, toast]);

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
                    Auto-generates posts weekly · CTA: "Comment 'SEND ME THE LINK' below" → DM manually
                  </p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-[10px] text-muted-foreground">Connected:</span>
                    {profilesLoading ? (
                      <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                    ) : connectedProfiles.length > 0 ? (
                      connectedProfiles.map((p: any) => (
                        <Badge key={p.id} variant="secondary" className="text-[10px] px-1.5 py-0 capitalize">
                          {p.platform} {p.name !== p.platform ? `(${p.name})` : ""}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-[10px] text-destructive">No profiles connected</span>
                    )}
                  </div>
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
              AI-generated posts with keyword CTA &amp; approval workflow
            </p>
          </div>
          <div className="flex gap-2">
            {pendingCount > 0 && (
              <Badge variant="destructive" className="text-xs">
                {pendingCount} pending approval
              </Badge>
            )}
            <Button onClick={handleExportCsv} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-1" /> Export CSV
            </Button>
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
            <TabsTrigger value="gallery">
              <GalleryHorizontalEnd className="h-3 w-3 mr-1" /> Gallery ({galleryImages.length})
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
                    onDelete={() => handleDeletePost(post.id)}
                  />
                ))}
            </div>
          </TabsContent>

          {/* Gallery */}
          <TabsContent value="gallery">
            <Card className="bg-card border-border">
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm">Image Gallery ({galleryImages.length})</CardTitle>
                <div>
                  <input
                    ref={galleryFileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => e.target.files && handleGalleryUpload(e.target.files)}
                  />
                  <Button
                    onClick={() => galleryFileInputRef.current?.click()}
                    size="sm"
                    disabled={uploading}
                  >
                    {uploading ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Upload className="h-3 w-3 mr-1" />}
                    Upload Images
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {galleryImages.length === 0 ? (
                  <div className="py-12 text-center text-muted-foreground text-sm">
                    <ImageIcon className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p>No images yet. Upload your 30 days of post images.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                    {galleryImages.map((img) => (
                      <div key={img.name} className="relative group aspect-square rounded-lg overflow-hidden border border-border">
                        <img src={img.url} alt={img.name} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1 transition-opacity">
                          <button
                            onClick={() => addGalleryImageToComposer(img.url)}
                            className="bg-primary/80 hover:bg-primary rounded-full p-1.5"
                            title="Use in post"
                          >
                            <Plus className="h-3 w-3 text-primary-foreground" />
                          </button>
                          <button
                            onClick={() => handleGalleryDelete(img.name)}
                            className="bg-destructive/80 hover:bg-destructive rounded-full p-1.5"
                            title="Delete"
                          >
                            <Trash2 className="h-3 w-3 text-destructive-foreground" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
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
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDeletePost(post.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {(post.platforms || []).map((p: string) => (
                        <Badge key={p} variant="secondary" className="text-[10px]">{p}</Badge>
                      ))}
                      <ApprovalBadge status={(post as any).approval_status} />
                      {(post as any).keyword && (
                        <Badge variant="outline" className="text-[10px]">🔑 {(post as any).keyword}</Badge>
                      )}
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

              {/* Keyword CTA */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Comment Keyword CTA</label>
                <div className="flex flex-wrap gap-1.5">
                  {KEYWORD_OPTIONS.map((kw) => (
                    <button
                      key={kw}
                      onClick={() => setKeyword(kw)}
                      className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                        keyword === kw
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                      }`}
                    >
                      {kw}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-muted-foreground">Post will end with: "Comment '{keyword}' below and I'll send you the details"</p>
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

              {/* Post Images (upload + gallery pick) */}
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
                {/* Quick gallery picker */}
                {galleryImages.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-[10px] text-muted-foreground">Or pick from gallery:</p>
                    <ScrollArea className="w-full">
                      <div className="flex gap-1.5 pb-2">
                        {galleryImages.slice(0, 20).map((img) => (
                          <button
                            key={img.name}
                            onClick={() => addGalleryImageToComposer(img.url)}
                            className="w-12 h-12 rounded border border-border hover:border-primary/50 overflow-hidden flex-shrink-0 transition-colors"
                          >
                            <img src={img.url} alt="" className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                )}
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
                <label className="text-xs font-medium text-muted-foreground">
                  Platforms {connectedProfiles.length > 0 && <span className="text-[10px] text-muted-foreground">(● = connected)</span>}
                </label>
                <div className="flex flex-wrap gap-2">
                  {ALL_PLATFORMS.map((p) => {
                    const isConnected = connectedPlatformIds.includes(p.id);
                    return (
                      <button
                        key={p.id}
                        onClick={() => togglePlatform(p.id)}
                        disabled={!isConnected}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                          !isConnected
                            ? "bg-muted text-muted-foreground/40 cursor-not-allowed line-through"
                            : selectedPlatforms.includes(p.id)
                              ? `${p.color} text-white`
                              : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                        }`}
                      >
                        {isConnected && <span className="text-green-400 text-[8px]">●</span>}
                        {p.label}
                      </button>
                    );
                  })}
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
                  {(previewPost as any).keyword && (
                    <Badge variant="outline" className="text-[10px]">🔑 {(previewPost as any).keyword}</Badge>
                  )}
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
                <Button
                  onClick={() => { handleDeletePost(previewPost.id); }}
                  variant="outline"
                  className="w-full text-destructive"
                  size="sm"
                >
                  <Trash2 className="h-4 w-4 mr-1" /> Delete Post
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminShell>
  );
}

function PostApprovalCard({ post, onApprove, onReject, onPreview, onDelete }: {
  post: any; onApprove: () => void; onReject: () => void; onPreview: () => void; onDelete: () => void;
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
              {(post as any).keyword && (
                <Badge variant="outline" className="text-[10px]">🔑 {(post as any).keyword}</Badge>
              )}
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
              <Button onClick={onDelete} size="sm" variant="ghost" className="h-7 text-xs text-destructive">
                <Trash2 className="h-3 w-3" />
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
