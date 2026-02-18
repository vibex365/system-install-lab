import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="container py-12 md:py-16">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-sm text-muted-foreground tracking-wide">
            People Fail, Systems Work.
          </p>
          <nav className="flex items-center gap-6">
            <Link to="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Privacy
            </Link>
            <Link to="/terms" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Terms
            </Link>
            <a href="mailto:hello@pfsw.io" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Contact
            </a>
          </nav>
        </div>
      </div>
    </footer>
  );
}
