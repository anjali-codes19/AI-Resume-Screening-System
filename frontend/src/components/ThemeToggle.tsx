import { MoonStar, SunMedium } from "lucide-react";

import { useTheme } from "../contexts/ThemeContext";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-border/70 bg-surface/90 text-foreground transition hover:border-accent/50 hover:text-accent"
      aria-label="Toggle theme"
    >
      {theme === "light" ? <MoonStar size={18} /> : <SunMedium size={18} />}
    </button>
  );
}
