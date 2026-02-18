import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

export default function AdminModLog() {
  const [actions, setActions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("moderation_actions")
        .select("*, admin:profiles!moderation_actions_admin_id_fkey(full_name, email)")
        .order("created_at", { ascending: false })
        .limit(100);
      setActions(data ?? []);
      setLoading(false);
    };
    load();
  }, []);

  return (
    <AdminShell>
      <h1 className="text-xl font-bold text-foreground mb-4">Moderation Log</h1>
      {loading ? (
        <div className="flex justify-center py-12"><div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="text-left px-4 py-2.5 text-muted-foreground font-medium text-xs">Time</th>
                <th className="text-left px-4 py-2.5 text-muted-foreground font-medium text-xs">Admin</th>
                <th className="text-left px-4 py-2.5 text-muted-foreground font-medium text-xs">Action</th>
                <th className="text-left px-4 py-2.5 text-muted-foreground font-medium text-xs">Target</th>
                <th className="text-left px-4 py-2.5 text-muted-foreground font-medium text-xs hidden sm:table-cell">Reason</th>
              </tr>
            </thead>
            <tbody>
              {actions.map((a) => (
                <tr key={a.id} className="border-t border-border">
                  <td className="px-4 py-2.5 text-muted-foreground text-xs">{format(new Date(a.created_at), "MMM d, h:mm a")}</td>
                  <td className="px-4 py-2.5 text-foreground text-xs">{a.admin?.full_name || a.admin?.email || "—"}</td>
                  <td className="px-4 py-2.5 text-foreground text-xs">{a.action_type}</td>
                  <td className="px-4 py-2.5 text-muted-foreground text-xs">{a.target_type}</td>
                  <td className="px-4 py-2.5 text-muted-foreground text-xs hidden sm:table-cell">{a.reason || "—"}</td>
                </tr>
              ))}
              {actions.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No moderation actions.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </AdminShell>
  );
}
