const principles = [
  "Systems beat willpower",
  "Clarity beats complexity",
  "Cadence beats intensity",
  "Constraints create leverage",
  "Execution is a skill",
];

export function PrinciplesList() {
  return (
    <div className="space-y-6 md:space-y-8">
      {principles.map((p, i) => (
        <div key={i} className="flex items-baseline gap-6">
          <span className="text-2xl md:text-3xl font-bold text-primary tracking-tight gold-text-glow">
            {String(i + 1).padStart(2, "0")}
          </span>
          <p className="text-lg md:text-xl font-medium text-foreground tracking-tight">{p}</p>
        </div>
      ))}
    </div>
  );
}
