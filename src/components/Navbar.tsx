import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

const publicLinks = [
  { label: "Doctrine", href: "#doctrine" },
  { label: "FAQ", href: "#faq" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, profile, isChiefArchitect, isLead, logout } = useAuth();
  const navigate = useNavigate();

  const isActive = profile?.member_status === "active" || isChiefArchitect;

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

  const memberLinks = (
    <>
      <Link to="/engine" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Engine</Link>
      <Link to="/crm" className="text-sm text-muted-foreground hover:text-foreground transition-colors">CRM</Link>
      <Link to="/calendar" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Calendar</Link>
      <Link to="/library" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Library</Link>
      <Link to="/agents" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Agents</Link>
      <Link to="/magazine/inside" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Magazine</Link>
    </>
  );

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

          {user && isActive && memberLinks}
          {user && isChiefArchitect && (
            <Link to="/admin" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Admin</Link>
          )}
          {user && isLead && (
            <Link to="/lead/dashboard" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Lead</Link>
          )}

          {user && !isActive && !isChiefArchitect && (
            <Link to="/status" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Status</Link>
          )}

          {user ? (
            <button onClick={handleLogout} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <LogOut className="h-3.5 w-3.5" /> Log Out
            </button>
          ) : (
            <>
              <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Log In</Link>
              <Button asChild size="sm" className="tracking-wide"><Link to="/apply">Apply</Link></Button>
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

            {user && isActive && (
              <>
                <Link to="/engine" onClick={() => setMobileOpen(false)} className="text-sm text-muted-foreground hover:text-foreground transition-colors">Engine</Link>
                <Link to="/crm" onClick={() => setMobileOpen(false)} className="text-sm text-muted-foreground hover:text-foreground transition-colors">CRM</Link>
                <Link to="/calendar" onClick={() => setMobileOpen(false)} className="text-sm text-muted-foreground hover:text-foreground transition-colors">Calendar</Link>
                <Link to="/library" onClick={() => setMobileOpen(false)} className="text-sm text-muted-foreground hover:text-foreground transition-colors">Library</Link>
                <Link to="/agents" onClick={() => setMobileOpen(false)} className="text-sm text-muted-foreground hover:text-foreground transition-colors">Agents</Link>
                <Link to="/magazine/inside" onClick={() => setMobileOpen(false)} className="text-sm text-muted-foreground hover:text-foreground transition-colors">Magazine</Link>
              </>
            )}
            {user && isChiefArchitect && (
              <Link to="/admin" onClick={() => setMobileOpen(false)} className="text-sm text-muted-foreground hover:text-foreground transition-colors">Admin</Link>
            )}
            {user && isLead && (
              <Link to="/lead/dashboard" onClick={() => setMobileOpen(false)} className="text-sm text-muted-foreground hover:text-foreground transition-colors">Lead</Link>
            )}
            {user && !isActive && !isChiefArchitect && (
              <Link to="/status" onClick={() => setMobileOpen(false)} className="text-sm text-muted-foreground hover:text-foreground transition-colors">Status</Link>
            )}

            {user ? (
              <button onClick={handleLogout} className="text-sm text-muted-foreground hover:text-foreground transition-colors text-left">Log Out</button>
            ) : (
              <>
                <Link to="/login" onClick={() => setMobileOpen(false)} className="text-sm text-muted-foreground hover:text-foreground transition-colors">Log In</Link>
                <Button asChild size="sm" className="w-fit tracking-wide"><Link to="/apply">Apply</Link></Button>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
