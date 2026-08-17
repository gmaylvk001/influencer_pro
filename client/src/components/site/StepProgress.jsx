import { Check } from "lucide-react";

export function StepProgress({ steps, current }) {
  return (
    <ol className="flex items-center gap-2">
      {steps.map((label, i) => {
        const stepNum = i + 1;
        const done = stepNum < current;
        const active = stepNum === current;
        return (
          <li key={label} className="flex flex-1 items-center gap-2">
            <div className="flex flex-col items-center gap-1.5">
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                  done
                    ? "bg-[image:var(--gradient-mint)] text-primary-foreground"
                    : active
                    ? "border-2 border-primary text-primary"
                    : "border border-border text-muted-foreground"
                }`}
              >
                {done ? <Check className="size-4" /> : stepNum}
              </span>
              <span
                className={`hidden text-[11px] font-medium sm:block ${
                  active || done ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {label}
              </span>
            </div>
            {stepNum < steps.length && (
              <span
                className={`h-0.5 flex-1 rounded-full ${
                  done ? "bg-[image:var(--gradient-mint)]" : "bg-border"
                }`}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
