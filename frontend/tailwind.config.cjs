/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background) / <alpha-value>)",
        foreground: "hsl(var(--foreground) / <alpha-value>)",
        muted: "hsl(var(--muted) / <alpha-value>)",
        "muted-foreground": "hsl(var(--muted-foreground) / <alpha-value>)",
        surface: "hsl(var(--surface) / <alpha-value>)",
        "surface-strong": "hsl(var(--surface-strong) / <alpha-value>)",
        border: "hsl(var(--border) / <alpha-value>)",
        accent: "hsl(var(--accent) / <alpha-value>)",
        "accent-2": "hsl(var(--accent-2) / <alpha-value>)",
        success: "hsl(var(--success) / <alpha-value>)",
        warning: "hsl(var(--warning) / <alpha-value>)",
        danger: "hsl(var(--danger) / <alpha-value>)"
      },
      fontFamily: {
        sans: ["\"Plus Jakarta Sans\"", "sans-serif"],
        mono: ["\"IBM Plex Mono\"", "monospace"]
      },
      boxShadow: {
        panel: "0 24px 70px rgba(15, 23, 42, 0.18)"
      },
      backgroundImage: {
        mesh: "radial-gradient(circle at top left, rgba(14, 165, 233, 0.18), transparent 32%), radial-gradient(circle at 80% 10%, rgba(245, 158, 11, 0.12), transparent 24%), linear-gradient(180deg, rgba(255,255,255,0.88), rgba(255,255,255,0.74))"
      }
    },
  },
  plugins: [],
};
