import { Link, useLocation } from "react-router-dom";
import { AuthGate } from "@/components/AuthGate";
import { LayoutDashboard, FileText, Users, Calendar, Settings, ScrollText, CreditCard, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Overview", path: "/admin", icon: LayoutDashboard },
  { label: "Applications", path: "/admin/applications", icon: FileText },
  { label: "Members", path: "/admin/members", icon: Users },
  { label: "Cohorts", path: "/admin/cohorts", icon: Calendar },
  { label: "Submissions", path: "/admin/submissions", icon: BookOpen },
  { label: "Payments", path: "/admin/payments", icon: CreditCard },
  { label: "Settings", path: "/admin/settings", icon: Settings },
  { label: "Mod Log", path: "/admin/modlog", icon: ScrollText },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();

  return (
    <AuthGate requireChiefArchitect>
      <div className="min-h-screen bg-background flex">
        <aside className="hidden md:flex w-56 flex-col border-r border-border bg-card">
          <div className="p-4 border-b border-border">
            <Link to="/admin" className="text-sm font-bold tracking-[0.15em] text-foreground">CHIEF ARCHITECT</Link>
          </div>
          <nav className="flex-1 p-2 space-y-0.5">
            {navItems.map((item) => {
              const active = pathname === item.path || (item.path !== "/admin" && pathname.startsWith(item.path));
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors",
                    active ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="p-4 border-t border-border">
            <Link to="/engine" className="text-xs text-muted-foreground hover:text-foreground transition-colors">← Back to Engine</Link>
          </div>
        </aside>

        <div className="flex-1 flex flex-col min-w-0">
          <header className="md:hidden border-b border-border bg-card">
            <div className="flex items-center gap-1 px-2 py-2 overflow-x-auto scrollbar-hide">
              {navItems.map((item) => {
                const active = pathname === item.path || (item.path !== "/admin" && pathname.startsWith(item.path));
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={cn(
                      "flex items-center gap-1 rounded-md px-2 py-1.5 text-[11px] whitespace-nowrap transition-colors shrink-0",
                      active ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground"
                    )}
                  >
                    <item.icon className="h-3 w-3" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </header>

          <main className="flex-1 p-3 md:p-8 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </AuthGate>
  );
}
