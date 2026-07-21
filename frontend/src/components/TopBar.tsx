import { Bell, LogOut } from "lucide-react";

import { useAuth } from "../contexts/AuthContext";
import { initials } from "../lib/utils";
import { ThemeToggle } from "./ThemeToggle";

interface TopBarProps {
  title: string;
  subtitle: string;
}

export function TopBar({ title, subtitle }: TopBarProps) {
  const { logout, user } = useAuth();

  return (
    <header className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">
          Live Workspace
        </p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-foreground">
          {title}
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          {subtitle}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-border/70 bg-surface/90 text-muted-foreground transition hover:border-accent/50 hover:text-accent"
          aria-label="Notifications"
        >
          <Bell size={18} />
        </button>
        <ThemeToggle />
        <div className="flex items-center gap-3 rounded-[22px] border border-border/60 bg-surface/90 px-4 py-2.5">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent/15 text-sm font-semibold text-accent">
            {initials(user?.full_name ?? "TL")}
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">{user?.full_name}</p>
            <p className="text-xs text-muted-foreground">{user?.role}</p>
          </div>
          <button
            type="button"
            onClick={logout}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-muted-foreground transition hover:bg-background/70 hover:text-foreground"
            aria-label="Log out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </header>
  );
}
