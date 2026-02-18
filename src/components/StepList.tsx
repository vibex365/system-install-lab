interface Step {
  label: string;
  active?: boolean;
}

export function StepList({ steps }: { steps: Step[] }) {
  return (
    <div className="space-y-0">
      {steps.map((step, i) => (
        <div key={step.label} className="flex items-start gap-3">
          <div className="flex flex-col items-center">
            <div
              className={`h-3 w-3 rounded-full border-2 mt-1 ${
                step.active
                  ? "border-primary bg-primary"
                  : "border-border bg-transparent"
              }`}
            />
            {i < steps.length - 1 && (
              <div className="w-px h-8 bg-border" />
            )}
          </div>
          <span
            className={`text-sm ${
              step.active ? "text-foreground font-medium" : "text-muted-foreground"
            }`}
          >
            {step.label}
          </span>
        </div>
      ))}
    </div>
  );
}
