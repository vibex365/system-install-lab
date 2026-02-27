import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, LogOut } from "lucide-react";
import { NotificationCenter } from "@/components/NotificationCenter";
import { useAuth } from "@/hooks/use-auth";

const publicLinks = [
  { label: "Doctrine", href: "#doctrine" },
  { label: "FAQ", href: "#faq" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, subscribed, isChiefArchitect, isLead, logout } = useAuth();
  const navigate = useNavigate();

  const hasAccess = subscribed || isChiefArchitect;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleAnchor = (href: string) => {
    setMobileOpen(false);
    const el = document.querySelector(href);
    el?.scrollIntoView({ behavior: "smooth" });
  };

  const handleLogout = async () => {
    await logout();
    setMobileOpen(false);
    navigate("/");
  };

  const memberLinks = hasAccess ? (
    <>
      <Link to="/dashboard" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Dashboard</Link>
      <Link to="/dashboard/workflows" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Workflows</Link>
      <Link to="/crm" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Leads</Link>
      <Link to="/agents" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Agents</Link>
      <Link to="/analytics" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Analytics</Link>
      <Link to="/calendar" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Calendar</Link>
    </>
  ) : null;

  const limitedLinks = user && !hasAccess ? (
    <>
      <Link to="/dashboard" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Dashboard</Link>
      <Link to="/upgrade" className="text-sm text-primary font-medium hover:text-primary/80 transition-colors">Upgrade</Link>
    </>
  ) : null;

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-background/80 backdrop-blur-lg border-b border-border" : "bg-transparent"
      }`}
    >
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="text-lg font-bold tracking-[0.2em] text-foreground">PFSW</Link>

        {/* Desktop */}
        <nav className="hidden md:flex items-center gap-8">
          {!user && publicLinks.map((link) => (
            <button key={link.href} onClick={() => handleAnchor(link.href)} className="text-sm text-muted-foreground hover:text-foreground transition-colors tracking-wide">
              {link.label}
            </button>
          ))}

          {memberLinks}
          {limitedLinks}

          {user && isChiefArchitect && (
            <Link to="/admin" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Admin</Link>
          )}
          {user && isLead && (
            <Link to="/lead/dashboard" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Lead</Link>
          )}

          {user ? (
            <div className="flex items-center gap-2">
              <NotificationCenter />
              <button onClick={handleLogout} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <LogOut className="h-3.5 w-3.5" /> Log Out
              </button>
            </div>
          ) : (
            <>
              <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Log In</Link>
              <Button asChild size="sm" className="tracking-wide"><Link to="/login">Get Started</Link></Button>
            </>
          )}
        </nav>

        {/* Mobile toggle */}
        <button className="md:hidden text-foreground" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-background/95 backdrop-blur-lg border-b border-border">
          <nav className="container flex flex-col gap-4 py-6">
            {!user && publicLinks.map((link) => (
              <button key={link.href} onClick={() => handleAnchor(link.href)} className="text-sm text-muted-foreground hover:text-foreground transition-colors text-left tracking-wide">
                {link.label}
              </button>
            ))}

            {user && hasAccess && (
              <>
                <Link to="/dashboard" onClick={() => setMobileOpen(false)} className="text-sm text-muted-foreground hover:text-foreground transition-colors">Dashboard</Link>
                <Link to="/dashboard/workflows" onClick={() => setMobileOpen(false)} className="text-sm text-muted-foreground hover:text-foreground transition-colors">Workflows</Link>
                <Link to="/crm" onClick={() => setMobileOpen(false)} className="text-sm text-muted-foreground hover:text-foreground transition-colors">Leads</Link>
                <Link to="/agents" onClick={() => setMobileOpen(false)} className="text-sm text-muted-foreground hover:text-foreground transition-colors">Agents</Link>
                <Link to="/analytics" onClick={() => setMobileOpen(false)} className="text-sm text-muted-foreground hover:text-foreground transition-colors">Analytics</Link>
                <Link to="/calendar" onClick={() => setMobileOpen(false)} className="text-sm text-muted-foreground hover:text-foreground transition-colors">Calendar</Link>
              </>
            )}
            {user && !hasAccess && (
              <>
                <Link to="/dashboard" onClick={() => setMobileOpen(false)} className="text-sm text-muted-foreground hover:text-foreground transition-colors">Dashboard</Link>
                <Link to="/upgrade" onClick={() => setMobileOpen(false)} className="text-sm text-primary font-medium hover:text-primary/80 transition-colors">Upgrade</Link>
              </>
            )}
            {user && isChiefArchitect && (
              <Link to="/admin" onClick={() => setMobileOpen(false)} className="text-sm text-muted-foreground hover:text-foreground transition-colors">Admin</Link>
            )}
            {user && isLead && (
              <Link to="/lead/dashboard" onClick={() => setMobileOpen(false)} className="text-sm text-muted-foreground hover:text-foreground transition-colors">Lead</Link>
            )}

            {user ? (
              <button onClick={handleLogout} className="text-sm text-muted-foreground hover:text-foreground transition-colors text-left">Log Out</button>
            ) : (
              <>
                <Link to="/login" onClick={() => setMobileOpen(false)} className="text-sm text-muted-foreground hover:text-foreground transition-colors">Log In</Link>
                <Button asChild size="sm" className="w-fit tracking-wide"><Link to="/login">Get Started</Link></Button>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
