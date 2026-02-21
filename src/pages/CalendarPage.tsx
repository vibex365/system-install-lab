import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { AuthGate } from "@/components/AuthGate";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarDays, Copy, CheckCheck, Settings, Clock, X, Check, Loader2 } from "lucide-react";
import { format } from "date-fns";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const TIMEZONES = [
  "America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles",
  "America/Phoenix", "America/Anchorage", "Pacific/Honolulu", "UTC",
];

interface BookingSetting {
  id: string;
  user_id: string;
  display_name: string;
  timezone: string;
  available_days: number[];
  start_hour: number;
  end_hour: number;
  slot_duration_minutes: number;
  booking_slug: string;
}

interface Booking {
  id: string;
  guest_name: string;
  guest_email: string;
  guest_phone: string | null;
  scheduled_at: string;
  duration_minutes: number;
  status: string;
  notes: string | null;
}

export default function CalendarPage() {
  return (
    <AuthGate requireActive>
      <CalendarContent />
    </AuthGate>
  );
}

function CalendarContent() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [settings, setSettings] = useState<BookingSetting | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Edit form
  const [displayName, setDisplayName] = useState("");
  const [timezone, setTimezone] = useState("America/New_York");
  const [availableDays, setAvailableDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [startHour, setStartHour] = useState(9);
  const [endHour, setEndHour] = useState(17);
  const [slotDuration, setSlotDuration] = useState(30);
  const [bookingSlug, setBookingSlug] = useState("");

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    const [settingsRes, bookingsRes] = await Promise.all([
      supabase.from("booking_settings").select("*").eq("user_id", user.id).maybeSingle(),
      supabase.from("bookings").select("*").eq("host_user_id", user.id).order("scheduled_at", { ascending: true }),
    ]);

    if (settingsRes.data) {
      const s = settingsRes.data as BookingSetting;
      setSettings(s);
      setDisplayName(s.display_name);
      setTimezone(s.timezone);
      setAvailableDays(s.available_days);
      setStartHour(s.start_hour);
      setEndHour(s.end_hour);
      setSlotDuration(s.slot_duration_minutes);
      setBookingSlug(s.booking_slug);
    } else {
      // Generate a default slug from user email
      const defaultSlug = user.email?.split("@")[0]?.replace(/[^a-z0-9]/g, "") || user.id.slice(0, 8);
      setBookingSlug(defaultSlug);
      setDisplayName(profile?.full_name || "");
      setShowSettings(true);
    }
    setBookings((bookingsRes.data as Booking[]) || []);
    setLoading(false);
  };

  const saveSettings = async () => {
    if (!user || !bookingSlug.trim()) return;
    setSaving(true);
    try {
      const payload = {
        user_id: user.id,
        display_name: displayName.trim() || "Book a Call",
        timezone,
        available_days: availableDays,
        start_hour: startHour,
        end_hour: endHour,
        slot_duration_minutes: slotDuration,
        booking_slug: bookingSlug.trim().toLowerCase().replace(/[^a-z0-9-]/g, ""),
      };
      if (settings) {
        const { error } = await supabase.from("booking_settings").update(payload).eq("id", settings.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("booking_settings").insert(payload);
        if (error) throw error;
      }
      toast({ title: "Settings saved" });
      fetchData();
      setShowSettings(false);
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const updateBookingStatus = async (id: string, status: string) => {
    await supabase.from("bookings").update({ status }).eq("id", id);
    fetchData();
  };

  const copyLink = () => {
    const url = `${window.location.origin}/book/${settings?.booking_slug || bookingSlug}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleDay = (day: number) => {
    setAvailableDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    );
  };

  const upcomingBookings = bookings.filter((b) => b.status === "confirmed" && new Date(b.scheduled_at) >= new Date());
  const pastBookings = bookings.filter((b) => b.status !== "confirmed" || new Date(b.scheduled_at) < new Date());

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-20 pb-20">
        <div className="container max-w-4xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-xl font-bold text-foreground">Smart Calendar</h1>
              <p className="text-xs text-muted-foreground">Manage your availability and bookings</p>
            </div>
            <div className="flex gap-2">
              {settings && (
                <Button size="sm" variant="outline" onClick={copyLink} className="text-xs border-border">
                  {copied ? <CheckCheck className="h-3 w-3 mr-1 text-emerald-400" /> : <Copy className="h-3 w-3 mr-1" />}
                  {copied ? "Copied!" : "Copy Link"}
                </Button>
              )}
              <Button size="sm" variant="outline" onClick={() => setShowSettings(!showSettings)} className="text-xs border-border">
                <Settings className="h-3 w-3 mr-1" /> Settings
              </Button>
            </div>
          </div>

          {/* Settings Panel */}
          {showSettings && (
            <Card className="bg-card border-border mb-6">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Booking Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs">Display Name</Label>
                    <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="e.g. Discovery Call with John" className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs">Booking Slug</Label>
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-xs text-muted-foreground shrink-0">/book/</span>
                      <Input value={bookingSlug} onChange={(e) => setBookingSlug(e.target.value)} placeholder="your-slug" />
                    </div>
                  </div>
                </div>

                <div>
                  <Label className="text-xs mb-2 block">Available Days</Label>
                  <div className="flex gap-2">
                    {DAYS.map((d, i) => (
                      <button
                        key={i}
                        onClick={() => toggleDay(i)}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${
                          availableDays.includes(i)
                            ? "bg-primary/20 text-primary border-primary/40"
                            : "bg-transparent text-muted-foreground border-border"
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid sm:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-xs">Start Hour</Label>
                    <Select value={String(startHour)} onValueChange={(v) => setStartHour(Number(v))}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 24 }, (_, i) => (
                          <SelectItem key={i} value={String(i)}>{String(i).padStart(2, "0")}:00</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">End Hour</Label>
                    <Select value={String(endHour)} onValueChange={(v) => setEndHour(Number(v))}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 24 }, (_, i) => (
                          <SelectItem key={i} value={String(i)}>{String(i).padStart(2, "0")}:00</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Timezone</Label>
                    <Select value={timezone} onValueChange={setTimezone}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {TIMEZONES.map((tz) => (
                          <SelectItem key={tz} value={tz}>{tz.replace("_", " ")}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button onClick={saveSettings} disabled={saving} className="w-full sm:w-auto">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                  Save Settings
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Upcoming Bookings */}
          <Card className="bg-card border-border mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-primary" />
                Upcoming Bookings
                {upcomingBookings.length > 0 && (
                  <Badge variant="secondary" className="text-[10px]">{upcomingBookings.length}</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {upcomingBookings.length === 0 ? (
                <p className="text-xs text-muted-foreground py-4 text-center">No upcoming bookings yet. Share your booking link to get started.</p>
              ) : (
                <div className="space-y-3">
                  {upcomingBookings.map((b) => (
                    <div key={b.id} className="flex items-center justify-between gap-3 bg-muted/30 rounded-md p-3">
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-foreground">{b.guest_name}</p>
                        <p className="text-[10px] text-muted-foreground">{b.guest_email}</p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <Clock className="h-3 w-3 text-primary" />
                          <span className="text-[10px] text-foreground">
                            {format(new Date(b.scheduled_at), "EEE, MMM d 'at' h:mm a")} · {b.duration_minutes}min
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-1.5 shrink-0">
                        <Button size="sm" variant="outline" className="h-6 text-[10px] px-2 text-emerald-400 border-emerald-500/30" onClick={() => updateBookingStatus(b.id, "completed")}>
                          <Check className="h-3 w-3 mr-0.5" /> Done
                        </Button>
                        <Button size="sm" variant="outline" className="h-6 text-[10px] px-2 text-destructive border-destructive/30" onClick={() => updateBookingStatus(b.id, "cancelled")}>
                          <X className="h-3 w-3 mr-0.5" /> Cancel
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Past Bookings */}
          {pastBookings.length > 0 && (
            <Card className="bg-card border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-muted-foreground">Past / Cancelled</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {pastBookings.slice(0, 10).map((b) => (
                    <div key={b.id} className="flex items-center justify-between gap-3 p-2">
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground">{b.guest_name} — {format(new Date(b.scheduled_at), "MMM d, h:mm a")}</p>
                      </div>
                      <Badge variant="outline" className={`text-[10px] ${b.status === "completed" ? "text-emerald-400" : "text-muted-foreground"}`}>
                        {b.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
