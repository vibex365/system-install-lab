import { Link } from "react-router-dom";
import { Bot } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border bg-card/50">
      <div className="container py-16 md:py-20">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-10 md:gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="text-lg font-bold tracking-[0.2em] text-foreground">PFSW</Link>
            <p className="text-sm text-muted-foreground mt-3 max-w-xs leading-relaxed">
              People Fail. Systems Work. Quiz funnels + AI agents for digital entrepreneurs.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-4">Product</h4>
            <nav className="flex flex-col gap-2.5">
              <a href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">How It Works</a>
              <a href="#agents" className="text-sm text-muted-foreground hover:text-foreground transition-colors">AI Agents</a>
              <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Pricing</a>
              <Link to="/api-docs" className="text-sm text-muted-foreground hover:text-foreground transition-colors">API Documentation</Link>
              <a href="#faq" className="text-sm text-muted-foreground hover:text-foreground transition-colors">FAQ</a>
            </nav>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-4">Company</h4>
            <nav className="flex flex-col gap-2.5">
              <Link to="/contact" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Contact</Link>
              <Link to="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Privacy Policy</Link>
              <Link to="/terms" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Terms of Service</Link>
            </nav>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} PFSW. All rights reserved.
          </p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Bot className="h-3.5 w-3.5 text-primary" />
            <span>Powered by AI Agents</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
