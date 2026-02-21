import { useState, useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Clock, CheckCircle2, Loader2, ArrowLeft } from "lucide-react";
import { format, addDays, setHours, setMinutes, isBefore, isAfter, isSameDay } from "date-fns";

interface BookingSettings {
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

interface ExistingBooking {
  scheduled_at: string;
  duration_minutes: number;
}

export default function BookingPage() {
  const { slug } = useParams<{ slug: string }>();
  const [settings, setSettings] = useState<BookingSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [existingBookings, setExistingBookings] = useState<ExistingBooking[]>([]);
  const [step, setStep] = useState<"date" | "form" | "confirmed">("date");

  // Form
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      const { data, error } = await supabase
        .from("booking_settings")
        .select("*")
        .eq("booking_slug", slug)
        .maybeSingle();
      if (error || !data) {
        setNotFound(true);
      } else {
        setSettings(data as BookingSettings);
        // Fetch existing bookings for availability check
        const { data: bookings } = await supabase
          .from("bookings")
          .select("scheduled_at, duration_minutes")
          .eq("host_user_id", data.user_id)
          .eq("status", "confirmed")
          .gte("scheduled_at", new Date().toISOString());
        setExistingBookings((bookings as ExistingBooking[]) || []);
      }
      setLoading(false);
    })();
  }, [slug]);

  const availableSlots = useMemo(() => {
    if (!settings || !selectedDate) return [];
    const dayOfWeek = selectedDate.getDay();
    if (!settings.available_days.includes(dayOfWeek)) return [];

    const slots: string[] = [];
    for (let h = settings.start_hour; h < settings.end_hour; h++) {
      for (let m = 0; m < 60; m += settings.slot_duration_minutes) {
        const slotTime = setMinutes(setHours(selectedDate, h), m);
        if (isBefore(slotTime, new Date())) continue;

        const isBooked = existingBookings.some((b) => {
          const bStart = new Date(b.scheduled_at);
          const bEnd = new Date(bStart.getTime() + b.duration_minutes * 60000);
          const slotEnd = new Date(slotTime.getTime() + settings.slot_duration_minutes * 60000);
          return slotTime < bEnd && slotEnd > bStart;
        });

        if (!isBooked) {
          slots.push(format(slotTime, "HH:mm"));
        }
      }
    }
    return slots;
  }, [settings, selectedDate, existingBookings]);

  const isDateDisabled = (date: Date) => {
    if (!settings) return true;
    if (isBefore(date, addDays(new Date(), -1))) return true;
    return !settings.available_days.includes(date.getDay());
  };

  const handleSubmit = async () => {
    if (!settings || !selectedDate || !selectedSlot || !guestName.trim() || !guestEmail.trim()) return;
    setSubmitting(true);
    try {
      const [hours, minutes] = selectedSlot.split(":").map(Number);
      const scheduledAt = setMinutes(setHours(selectedDate, hours), minutes);

      const { error } = await supabase.from("bookings").insert({
        host_user_id: settings.user_id,
        guest_name: guestName.trim(),
        guest_email: guestEmail.trim(),
        guest_phone: guestPhone.trim() || null,
        scheduled_at: scheduledAt.toISOString(),
        duration_minutes: settings.slot_duration_minutes,
        notes: notes.trim() || null,
      });
      if (error) throw error;
      setStep("confirmed");
    } catch (e: any) {
      console.error("Booking error:", e);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (notFound || !settings) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <h1 className="text-lg font-bold text-foreground mb-2">Booking page not found</h1>
            <p className="text-sm text-muted-foreground">This booking link is invalid or no longer active.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-lg w-full border-border">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-3 p-3 rounded-full bg-primary/10 border border-primary/30 w-fit">
            <CalendarDays className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-lg">{settings.display_name}</CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            {settings.slot_duration_minutes} min · {settings.timezone}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {step === "confirmed" ? (
            <div className="text-center py-8 space-y-3">
              <CheckCircle2 className="h-12 w-12 text-emerald-400 mx-auto" />
              <h2 className="text-lg font-bold text-foreground">You're booked!</h2>
              <p className="text-sm text-muted-foreground">
                {format(
                  setMinutes(setHours(selectedDate!, parseInt(selectedSlot!.split(":")[0])), parseInt(selectedSlot!.split(":")[1])),
                  "EEEE, MMMM d 'at' h:mm a"
                )}
              </p>
              <p className="text-xs text-muted-foreground">A confirmation will be sent to {guestEmail}</p>
            </div>
          ) : step === "form" ? (
            <div className="space-y-4">
              <button onClick={() => setStep("date")} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-3 w-3" /> Back
              </button>
              <div className="bg-muted/40 rounded-md p-3 flex items-center gap-3">
                <Clock className="h-4 w-4 text-primary shrink-0" />
                <div>
                  <p className="text-xs font-medium text-foreground">
                    {selectedDate && format(selectedDate, "EEEE, MMMM d")}
                  </p>
                  <p className="text-xs text-muted-foreground">{selectedSlot} · {settings.slot_duration_minutes} min</p>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Name *</label>
                  <Input value={guestName} onChange={(e) => setGuestName(e.target.value)} placeholder="Your name" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Email *</label>
                  <Input type="email" value={guestEmail} onChange={(e) => setGuestEmail(e.target.value)} placeholder="you@email.com" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Phone (optional)</label>
                  <Input value={guestPhone} onChange={(e) => setGuestPhone(e.target.value)} placeholder="+1 (555) 000-0000" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Notes (optional)</label>
                  <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Anything you'd like to discuss?" className="min-h-[60px]" />
                </div>
              </div>
              <Button onClick={handleSubmit} disabled={submitting || !guestName.trim() || !guestEmail.trim()} className="w-full">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Confirm Booking
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(d) => { setSelectedDate(d); setSelectedSlot(null); }}
                disabled={isDateDisabled}
                className="mx-auto"
              />
              {selectedDate && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-foreground">
                    Available slots — {format(selectedDate, "EEEE, MMMM d")}
                  </p>
                  {availableSlots.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No available slots for this day.</p>
                  ) : (
                    <div className="grid grid-cols-3 gap-2">
                      {availableSlots.map((slot) => (
                        <button
                          key={slot}
                          onClick={() => setSelectedSlot(slot)}
                          className={`py-2 px-3 rounded-md text-xs font-medium border transition-colors ${
                            selectedSlot === slot
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-background border-border text-foreground hover:border-primary/50"
                          }`}
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                  )}
                  {selectedSlot && (
                    <Button onClick={() => setStep("form")} className="w-full mt-2">
                      Continue
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
