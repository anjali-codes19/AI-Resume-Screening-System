export function cn(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(" ");
}

export function formatDate(value: string | null | undefined): string {
  if (!value) {
    return "Pending";
  }

  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function scoreTone(score: number | null | undefined): string {
  if (score === null || score === undefined) {
    return "bg-surface text-muted-foreground";
  }
  if (score >= 85) {
    return "bg-success/15 text-success";
  }
  if (score >= 70) {
    return "bg-warning/15 text-warning";
  }
  return "bg-danger/15 text-danger";
}

export function initials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}
