import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { Megaphone, Upload, Settings, BarChart3, Loader2, Trash2, Eye, AlertCircle, CheckCircle2, PauseCircle, PlayCircle } from "lucide-react";
import { AuthGate } from "@/components/AuthGate";

interface Campaign {
  id: string;
  campaign_name: string;
  objective: string;
  daily_budget_cents: number;
  target_audience: any;
  ad_copy: any;
  creative_urls: string[];
  meta_campaign_id: string | null;
  meta_adset_id: string | null;
  meta_ad_id: string | null;
  status: string;
  performance: any;
  error_message: string | null;
  created_at: string;
}

const MediaBuyer = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("setup");

  // Setup state
  const [accessToken, setAccessToken] = useState("");
  const [adAccountId, setAdAccountId] = useState("");
  const [hasCredentials, setHasCredentials] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [savingCreds, setSavingCreds] = useState(false);

  // Creative upload state
  const [uploading, setUploading] = useState(false);
  const [creatives, setCreatives] = useState<{ name: string; url: string }[]>([]);

  // Campaign form state
  const [campaignName, setCampaignName] = useState("");
  const [objective, setObjective] = useState("OUTCOME_LEADS");
  const [dailyBudget, setDailyBudget] = useState("10");
  const [targetLocation, setTargetLocation] = useState("");
  const [targetInterests, setTargetInterests] = useState("");
  const [ageMin, setAgeMin] = useState("25");
  const [ageMax, setAgeMax] = useState("55");
  const [launching, setLaunching] = useState(false);

  // Campaigns state
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(false);

  const loadCredentials = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("user_integrations")
      .select("credentials")
      .eq("user_id", user.id)
      .eq("provider", "meta_ads")
      .single();

    if (data) {
      const creds = data.credentials as any;
      setAccessToken(creds?.access_token || "");
      setAdAccountId(creds?.ad_account_id || "");
      setHasCredentials(true);
    }
  }, [user]);

  const loadCreatives = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.storage
      .from("ad-creatives")
      .list(`${user.id}/`, { limit: 50 });

    if (data) {
      const urls = data.map((f) => ({
        name: f.name,
        url: `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/ad-creatives/${user.id}/${f.name}`,
      }));
      setCreatives(urls);
    }
  }, [user]);

  const loadCampaigns = useCallback(async () => {
    if (!user) return;
    setLoadingCampaigns(true);
    const { data } = await supabase
      .from("ad_campaigns")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (data) setCampaigns(data as unknown as Campaign[]);
    setLoadingCampaigns(false);
  }, [user]);

  useEffect(() => {
    loadCredentials();
    loadCreatives();
    loadCampaigns();
  }, [loadCredentials, loadCreatives, loadCampaigns]);

  const saveCredentials = async () => {
    if (!user) return;
    setSavingCreds(true);
    const { error } = await supabase
      .from("user_integrations")
      .upsert(
        {
          user_id: user.id,
          provider: "meta_ads",
          credentials: { access_token: accessToken, ad_account_id: adAccountId },
        },
        { onConflict: "user_id,provider" }
      );

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Saved", description: "Meta Ads credentials saved." });
      setHasCredentials(true);
    }
    setSavingCreds(false);
  };

  const testConnection = async () => {
    setTestingConnection(true);
    try {
      const acctId = adAccountId.startsWith("act_") ? adAccountId : `act_${adAccountId}`;
      const resp = await fetch(
        `https://graph.facebook.com/v21.0/${acctId}?fields=name,account_status&access_token=${accessToken}`
      );
      const data = await resp.json();
      if (data.error) {
        toast({ title: "Connection Failed", description: data.error.message, variant: "destructive" });
      } else {
        toast({ title: "Connected!", description: `Account: ${data.name} (Status: ${data.account_status === 1 ? "Active" : data.account_status})` });
      }
    } catch {
      toast({ title: "Error", description: "Failed to reach Meta API", variant: "destructive" });
    }
    setTestingConnection(false);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || !e.target.files?.length) return;
    setUploading(true);
    for (const file of Array.from(e.target.files)) {
      const path = `${user.id}/${Date.now()}-${file.name}`;
      const { error } = await supabase.storage.from("ad-creatives").upload(path, file);
      if (error) {
        toast({ title: "Upload failed", description: error.message, variant: "destructive" });
      }
    }
    await loadCreatives();
    setUploading(false);
    toast({ title: "Uploaded", description: "Creatives uploaded successfully." });
  };

  const deleteCreative = async (name: string) => {
    if (!user) return;
    await supabase.storage.from("ad-creatives").remove([`${user.id}/${name}`]);
    await loadCreatives();
    toast({ title: "Deleted", description: "Creative removed." });
  };

  const launchCampaign = async () => {
    if (!user || !campaignName) return;
    setLaunching(true);
    try {
      const { data, error } = await supabase.functions.invoke("agent-media-buyer", {
        body: {
          user_id: user.id,
          campaign_name: campaignName,
          objective,
          daily_budget_cents: Math.round(parseFloat(dailyBudget) * 100),
          target_audience: {
            locations: targetLocation ? targetLocation.split(",").map((s) => s.trim()) : [],
            interests: targetInterests ? targetInterests.split(",").map((s) => s.trim()) : [],
            age_min: parseInt(ageMin) || 25,
            age_max: parseInt(ageMax) || 55,
          },
          creative_urls: creatives.map((c) => c.url),
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({ title: "Campaign Created!", description: `${campaignName} is live on Meta.` });
      setCampaignName("");
      setDailyBudget("10");
      setTargetLocation("");
      setTargetInterests("");
      await loadCampaigns();
      setActiveTab("dashboard");
    } catch (e: any) {
      toast({ title: "Launch Failed", description: e.message, variant: "destructive" });
    }
    setLaunching(false);
  };

  const statusIcon = (status: string) => {
    switch (status) {
      case "active": return <PlayCircle className="h-4 w-4 text-primary" />;
      case "paused": return <PauseCircle className="h-4 w-4 text-accent-foreground" />;
      case "error": return <AlertCircle className="h-4 w-4 text-destructive" />;
      default: return <CheckCircle2 className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <AuthGate>
      <div className="min-h-screen bg-background text-foreground">
        <Navbar />
        <div className="max-w-6xl mx-auto px-4 py-10 pt-24">
          <div className="flex items-center gap-3 mb-8">
            <Megaphone className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Media Buyer Agent</h1>
              <p className="text-muted-foreground">Full autopilot Facebook & Instagram ad campaigns</p>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="setup"><Settings className="h-4 w-4 mr-1" /> Setup</TabsTrigger>
              <TabsTrigger value="creatives"><Upload className="h-4 w-4 mr-1" /> Creatives</TabsTrigger>
              <TabsTrigger value="launch"><Megaphone className="h-4 w-4 mr-1" /> Launch</TabsTrigger>
              <TabsTrigger value="dashboard"><BarChart3 className="h-4 w-4 mr-1" /> Dashboard</TabsTrigger>
            </TabsList>

            {/* SETUP TAB */}
            <TabsContent value="setup">
              <Card>
                <CardHeader>
                  <CardTitle>Meta Ads Connection</CardTitle>
                  <CardDescription>Connect your Meta Business account to run campaigns. You need a System User token with ads_management permission.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Meta Access Token</Label>
                    <Input
                      type="password"
                      placeholder="EAAxxxxxxx..."
                      value={accessToken}
                      onChange={(e) => setAccessToken(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Ad Account ID</Label>
                    <Input
                      placeholder="act_123456789"
                      value={adAccountId}
                      onChange={(e) => setAdAccountId(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={saveCredentials} disabled={savingCreds || !accessToken || !adAccountId}>
                      {savingCreds ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                      Save Credentials
                    </Button>
                    <Button variant="outline" onClick={testConnection} disabled={testingConnection || !accessToken || !adAccountId}>
                      {testingConnection ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                      Test Connection
                    </Button>
                  </div>
                  {hasCredentials && (
                    <div className="flex items-center gap-2 text-sm text-primary">
                      <CheckCircle2 className="h-4 w-4" /> Meta credentials saved
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* CREATIVES TAB */}
            <TabsContent value="creatives">
              <Card>
                <CardHeader>
                  <CardTitle>Ad Creatives</CardTitle>
                  <CardDescription>Upload images for your ad campaigns. Recommended: 1080x1080 or 1200x628.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-6">
                    <Label htmlFor="creative-upload" className="cursor-pointer">
                      <div className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
                        <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          {uploading ? "Uploading..." : "Click or drag images here"}
                        </p>
                      </div>
                    </Label>
                    <input
                      id="creative-upload"
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handleUpload}
                      disabled={uploading}
                    />
                  </div>

                  {creatives.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No creatives uploaded yet.</p>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {creatives.map((c) => (
                        <div key={c.name} className="relative group rounded-lg overflow-hidden border border-border">
                          <img src={c.url} alt={c.name} className="w-full h-32 object-cover" />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <Button size="icon" variant="ghost" className="text-white" onClick={() => window.open(c.url, "_blank")}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button size="icon" variant="ghost" className="text-white" onClick={() => deleteCreative(c.name)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          <p className="text-xs p-1 truncate text-muted-foreground">{c.name}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* LAUNCH TAB */}
            <TabsContent value="launch">
              <Card>
                <CardHeader>
                  <CardTitle>Launch Campaign</CardTitle>
                  <CardDescription>Configure and launch a new Meta Ads campaign. AI generates the ad copy automatically.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {!hasCredentials && (
                    <div className="bg-destructive/10 text-destructive p-3 rounded-lg text-sm flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      Connect your Meta account in the Setup tab first.
                    </div>
                  )}

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Campaign Name</Label>
                      <Input placeholder="Summer Lead Gen" value={campaignName} onChange={(e) => setCampaignName(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Objective</Label>
                      <Select value={objective} onValueChange={setObjective}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="OUTCOME_LEADS">Lead Generation</SelectItem>
                          <SelectItem value="OUTCOME_SALES">Conversions / Sales</SelectItem>
                          <SelectItem value="OUTCOME_TRAFFIC">Website Traffic</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Daily Budget ($)</Label>
                      <Input type="number" min="1" value={dailyBudget} onChange={(e) => setDailyBudget(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Target Locations (comma-separated)</Label>
                      <Input placeholder="New York, Los Angeles" value={targetLocation} onChange={(e) => setTargetLocation(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Interests (comma-separated)</Label>
                      <Input placeholder="fitness, health, nutrition" value={targetInterests} onChange={(e) => setTargetInterests(e.target.value)} />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-2">
                        <Label>Age Min</Label>
                        <Input type="number" value={ageMin} onChange={(e) => setAgeMin(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>Age Max</Label>
                        <Input type="number" value={ageMax} onChange={(e) => setAgeMax(e.target.value)} />
                      </div>
                    </div>
                  </div>

                  {creatives.length > 0 && (
                    <div>
                      <Label className="mb-2 block">Selected Creatives ({creatives.length})</Label>
                      <div className="flex gap-2 flex-wrap">
                        {creatives.map((c) => (
                          <img key={c.name} src={c.url} alt={c.name} className="h-16 w-16 rounded object-cover border border-border" />
                        ))}
                      </div>
                    </div>
                  )}

                  <Button
                    size="lg"
                    className="w-full"
                    disabled={launching || !campaignName || !hasCredentials}
                    onClick={launchCampaign}
                  >
                    {launching ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Megaphone className="h-4 w-4 mr-2" />}
                    Launch Campaign (5 credits)
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* DASHBOARD TAB */}
            <TabsContent value="dashboard">
              <Card>
                <CardHeader>
                  <CardTitle>Campaign Dashboard</CardTitle>
                  <CardDescription>Monitor your active ad campaigns.</CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingCampaigns ? (
                    <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
                  ) : campaigns.length === 0 ? (
                    <p className="text-center py-8 text-muted-foreground">No campaigns yet. Launch your first one!</p>
                  ) : (
                    <div className="space-y-4">
                      {campaigns.map((c) => (
                        <div key={c.id} className="border border-border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              {statusIcon(c.status)}
                              <h3 className="font-semibold">{c.campaign_name}</h3>
                              <Badge variant={c.status === "active" ? "default" : c.status === "error" ? "destructive" : "secondary"}>
                                {c.status}
                              </Badge>
                            </div>
                            <span className="text-sm text-muted-foreground">
                              ${(c.daily_budget_cents / 100).toFixed(2)}/day
                            </span>
                          </div>

                          {c.error_message && (
                            <div className="bg-destructive/10 text-destructive text-sm p-2 rounded mb-2">
                              {c.error_message}
                            </div>
                          )}

                          <div className="grid grid-cols-4 gap-4 text-center">
                            <div>
                              <p className="text-2xl font-bold">{c.performance?.impressions || 0}</p>
                              <p className="text-xs text-muted-foreground">Impressions</p>
                            </div>
                            <div>
                              <p className="text-2xl font-bold">{c.performance?.clicks || 0}</p>
                              <p className="text-xs text-muted-foreground">Clicks</p>
                            </div>
                            <div>
                              <p className="text-2xl font-bold">${((c.performance?.spend_cents || 0) / 100).toFixed(2)}</p>
                              <p className="text-xs text-muted-foreground">Spend</p>
                            </div>
                            <div>
                              <p className="text-2xl font-bold">{c.performance?.leads || 0}</p>
                              <p className="text-xs text-muted-foreground">Leads</p>
                            </div>
                          </div>

                          {c.ad_copy && (
                            <div className="mt-3 text-sm bg-muted/50 p-2 rounded">
                              <span className="font-medium">AI Copy:</span> {c.ad_copy.headline} — {c.ad_copy.body || c.ad_copy.primary_text || ""}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
        <Footer />
      </div>
    </AuthGate>
  );
};

export default MediaBuyer;
