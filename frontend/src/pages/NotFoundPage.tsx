import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md rounded-[32px] border border-border/60 bg-surface/85 p-8 text-center shadow-panel">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">
          404
        </p>
        <h1 className="mt-4 text-3xl font-semibold text-foreground">
          This workspace route does not exist.
        </h1>
        <p className="mt-4 text-sm leading-7 text-muted-foreground">
          Head back to the landing page and reopen the correct candidate or recruiter dashboard.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex rounded-2xl bg-foreground px-5 py-3 text-sm font-semibold text-background"
        >
          Return home
        </Link>
      </div>
    </div>
  );
}
