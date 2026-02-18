import { Link, useLocation } from "react-router-dom";
import { AuthGate } from "@/components/AuthGate";
import { LayoutDashboard, FileText, Users, Shield, Settings, ScrollText } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Overview", path: "/admin", icon: LayoutDashboard },
  { label: "Applications", path: "/admin/applications", icon: FileText },
  { label: "Members", path: "/admin/members", icon: Users },
  { label: "Boards", path: "/admin/boards", icon: Shield },
  { label: "Settings", path: "/admin/settings", icon: Settings },
  { label: "Mod Log", path: "/admin/modlog", icon: ScrollText },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();

  return (
    <AuthGate requireAdmin>
      <div className="min-h-screen bg-background flex">
        {/* Sidebar */}
        <aside className="hidden md:flex w-56 flex-col border-r border-border bg-card">
          <div className="p-4 border-b border-border">
            <Link to="/admin" className="text-sm font-bold tracking-[0.15em] text-foreground">PFSW ADMIN</Link>
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
            <Link to="/board" className="text-xs text-muted-foreground hover:text-foreground transition-colors">← Back to Board</Link>
          </div>
        </aside>

        {/* Mobile header */}
        <div className="flex-1 flex flex-col">
          <header className="md:hidden flex items-center gap-2 p-3 border-b border-border bg-card overflow-x-auto">
            {navItems.map((item) => {
              const active = pathname === item.path || (item.path !== "/admin" && pathname.startsWith(item.path));
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs whitespace-nowrap transition-colors",
                    active ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground"
                  )}
                >
                  <item.icon className="h-3.5 w-3.5" />
                  {item.label}
                </Link>
              );
            })}
          </header>

          <main className="flex-1 p-4 md:p-8 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </AuthGate>
  );
}
