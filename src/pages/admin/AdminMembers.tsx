import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { StatusPill } from "@/components/StatusPill";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import type { Tables } from "@/integrations/supabase/types";

type Profile = Tables<"profiles">;

export default function AdminMembers() {
  const { toast } = useToast();
  const [members, setMembers] = useState<Profile[]>([]);
  const [editing, setEditing] = useState<Profile | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [loading, setLoading] = useState(true);

  const fetch = async () => {
    setLoading(true);
    const { data } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
    setMembers(data ?? []);
    setLoading(false);
  };

  useEffect(() => { fetch(); }, []);

  const startEdit = (m: Profile) => {
    setEditing(m);
    setEditForm({
      member_status: m.member_status,
      member_tier: m.member_tier || "standard",
      invite_multiplier: m.invite_multiplier,
      invite_reputation_score: m.invite_reputation_score,
    });
  };

  const saveEdit = async () => {
    if (!editing) return;
    const { error } = await supabase.from("profiles").update(editForm).eq("id", editing.id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }

    // Toggle admin role if needed — check current role then add/remove
    toast({ title: "Member updated" });
    setEditing(null);
    fetch();
  };

  const sc = (s: string) => s === "active" ? "active" : "muted";

  if (editing) {
    return (
      <AdminShell>
        <div className="max-w-md">
          <Button variant="ghost" size="sm" onClick={() => setEditing(null)} className="mb-4 text-xs">← Back</Button>
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-base">{editing.full_name || editing.email}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Member Status</label>
                <Select value={editForm.member_status} onValueChange={(v) => setEditForm({ ...editForm, member_status: v })}>
                  <SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="accepted_pending_payment">Accepted (Pending Payment)</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Member Tier</label>
                <Select value={editForm.member_tier} onValueChange={(v) => setEditForm({ ...editForm, member_tier: v })}>
                  <SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="founding">Founding</SelectItem>
                    <SelectItem value="standard">Standard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Invite Multiplier</label>
                <Input type="number" step="0.1" value={editForm.invite_multiplier} onChange={(e) => setEditForm({ ...editForm, invite_multiplier: parseFloat(e.target.value) })} className="bg-background border-border" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Reputation Score</label>
                <Input type="number" value={editForm.invite_reputation_score} onChange={(e) => setEditForm({ ...editForm, invite_reputation_score: parseInt(e.target.value) })} className="bg-background border-border" />
              </div>
              <Button size="sm" onClick={saveEdit}>Save</Button>
            </CardContent>
          </Card>
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell>
      <h1 className="text-xl font-bold text-foreground mb-4">Members</h1>
      {loading ? (
        <div className="flex justify-center py-12"><div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="text-left px-4 py-2.5 text-muted-foreground font-medium text-xs">Email</th>
                <th className="text-left px-4 py-2.5 text-muted-foreground font-medium text-xs">Status</th>
                <th className="text-left px-4 py-2.5 text-muted-foreground font-medium text-xs hidden sm:table-cell">Tier</th>
                <th className="text-left px-4 py-2.5 text-muted-foreground font-medium text-xs hidden md:table-cell">Joined</th>
                <th className="text-left px-4 py-2.5 text-muted-foreground font-medium text-xs">Edit</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.id} className="border-t border-border">
                  <td className="px-4 py-2.5 text-foreground">{m.email}</td>
                  <td className="px-4 py-2.5"><StatusPill label={m.member_status} variant={sc(m.member_status)} /></td>
                  <td className="px-4 py-2.5 text-muted-foreground capitalize hidden sm:table-cell">{m.member_tier || "—"}</td>
                  <td className="px-4 py-2.5 text-muted-foreground hidden md:table-cell">{format(new Date(m.created_at), "MMM d")}</td>
                  <td className="px-4 py-2.5">
                    <Button size="sm" variant="ghost" className="text-xs h-7" onClick={() => startEdit(m)}>Edit</Button>
                  </td>
                </tr>
              ))}
              {members.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No members.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </AdminShell>
  );
}
