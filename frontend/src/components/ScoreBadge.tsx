import { cn, scoreTone } from "../lib/utils";

interface ScoreBadgeProps {
  score: number | null | undefined;
  label?: string;
}

export function ScoreBadge({ score, label = "ATS" }: ScoreBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em]",
        scoreTone(score),
      )}
    >
      {label}
      <span className="font-mono text-sm tracking-normal">
        {score === null || score === undefined ? "--" : `${Math.round(score)}`}
      </span>
    </span>
  );
}
