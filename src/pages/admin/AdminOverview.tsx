import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { FileText, Users, MessageSquare, Shield } from "lucide-react";

export default function AdminOverview() {
  const [stats, setStats] = useState({ pendingApps: 0, activeMembers: 0, recentPosts: 0 });
  const [modActions, setModActions] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      const [appsRes, membersRes, postsRes, modRes] = await Promise.all([
        supabase.from("applications").select("id", { count: "exact" }).eq("status", "submitted"),
        supabase.from("profiles").select("id", { count: "exact" }).eq("member_status", "active"),
        supabase.from("posts").select("id", { count: "exact" }).gte("created_at", new Date(Date.now() - 86400000).toISOString()),
        supabase.from("moderation_actions").select("*, admin:profiles!moderation_actions_admin_id_fkey(full_name, email)").order("created_at", { ascending: false }).limit(10),
      ]);
      setStats({
        pendingApps: appsRes.count || 0,
        activeMembers: membersRes.count || 0,
        recentPosts: postsRes.count || 0,
      });
      setModActions(modRes.data || []);
    };
    load();
  }, []);

  return (
    <AdminShell>
      <h1 className="text-xl font-bold text-foreground mb-6">Overview</h1>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard icon={FileText} label="Pending Applications" value={stats.pendingApps} />
        <StatCard icon={Users} label="Active Members" value={stats.activeMembers} />
        <StatCard icon={MessageSquare} label="Posts (24h)" value={stats.recentPosts} />
      </div>

      <h2 className="text-sm font-semibold text-foreground mb-3">Recent Moderation</h2>
      {modActions.length === 0 ? (
        <p className="text-sm text-muted-foreground">No moderation actions yet.</p>
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="text-left px-4 py-2 text-muted-foreground font-medium text-xs">Time</th>
                <th className="text-left px-4 py-2 text-muted-foreground font-medium text-xs">Admin</th>
                <th className="text-left px-4 py-2 text-muted-foreground font-medium text-xs">Action</th>
                <th className="text-left px-4 py-2 text-muted-foreground font-medium text-xs hidden sm:table-cell">Target</th>
              </tr>
            </thead>
            <tbody>
              {modActions.map((a) => (
                <tr key={a.id} className="border-t border-border">
                  <td className="px-4 py-2 text-muted-foreground text-xs">{format(new Date(a.created_at), "MMM d, h:mm a")}</td>
                  <td className="px-4 py-2 text-foreground text-xs">{a.admin?.full_name || a.admin?.email || "—"}</td>
                  <td className="px-4 py-2 text-foreground text-xs">{a.action_type}</td>
                  <td className="px-4 py-2 text-muted-foreground text-xs hidden sm:table-cell">{a.target_type}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminShell>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: any; label: string; value: number }) {
  return (
    <Card className="bg-card border-border">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-1">
          <Icon className="h-4 w-4 text-primary" />
          <span className="text-xs text-muted-foreground">{label}</span>
        </div>
        <p className="text-2xl font-bold text-foreground">{value}</p>
      </CardContent>
    </Card>
  );
}
