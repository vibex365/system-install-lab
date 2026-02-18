import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { StatusPill } from "@/components/StatusPill";

export default function AdminPayments() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("payments").select("*").order("created_at", { ascending: false }).then(({ data }) => {
      setPayments(data || []);
      setLoading(false);
    });
  }, []);

  return (
    <AdminShell>
      <h1 className="text-xl font-bold text-foreground mb-4">Payments</h1>
      {loading ? (
        <div className="flex justify-center py-12"><div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="text-left px-4 py-2.5 text-muted-foreground font-medium text-xs">Email</th>
                <th className="text-left px-4 py-2.5 text-muted-foreground font-medium text-xs">Type</th>
                <th className="text-left px-4 py-2.5 text-muted-foreground font-medium text-xs">Amount</th>
                <th className="text-left px-4 py-2.5 text-muted-foreground font-medium text-xs">Status</th>
                <th className="text-left px-4 py-2.5 text-muted-foreground font-medium text-xs hidden md:table-cell">Date</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id} className="border-t border-border">
                  <td className="px-4 py-2.5 text-foreground">{p.email}</td>
                  <td className="px-4 py-2.5 text-muted-foreground capitalize">{p.type?.replace("_", " ")}</td>
                  <td className="px-4 py-2.5 text-foreground">${(p.amount / 100).toFixed(2)}</td>
                  <td className="px-4 py-2.5"><StatusPill label={p.status} variant={p.status === "paid" ? "active" : "muted"} /></td>
                  <td className="px-4 py-2.5 text-muted-foreground hidden md:table-cell">{format(new Date(p.created_at), "MMM d, h:mm a")}</td>
                </tr>
              ))}
              {payments.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No payments recorded.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </AdminShell>
  );
}
