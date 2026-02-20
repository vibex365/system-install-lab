import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { AuthGate } from "@/components/AuthGate";
import { LayoutDashboard, FileText, Users, Calendar, Settings, ScrollText, CreditCard, BookOpen, Menu, X, Bot } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Overview", path: "/admin", icon: LayoutDashboard },
  { label: "Applications", path: "/admin/applications", icon: FileText },
  { label: "Members", path: "/admin/members", icon: Users },
  { label: "Cohorts", path: "/admin/cohorts", icon: Calendar },
  { label: "Submissions", path: "/admin/submissions", icon: BookOpen },
  { label: "Payments", path: "/admin/payments", icon: CreditCard },
  { label: "Settings", path: "/admin/settings", icon: Settings },
  { label: "Agents", path: "/admin/agents", icon: Bot },
  { label: "Mod Log", path: "/admin/modlog", icon: ScrollText },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

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
            <div className="flex items-center justify-between px-3 py-2.5">
              <Link to="/admin" className="text-sm font-bold tracking-[0.15em] text-foreground">CHIEF ARCHITECT</Link>
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
            {mobileOpen && (
              <nav className="border-t border-border px-2 py-2 space-y-0.5 bg-card">
                {navItems.map((item) => {
                  const active = pathname === item.path || (item.path !== "/admin" && pathname.startsWith(item.path));
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileOpen(false)}
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
                <Link to="/engine" onClick={() => setMobileOpen(false)} className="flex items-center gap-2.5 rounded-md px-3 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors">← Back to Engine</Link>
              </nav>
            )}
          </header>

          <main className="flex-1 p-3 md:p-8 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </AuthGate>
  );
}
