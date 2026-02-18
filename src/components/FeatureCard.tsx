import { type LucideIcon } from "lucide-react";

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  bullets?: string[];
}

export function FeatureCard({ icon: Icon, title, description, bullets }: FeatureCardProps) {
  return (
    <div className="group rounded-2xl border border-border bg-card p-6 md:p-8 transition-all hover:border-primary/30 hover:gold-glow">
      <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <h3 className="text-lg font-semibold tracking-tight text-foreground gold-underline inline-block mb-2">
        {title}
      </h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
      {bullets && bullets.length > 0 && (
        <ul className="mt-4 space-y-2">
          {bullets.map((b, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary" />
              {b}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
