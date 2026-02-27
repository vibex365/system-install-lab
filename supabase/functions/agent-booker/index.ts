import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { workflow_id, step_id, user_id, params, memory } = await req.json();
    if (!workflow_id || !step_id || !user_id) {
      throw new Error("Missing required fields: workflow_id, step_id, user_id");
    }

    const serviceSupabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const maxBookings = params?.max_bookings ?? 10;

    // Get user's booking settings
    const { data: bookingSettings } = await serviceSupabase
      .from("booking_settings")
      .select("*")
      .eq("user_id", user_id)
      .limit(1)
      .single();

    if (!bookingSettings) {
      await serviceSupabase.from("workflow_steps").update({
        status: "completed",
        output: { booked: 0, message: "No booking settings configured. Set up your calendar first." },
        completed_at: new Date().toISOString(),
      }).eq("id", step_id);

      return new Response(JSON.stringify({
        success: true,
        data: { booked: 0 },
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Fetch responsive leads (contacted or sms_sent with email or phone)
    const { data: leads, error: leadsErr } = await serviceSupabase
      .from("leads")
      .select("*")
      .eq("user_id", user_id)
      .in("pipeline_status", ["contacted", "sms_sent"])
      .order("rating", { ascending: false })
      .limit(maxBookings);

    if (leadsErr) throw leadsErr;

    if (!leads || leads.length === 0) {
      await serviceSupabase.from("workflow_steps").update({
        status: "completed",
        output: { booked: 0, message: "No responsive leads found to book" },
        completed_at: new Date().toISOString(),
      }).eq("id", step_id);

      return new Response(JSON.stringify({
        success: true,
        data: { booked: 0 },
        memory_update: { booker_results: { booked: 0 } },
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Get existing bookings for the next 14 days to avoid conflicts
    const now = new Date();
    const twoWeeksOut = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

    const { data: existingBookings } = await serviceSupabase
      .from("bookings")
      .select("scheduled_at, duration_minutes")
      .eq("host_user_id", user_id)
      .gte("scheduled_at", now.toISOString())
      .lte("scheduled_at", twoWeeksOut.toISOString())
      .in("status", ["confirmed", "pending"]);

    const bookedSlots = new Set(
      (existingBookings || []).map((b) => new Date(b.scheduled_at).getTime())
    );

    // Generate available slots from booking settings
    const availableSlots = generateAvailableSlots(
      bookingSettings,
      bookedSlots,
      now,
      twoWeeksOut
    );

    if (availableSlots.length === 0) {
      await serviceSupabase.from("workflow_steps").update({
        status: "completed",
        output: { booked: 0, message: "No available slots in the next 14 days" },
        completed_at: new Date().toISOString(),
      }).eq("id", step_id);

      return new Response(JSON.stringify({
        success: true,
        data: { booked: 0 },
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Book leads into available slots
    let booked = 0;
    const results: Array<{ lead_id: string; business: string; scheduled_at: string; status: string }> = [];

    for (let i = 0; i < leads.length && i < availableSlots.length; i++) {
      const lead = leads[i];
      const slot = availableSlots[i];

      const guestName = lead.contact_name || lead.business_name;
      const guestEmail = lead.email || `${lead.business_name.toLowerCase().replace(/\s+/g, "")}@placeholder.local`;

      const { error: insertErr } = await serviceSupabase.from("bookings").insert({
        host_user_id: user_id,
        lead_id: lead.id,
        guest_name: guestName,
        guest_email: guestEmail,
        guest_phone: lead.phone || null,
        scheduled_at: slot.toISOString(),
        duration_minutes: bookingSettings.slot_duration_minutes,
        status: "confirmed",
        notes: `Auto-booked by agent for ${lead.business_name}`,
      });

      if (!insertErr) {
        booked++;
        results.push({
          lead_id: lead.id,
          business: lead.business_name,
          scheduled_at: slot.toISOString(),
          status: "booked",
        });

        // Log to outreach_log
        await serviceSupabase.from("outreach_log").insert({
          user_id,
          lead_id: lead.id,
          channel: "email",
          recipient_email: guestEmail,
          company_name: lead.business_name,
          email_subject: `Strategy Call Booked — ${slot.toISOString()}`,
          email_body: `Auto-booked by agent for ${lead.business_name}`,
          delivery_status: "sent",
        });

        // Update lead pipeline status
        await serviceSupabase.from("leads").update({
          pipeline_status: "booked",
          notes: `${lead.notes || ""}\n\nCall booked: ${slot.toISOString()}`.trim(),
          updated_at: new Date().toISOString(),
        }).eq("id", lead.id).eq("user_id", user_id);

        // Send email notification for booked lead
        try {
          await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/notify-lead-booked`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              lead_id: lead.id,
              lead_name: lead.business_name,
              user_id,
              scheduled_at: slot.toISOString(),
            }),
          });
        } catch (notifyErr) {
          console.error(`Failed to notify for ${lead.business_name}:`, notifyErr);
        }
      } else {
        console.error(`Failed to book ${lead.business_name}:`, insertErr);
        results.push({
          lead_id: lead.id,
          business: lead.business_name,
          scheduled_at: slot.toISOString(),
          status: "failed",
        });
      }
    }

    const result = {
      total_leads: leads.length,
      available_slots: availableSlots.length,
      booked,
      top_results: results.slice(0, 10),
    };

    // Update workflow step
    await serviceSupabase.from("workflow_steps").update({
      status: "completed",
      output: result,
      completed_at: new Date().toISOString(),
    }).eq("id", step_id);

    // Advance next step
    const { data: nextStep } = await serviceSupabase
      .from("workflow_steps")
      .select("id, agent_id, input")
      .eq("workflow_id", workflow_id)
      .eq("status", "pending")
      .order("position", { ascending: true })
      .limit(1)
      .single();

    if (nextStep) {
      await serviceSupabase.from("workflow_steps").update({
        status: "running",
        started_at: new Date().toISOString(),
      }).eq("id", nextStep.id);

      const agentFnName = `agent-${nextStep.agent_id.replace(/_/g, "-")}`;
      const updatedMemory = { ...memory, booker_results: result };

      try {
        await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/${agentFnName}`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            workflow_id,
            step_id: nextStep.id,
            user_id,
            params: nextStep.input,
            memory: updatedMemory,
          }),
        });
      } catch (chainErr) {
        console.error(`Failed to chain ${agentFnName}:`, chainErr);
      }
    } else {
      await serviceSupabase.from("workflows").update({
        status: "completed",
        updated_at: new Date().toISOString(),
      }).eq("id", workflow_id);
    }

    // Update workflow memory
    await serviceSupabase.from("workflows").update({
      memory: { ...memory, booker_results: result },
      updated_at: new Date().toISOString(),
    }).eq("id", workflow_id);

    return new Response(JSON.stringify({ success: true, data: result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Booker agent error:", err);
    return new Response(JSON.stringify({ success: false, error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function generateAvailableSlots(
  settings: {
    available_days: number[];
    start_hour: number;
    end_hour: number;
    slot_duration_minutes: number;
    timezone: string;
  },
  bookedSlots: Set<number>,
  from: Date,
  to: Date
): Date[] {
  const slots: Date[] = [];
  const current = new Date(from);
  // Start from tomorrow to avoid same-day bookings
  current.setDate(current.getDate() + 1);
  current.setHours(0, 0, 0, 0);

  while (current <= to && slots.length < 50) {
    const dayOfWeek = current.getDay();

    if (settings.available_days.includes(dayOfWeek)) {
      for (let hour = settings.start_hour; hour < settings.end_hour; hour++) {
        for (let min = 0; min < 60; min += settings.slot_duration_minutes) {
          const slot = new Date(current);
          slot.setHours(hour, min, 0, 0);

          if (slot > from && !bookedSlots.has(slot.getTime())) {
            slots.push(new Date(slot));
          }
        }
      }
    }

    current.setDate(current.getDate() + 1);
  }

  return slots;
}
