import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Settings } from "lucide-react";

export default function AdminSettings() {
  const { toast } = useToast();
  const [meta, setMeta] = useState<any>(null);
  const [form, setForm] = useState({ version: "v1", founding_access_open: true, base_price: 500 });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.from("system_meta").select("*").limit(1).single().then(({ data }) => {
      if (data) {
        setMeta(data);
        setForm({ version: data.version, founding_access_open: data.founding_access_open, base_price: data.base_price });
      }
    });
  }, []);

  const save = async () => {
    if (!meta) return;
    setSaving(true);
    const { error } = await supabase.from("system_meta").update({ ...form, updated_at: new Date().toISOString() }).eq("id", meta.id);
    setSaving(false);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Settings saved" });
  };

  return (
    <AdminShell>
      <h1 className="text-xl font-bold text-foreground mb-4">System Settings</h1>
      <Card className="bg-card border-border max-w-md">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Settings className="h-4 w-4 text-primary" /> Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Version</label>
            <Select value={form.version} onValueChange={(v) => setForm({ ...form, version: v })}>
              <SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="v1">v1</SelectItem>
                <SelectItem value="v2">v2</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between">
            <label className="text-xs text-muted-foreground">Founding Access Open</label>
            <Switch checked={form.founding_access_open} onCheckedChange={(v) => setForm({ ...form, founding_access_open: v })} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Base Price (cents)</label>
            <Input type="number" value={form.base_price} onChange={(e) => setForm({ ...form, base_price: parseInt(e.target.value) || 0 })} className="bg-background border-border" />
          </div>
          <Button size="sm" onClick={save} disabled={saving}>{saving ? "Saving..." : "Save Settings"}</Button>
        </CardContent>
      </Card>
    </AdminShell>
  );
}
