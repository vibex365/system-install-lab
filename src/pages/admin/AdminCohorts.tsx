import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, Users, Calendar } from "lucide-react";

const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function AdminCohorts() {
  const { toast } = useToast();
  const [cohorts, setCohorts] = useState<any[]>([]);
  const [memberCounts, setMemberCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", day_of_week: "1", time_slot: "", capacity: "10" });

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("cohorts").select("*").order("day_of_week");
    setCohorts(data || []);
    const { data: members } = await supabase.from("cohort_members").select("cohort_id");
    const counts: Record<string, number> = {};
    members?.forEach((m) => { counts[m.cohort_id] = (counts[m.cohort_id] || 0) + 1; });
    setMemberCounts(counts);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const create = async () => {
    const { error } = await supabase.from("cohorts").insert({
      name: form.name,
      day_of_week: parseInt(form.day_of_week),
      time_slot: form.time_slot,
      capacity: parseInt(form.capacity),
    });
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Cohort created" });
    setShowCreate(false);
    setForm({ name: "", day_of_week: "1", time_slot: "", capacity: "10" });
    load();
  };

  const toggleActive = async (id: string, active: boolean) => {
    await supabase.from("cohorts").update({ active: !active }).eq("id", id);
    load();
  };

  return (
    <AdminShell>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-foreground">Cohorts</h1>
        <Button size="sm" onClick={() => setShowCreate(!showCreate)}><Plus className="h-3 w-3 mr-1" /> New Cohort</Button>
      </div>

      {showCreate && (
        <Card className="bg-card border-border mb-6 max-w-md">
          <CardContent className="p-4 space-y-3">
            <Input placeholder="Cohort name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="bg-background border-border" />
            <Select value={form.day_of_week} onValueChange={(v) => setForm({ ...form, day_of_week: v })}>
              <SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger>
              <SelectContent>
                {dayNames.map((d, i) => <SelectItem key={i} value={String(i)}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input placeholder="Time slot (e.g. 7:00 PM EST)" value={form.time_slot} onChange={(e) => setForm({ ...form, time_slot: e.target.value })} className="bg-background border-border" />
            <Input type="number" placeholder="Capacity" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} className="bg-background border-border" />
            <Button size="sm" onClick={create} disabled={!form.name || !form.time_slot}>Create</Button>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="space-y-3">
          {cohorts.map((c) => (
            <Card key={c.id} className={`bg-card border-border ${!c.active ? "opacity-50" : ""}`}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-primary" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">{c.name}</p>
                    <p className="text-xs text-muted-foreground">{dayNames[c.day_of_week]} · {c.time_slot} · {memberCounts[c.id] || 0}/{c.capacity} members</p>
                  </div>
                </div>
                <Button size="sm" variant="ghost" className="text-xs" onClick={() => toggleActive(c.id, c.active)}>
                  {c.active ? "Deactivate" : "Activate"}
                </Button>
              </CardContent>
            </Card>
          ))}
          {cohorts.length === 0 && <p className="text-sm text-muted-foreground">No cohorts created yet.</p>}
        </div>
      )}
    </AdminShell>
  );
}
