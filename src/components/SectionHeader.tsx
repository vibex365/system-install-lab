interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  id?: string;
}

export function SectionHeader({ title, subtitle, id }: SectionHeaderProps) {
  return (
    <div id={id} className="mb-12 md:mb-16 scroll-mt-24">
      <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-foreground">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-4 text-lg text-muted-foreground max-w-2xl">{subtitle}</p>
      )}
    </div>
  );
}
