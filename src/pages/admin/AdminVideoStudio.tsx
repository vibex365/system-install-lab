import { useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sparkles, Loader2, Video, Film, Save, Play, Send, Eye,
  Clapperboard, Mic, Type, Image as ImageIcon, CheckCircle2,
  Upload, Wand2, Download,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

interface ScriptScene {
  title: string;
  narration: string;
  visual_prompt: string;
  caption_text: string;
  image_url?: string;
  video_url?: string;
}

const FORMATS = [
  { id: "solo", label: "Solo Presenter", icon: Mic, desc: "Direct to camera monologue" },
  { id: "interview", label: "Interview", icon: Film, desc: "Host + guest conversation" },
  { id: "roundtable", label: "Roundtable", icon: Video, desc: "Multi-person discussion" },
];

const TOPIC_PRESETS = [
  "3 AI tools that replaced my entire team",
  "Why most businesses fail at automation",
  "The system I use to close leads on autopilot",
  "Stop doing this manually — use AI instead",
  "How I built a 6-figure system in 30 days",
  "The AI agent stack every business needs",
  "People fail. Systems work. Here's why.",
  "This free AI tool will save you 10 hours a week",
];

export default function AdminVideoStudio() {
  const { toast } = useToast();

  const [topic, setTopic] = useState("");
  const [tone, setTone] = useState("educational");
  const [format, setFormat] = useState("solo");
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [scriptTitle, setScriptTitle] = useState("");
  const [scenes, setScenes] = useState<ScriptScene[]>([]);
  const [activeSceneIndex, setActiveSceneIndex] = useState(0);
  const [generatingImageIndex, setGeneratingImageIndex] = useState<number | null>(null);
  const [generatingVideoIndex, setGeneratingVideoIndex] = useState<number | null>(null);

  const { data: projects = [], refetch: refetchProjects } = useQuery({
    queryKey: ["video-projects"],
    queryFn: async () => {
      const { data } = await supabase
        .from("video_projects")
        .select("*, video_scenes(*)")
        .order("created_at", { ascending: false });
      return data || [];
    },
  });

  const handleGenerate = async () => {
    if (!topic.trim()) {
      toast({ title: "Enter a topic first", variant: "destructive" });
      return;
    }
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-video-script", {
        body: { action: "generate_script", topic, tone, format },
      });
      if (error) throw error;
      const script = data?.script;
      if (!script?.scenes?.length) throw new Error("No scenes generated");

      setScriptTitle(script.title);
      setScenes(script.scenes);
      setActiveSceneIndex(0);
      toast({ title: "Script generated!", description: `${script.scenes.length} scenes ready` });
    } catch (e: any) {
      toast({ title: "Generation failed", description: e.message, variant: "destructive" });
    }
    setGenerating(false);
  };

  const handleSaveProject = async () => {
    if (!scenes.length || !scriptTitle) return;
    setSaving(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-video-script", {
        body: { action: "save_project", title: scriptTitle, topic, tone, format, scenes },
      });
      if (error) throw error;
      toast({ title: "Project saved!" });
      refetchProjects();
    } catch (e: any) {
      toast({ title: "Save failed", description: e.message, variant: "destructive" });
    }
    setSaving(false);
  };

  const handleGenerateImage = async (index: number) => {
    const scene = scenes[index];
    if (!scene?.visual_prompt) {
      toast({ title: "Visual prompt required", variant: "destructive" });
      return;
    }
    setGeneratingImageIndex(index);
    try {
      const { data, error } = await supabase.functions.invoke("generate-video-script", {
        body: { action: "generate_image", visual_prompt: scene.visual_prompt, scene_id: `scene-${index}` },
      });
      if (error) throw error;

      const imageUrl = data?.image_url;
      if (!imageUrl) throw new Error("No image returned");

      setScenes(prev => prev.map((s, i) => i === index ? { ...s, image_url: imageUrl } : s));
      toast({ title: "Reference image generated!" });
    } catch (e: any) {
      toast({ title: "Image generation failed", description: e.message, variant: "destructive" });
    }
    setGeneratingImageIndex(null);
  };

  const handleGenerateVideo = async (index: number) => {
    const scene = scenes[index];
    if (!scene?.image_url) {
      toast({ title: "Generate a reference image first", variant: "destructive" });
      return;
    }
    setGeneratingVideoIndex(index);
    try {
      const { data, error } = await supabase.functions.invoke("generate-video-script", {
        body: {
          action: "generate_video",
          scene_index: index,
          image_url: scene.image_url,
          visual_prompt: scene.visual_prompt,
          narration: scene.narration,
        },
      });
      if (error) throw error;

      const videoUrl = data?.video_url;
      if (!videoUrl) throw new Error("No video returned");

      setScenes(prev => prev.map((s, i) => i === index ? { ...s, video_url: videoUrl } : s));
      toast({ title: "Video generated!" });
    } catch (e: any) {
      toast({ title: "Video generation failed", description: e.message, variant: "destructive" });
    }
    setGeneratingVideoIndex(null);
  };

  const handleUploadImage = async (index: number, file: File) => {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      const fileName = `video-studio/${user?.id}/${Date.now()}-scene-${index}.${file.name.split(".").pop()}`;
      const { error: uploadErr } = await supabase.storage
        .from("ad-creatives")
        .upload(fileName, file, { contentType: file.type, upsert: true });
      if (uploadErr) throw uploadErr;

      const { data: publicUrl } = supabase.storage.from("ad-creatives").getPublicUrl(fileName);
      setScenes(prev => prev.map((s, i) => i === index ? { ...s, image_url: publicUrl.publicUrl } : s));
      toast({ title: "Image uploaded!" });
    } catch (e: any) {
      toast({ title: "Upload failed", description: e.message, variant: "destructive" });
    }
  };

  const handlePublishToSocial = async (projectId: string) => {
    try {
      const project = projects.find((p: any) => p.id === projectId);
      if (!project) return;

      const videoScenes = (project as any).video_scenes || [];
      const videoUrls = videoScenes
        .filter((s: any) => s.video_url)
        .map((s: any) => s.video_url);

      if (!videoUrls.length) {
        toast({ title: "No videos generated yet", variant: "destructive" });
        return;
      }

      const user = (await supabase.auth.getUser()).data.user;
      const { error } = await supabase.from("social_posts").insert({
        content: `${(project as any).title}\n\n#AI #Automation #Systems #PeopleFailSystemsWork`,
        platforms: ["tiktok", "youtube"],
        scheduled_date: new Date().toISOString().split("T")[0],
        approval_status: "pending",
        status: "draft",
        media_urls: videoUrls,
        user_id: user?.id,
      } as any);

      if (error) throw error;
      toast({ title: "Added to Social Calendar for approval" });
    } catch (e: any) {
      toast({ title: "Publish failed", description: e.message, variant: "destructive" });
    }
  };

  const updateScene = (index: number, field: keyof ScriptScene, value: string) => {
    setScenes(prev => prev.map((s, i) => i === index ? { ...s, [field]: value } : s));
  };

  const activeScene = scenes[activeSceneIndex];

  return (
    <AdminShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Video Studio</h1>
            <p className="text-sm text-muted-foreground">
              AI-scripted short-form videos for TikTok & YouTube Shorts
            </p>
          </div>
          {scenes.length > 0 && (
            <Button onClick={handleSaveProject} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              Save Project
            </Button>
          )}
        </div>

        <Tabs defaultValue="create">
          <TabsList>
            <TabsTrigger value="create">
              <Clapperboard className="h-4 w-4 mr-1.5" />
              Create
            </TabsTrigger>
            <TabsTrigger value="projects">
              <Film className="h-4 w-4 mr-1.5" />
              Projects ({projects.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="create" className="space-y-6 mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left: Input */}
              <div className="lg:col-span-1 space-y-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-primary" />
                      Script Generator
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground uppercase mb-1.5 block">
                        Video Topic
                      </label>
                      <Textarea
                        value={topic}
                        onChange={e => setTopic(e.target.value)}
                        placeholder="e.g., 3 AI tools that replaced my entire team"
                        className="min-h-[80px]"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-medium text-muted-foreground uppercase mb-1.5 block">
                        Quick Topics
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        {TOPIC_PRESETS.map(t => (
                          <button
                            key={t}
                            onClick={() => setTopic(t)}
                            className="px-2 py-1 text-[10px] rounded-md border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                          >
                            {t.length > 35 ? t.slice(0, 35) + "…" : t}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-muted-foreground uppercase mb-1.5 block">Tone</label>
                      <Select value={tone} onValueChange={setTone}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="educational">Educational</SelectItem>
                          <SelectItem value="hype">High Energy / Hype</SelectItem>
                          <SelectItem value="conversational">Conversational</SelectItem>
                          <SelectItem value="controversial">Controversial / Hot Take</SelectItem>
                          <SelectItem value="storytelling">Storytelling</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-muted-foreground uppercase mb-1.5 block">Format</label>
                      <div className="grid grid-cols-1 gap-2">
                        {FORMATS.map(f => (
                          <button
                            key={f.id}
                            onClick={() => setFormat(f.id)}
                            className={`flex items-center gap-2.5 p-2.5 rounded-md border text-left transition-colors ${
                              format === f.id
                                ? "border-primary bg-primary/5 text-foreground"
                                : "border-border text-muted-foreground hover:text-foreground hover:bg-muted"
                            }`}
                          >
                            <f.icon className="h-4 w-4 shrink-0" />
                            <div>
                              <p className="text-xs font-medium">{f.label}</p>
                              <p className="text-[10px] text-muted-foreground">{f.desc}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    <Button onClick={handleGenerate} disabled={generating || !topic.trim()} className="w-full">
                      {generating ? (
                        <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Writing Script...</>
                      ) : (
                        <><Sparkles className="h-4 w-4 mr-2" /> Generate Script</>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Right: Script Preview + Scene Editor */}
              <div className="lg:col-span-2 space-y-4">
                {scenes.length > 0 ? (
                  <>
                    <Card>
                      <CardContent className="pt-4">
                        <Input
                          value={scriptTitle}
                          onChange={e => setScriptTitle(e.target.value)}
                          className="text-lg font-semibold border-none p-0 h-auto focus-visible:ring-0"
                          placeholder="Video Title"
                        />
                      </CardContent>
                    </Card>

                    {/* Scene Timeline */}
                    <div className="flex gap-2 overflow-x-auto pb-2">
                      {scenes.map((scene, i) => (
                        <button
                          key={i}
                          onClick={() => setActiveSceneIndex(i)}
                          className={`flex-shrink-0 px-3 py-2 rounded-md border text-xs font-medium transition-colors relative ${
                            activeSceneIndex === i
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          <span className="block text-[10px] text-muted-foreground mb-0.5">Scene {i + 1}</span>
                          {scene.title}
                          {/* Status indicators */}
                          <div className="flex gap-1 mt-1">
                            {scene.image_url && (
                              <span className="w-1.5 h-1.5 rounded-full bg-green-500" title="Image ready" />
                            )}
                            {scene.video_url && (
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" title="Video ready" />
                            )}
                          </div>
                        </button>
                      ))}
                    </div>

                    {/* Active Scene Editor */}
                    {activeScene && (
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm flex items-center justify-between">
                            <span className="flex items-center gap-2">
                              <Film className="h-4 w-4" />
                              Scene {activeSceneIndex + 1}: {activeScene.title}
                            </span>
                            <Badge variant="outline" className="text-[10px]">
                              ~{Math.ceil(activeScene.narration.split(" ").length / 2.5)}s
                            </Badge>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Left: Text fields */}
                            <div className="space-y-4">
                              <div>
                                <label className="text-xs font-medium text-muted-foreground uppercase mb-1.5 flex items-center gap-1.5">
                                  <Mic className="h-3 w-3" /> Narration
                                </label>
                                <Textarea
                                  value={activeScene.narration}
                                  onChange={e => updateScene(activeSceneIndex, "narration", e.target.value)}
                                  className="min-h-[80px]"
                                />
                              </div>

                              <div>
                                <label className="text-xs font-medium text-muted-foreground uppercase mb-1.5 flex items-center gap-1.5">
                                  <Type className="h-3 w-3" /> On-Screen Caption
                                </label>
                                <Input
                                  value={activeScene.caption_text}
                                  onChange={e => updateScene(activeSceneIndex, "caption_text", e.target.value)}
                                />
                              </div>

                              <div>
                                <label className="text-xs font-medium text-muted-foreground uppercase mb-1.5 flex items-center gap-1.5">
                                  <ImageIcon className="h-3 w-3" /> Visual Prompt
                                </label>
                                <Textarea
                                  value={activeScene.visual_prompt}
                                  onChange={e => updateScene(activeSceneIndex, "visual_prompt", e.target.value)}
                                  className="min-h-[60px] text-xs"
                                />
                              </div>
                            </div>

                            {/* Right: Preview + Generation */}
                            <div className="space-y-3">
                              {/* Preview Area - 9:16 */}
                              <div className="aspect-[9/16] max-h-[360px] bg-muted rounded-lg border border-border flex items-center justify-center overflow-hidden relative">
                                {activeScene.video_url ? (
                                  <video
                                    src={activeScene.video_url}
                                    controls
                                    className="w-full h-full object-contain rounded-lg"
                                  />
                                ) : activeScene.image_url ? (
                                  <img
                                    src={activeScene.image_url}
                                    alt={activeScene.title}
                                    className="w-full h-full object-cover rounded-lg"
                                  />
                                ) : (
                                  <div className="text-center text-muted-foreground p-6">
                                    <ImageIcon className="h-10 w-10 mx-auto mb-2 opacity-40" />
                                    <p className="text-xs">9:16 Preview</p>
                                    <p className="text-[10px] mt-1">Generate or upload a reference image</p>
                                  </div>
                                )}
                              </div>

                              {/* Generation Buttons */}
                              <div className="space-y-2">
                                {/* Step 1: Reference Image */}
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant={activeScene.image_url ? "outline" : "default"}
                                    className="flex-1 text-xs"
                                    onClick={() => handleGenerateImage(activeSceneIndex)}
                                    disabled={generatingImageIndex === activeSceneIndex || !activeScene.visual_prompt}
                                  >
                                    {generatingImageIndex === activeSceneIndex ? (
                                      <><Loader2 className="h-3 w-3 animate-spin mr-1" /> Generating...</>
                                    ) : (
                                      <><Wand2 className="h-3 w-3 mr-1" /> {activeScene.image_url ? "Regenerate" : "Generate"} Image</>
                                    )}
                                  </Button>
                                  <label className="cursor-pointer">
                                    <Button size="sm" variant="outline" className="text-xs" asChild>
                                      <span>
                                        <Upload className="h-3 w-3 mr-1" /> Upload
                                      </span>
                                    </Button>
                                    <input
                                      type="file"
                                      accept="image/*"
                                      className="hidden"
                                      onChange={e => {
                                        const file = e.target.files?.[0];
                                        if (file) handleUploadImage(activeSceneIndex, file);
                                      }}
                                    />
                                  </label>
                                </div>

                                {/* Step 2: Generate Video from Image */}
                                <Button
                                  size="sm"
                                  className="w-full text-xs"
                                  variant={activeScene.video_url ? "outline" : "default"}
                                  onClick={() => handleGenerateVideo(activeSceneIndex)}
                                  disabled={
                                    !activeScene.image_url ||
                                    generatingVideoIndex === activeSceneIndex
                                  }
                                >
                                  {generatingVideoIndex === activeSceneIndex ? (
                                    <><Loader2 className="h-3 w-3 animate-spin mr-1" /> Generating Video...</>
                                  ) : !activeScene.image_url ? (
                                    <><Video className="h-3 w-3 mr-1" /> Generate Image First</>
                                  ) : (
                                    <><Play className="h-3 w-3 mr-1" /> {activeScene.video_url ? "Regenerate" : "Generate"} Video</>
                                  )}
                                </Button>

                                {activeScene.image_url && (
                                  <p className="text-[10px] text-muted-foreground text-center">
                                    {activeScene.video_url ? (
                                      <span className="flex items-center justify-center gap-1 text-green-600">
                                        <CheckCircle2 className="h-3 w-3" /> Image + Video ready
                                      </span>
                                    ) : (
                                      "Reference image will be used as the starting frame"
                                    )}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Full Script View */}
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Eye className="h-4 w-4" />
                          Full Script
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ScrollArea className="max-h-[300px]">
                          <div className="space-y-4">
                            {scenes.map((scene, i) => (
                              <div key={i} className="border-l-2 border-primary/20 pl-3">
                                <div className="flex items-center gap-2 mb-1">
                                  <Badge variant="secondary" className="text-[10px]">Scene {i + 1}</Badge>
                                  <span className="text-xs font-medium">{scene.title}</span>
                                  {scene.image_url && <span className="w-1.5 h-1.5 rounded-full bg-green-500" />}
                                  {scene.video_url && <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />}
                                </div>
                                <p className="text-sm text-foreground">{scene.narration}</p>
                                <p className="text-[10px] text-muted-foreground mt-1">
                                  📺 {scene.caption_text}
                                </p>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                        <div className="mt-3 pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                          <span>
                            {scenes.length} scenes • ~{Math.ceil(scenes.reduce((acc, s) => acc + s.narration.split(" ").length, 0) / 2.5)}s total
                          </span>
                          <span>9:16 Vertical • TikTok / YouTube Shorts</span>
                        </div>
                      </CardContent>
                    </Card>
                  </>
                ) : (
                  <Card>
                    <CardContent className="py-16 text-center text-muted-foreground">
                      <Clapperboard className="h-12 w-12 mx-auto mb-3 opacity-30" />
                      <p className="font-medium">No script yet</p>
                      <p className="text-xs mt-1">Enter a topic and generate a script to get started</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="projects" className="mt-4">
            {projects.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <Film className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">No projects yet</p>
                  <p className="text-xs mt-1">Generate and save your first script</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {projects.map((project: any) => {
                  const sceneCount = project.video_scenes?.length || 0;
                  const imagesReady = project.video_scenes?.filter((s: any) => s.image_url).length || 0;
                  const videosReady = project.video_scenes?.filter((s: any) => s.video_url).length || 0;
                  return (
                    <Card key={project.id}>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">{project.title}</CardTitle>
                        <p className="text-xs text-muted-foreground">{project.topic}</p>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px]">{project.format}</Badge>
                          <Badge variant="outline" className="text-[10px]">{project.tone}</Badge>
                          <Badge
                            variant={project.status === "published" ? "default" : "secondary"}
                            className="text-[10px]"
                          >
                            {project.status}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {sceneCount} scenes • {imagesReady} images • {videosReady} videos
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 text-xs"
                            onClick={() => {
                              setScriptTitle(project.title);
                              setTopic(project.topic);
                              setTone(project.tone);
                              setFormat(project.format);
                              setScenes(
                                (project.video_scenes || [])
                                  .sort((a: any, b: any) => a.scene_order - b.scene_order)
                                  .map((s: any) => ({
                                    title: s.title,
                                    narration: s.narration,
                                    visual_prompt: s.visual_prompt || "",
                                    caption_text: s.caption_text || "",
                                    image_url: s.image_url,
                                    video_url: s.video_url,
                                  }))
                              );
                              setActiveSceneIndex(0);
                            }}
                          >
                            <Eye className="h-3 w-3 mr-1" /> View
                          </Button>
                          {videosReady > 0 && (
                            <Button
                              size="sm"
                              className="flex-1 text-xs"
                              onClick={() => handlePublishToSocial(project.id)}
                            >
                              <Send className="h-3 w-3 mr-1" /> Post
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AdminShell>
  );
}
