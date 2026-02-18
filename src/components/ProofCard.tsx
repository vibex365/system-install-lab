interface ProofCardProps {
  title: string;
  description: string;
}

export function ProofCard({ title, description }: ProofCardProps) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 transition-all hover:border-primary/30">
      <p className="text-xs font-medium uppercase tracking-widest text-primary mb-3">Case Study</p>
      <h4 className="text-base font-semibold text-foreground mb-2">{title}</h4>
      <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}
