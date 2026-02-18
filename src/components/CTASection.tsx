import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface CTASectionProps {
  headline: string;
  primaryLabel: string;
  primaryTo: string;
  secondaryLabel?: string;
  secondaryTo?: string;
  disclaimer?: string;
}

export function CTASection({
  headline,
  primaryLabel,
  primaryTo,
  secondaryLabel,
  secondaryTo,
  disclaimer,
}: CTASectionProps) {
  return (
    <div className="text-center py-20 md:py-28">
      <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-foreground mb-8 max-w-3xl mx-auto">
        {headline}
      </h2>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <Button asChild size="lg" className="tracking-wide px-8">
          <Link to={primaryTo}>{primaryLabel}</Link>
        </Button>
        {secondaryLabel && secondaryTo && (
          <Button asChild variant="outline" size="lg" className="tracking-wide px-8 border-primary/30 text-foreground hover:bg-primary/10">
            <Link to={secondaryTo}>{secondaryLabel}</Link>
          </Button>
        )}
      </div>
      {disclaimer && (
        <p className="mt-6 text-sm text-muted-foreground">{disclaimer}</p>
      )}
    </div>
  );
}
