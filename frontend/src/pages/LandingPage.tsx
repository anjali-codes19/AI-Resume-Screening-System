import { motion } from "framer-motion";
import {
  ArrowRight,
  BrainCircuit,
  BriefcaseBusiness,
  ChartColumnBig,
  Shield,
  Sparkles,
  UsersRound,
} from "lucide-react";
import { Link } from "react-router-dom";

import { ThemeToggle } from "../components/ThemeToggle";
import { useAuth } from "../contexts/AuthContext";

const featureCards = [
  {
    title: "AI Resume Intelligence",
    description:
      "Parse PDF resumes into structured skills, education, projects, and experience with ATS-oriented scoring.",
    icon: <BrainCircuit size={20} />,
  },
  {
    title: "Recruiter Ranking Engine",
    description:
      "Compare candidates against job descriptions with semantic similarity, skill match, and practical recommendations.",
    icon: <UsersRound size={20} />,
  },
  {
    title: "Enterprise Reporting",
    description:
      "Export recruiter-ready reports, monitor screening funnel health, and keep evidence visible for every score.",
    icon: <ChartColumnBig size={20} />,
  },
];

export function LandingPage() {
  const { isAuthenticated, user } = useAuth();
  const primaryHref = isAuthenticated
    ? user?.role === "candidate"
      ? "/candidate"
      : "/recruiter"
    : "/register";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between rounded-[28px] border border-border/60 bg-surface/80 px-5 py-4 shadow-panel backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent/15 text-accent">
              <Sparkles size={18} />
            </div>
            <div>
              <p className="text-sm font-semibold">TalentLens</p>
              <p className="text-xs text-muted-foreground">
                AI Resume Screening System
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="hidden rounded-2xl border border-border/70 px-4 py-2 text-sm font-medium text-muted-foreground transition hover:border-accent/40 hover:text-foreground sm:inline-flex"
            >
              Sign in
            </Link>
            <ThemeToggle />
          </div>
        </header>

        <section className="relative mt-6 overflow-hidden rounded-[36px] border border-border/60 bg-surface/85 px-6 py-12 shadow-panel backdrop-blur sm:px-10 lg:px-12 lg:py-16">
          <div className="absolute inset-0 bg-mesh opacity-80 dark:opacity-20" />
          <div className="relative grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
            >
              <p className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-accent">
                Production-ready hiring intelligence
              </p>
              <h1 className="mt-6 max-w-3xl text-4xl font-semibold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                Screen resumes like an enterprise talent platform, not a spreadsheet.
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-8 text-muted-foreground sm:text-lg">
                TalentLens gives candidates actionable ATS guidance and gives
                recruiters a defensible ranking engine backed by semantic matching,
                missing skill analysis, role-specific suggestions, and downloadable
                reports.
              </p>

              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  to={primaryHref}
                  className="inline-flex items-center gap-2 rounded-2xl bg-foreground px-5 py-3 text-sm font-semibold text-background transition hover:opacity-90"
                >
                  {isAuthenticated ? "Open workspace" : "Launch platform"}
                  <ArrowRight size={16} />
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center gap-2 rounded-2xl border border-border/70 px-5 py-3 text-sm font-semibold text-foreground transition hover:border-accent/40 hover:text-accent"
                >
                  Create account
                </Link>
              </div>

              <div className="mt-10 grid gap-4 sm:grid-cols-3">
                {[
                  { value: "94%", label: "Resume field extraction coverage" },
                  { value: "5x", label: "Faster recruiter shortlist generation" },
                  { value: "JWT", label: "Role-based access control" },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-[24px] border border-border/60 bg-background/55 p-4"
                  >
                    <p className="text-2xl font-semibold text-foreground">{item.value}</p>
                    <p className="mt-2 text-sm text-muted-foreground">{item.label}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.45, delay: 0.1 }}
              className="grid gap-4"
            >
              <div className="rounded-[28px] border border-border/60 bg-surface-strong/80 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">
                      Recruiter snapshot
                    </p>
                    <p className="mt-3 text-2xl font-semibold">Top fit in 1 click</p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/15 text-accent">
                    <BriefcaseBusiness size={20} />
                  </div>
                </div>
                <div className="mt-6 space-y-4">
                  {[
                    { role: "Senior AI Platform Engineer", score: "92 ATS", status: "Strong fit" },
                    { role: "Recruiter Analytics Frontend Lead", score: "87 ATS", status: "Review" },
                  ].map((row) => (
                    <div
                      key={row.role}
                      className="flex items-center justify-between rounded-2xl border border-border/60 bg-background/60 px-4 py-3"
                    >
                      <div>
                        <p className="font-medium text-foreground">{row.role}</p>
                        <p className="text-xs text-muted-foreground">{row.status}</p>
                      </div>
                      <span className="rounded-full bg-success/15 px-3 py-1 text-xs font-semibold text-success">
                        {row.score}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-[28px] border border-border/60 bg-surface-strong/80 p-6">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent-2/12 text-accent-2">
                    <Shield size={20} />
                  </div>
                  <p className="mt-4 text-lg font-semibold">JWT-secured workflows</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Candidate and recruiter modules stay isolated while sharing one API surface.
                  </p>
                </div>
                <div className="rounded-[28px] border border-border/60 bg-surface-strong/80 p-6">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent/12 text-accent">
                    <ChartColumnBig size={20} />
                  </div>
                  <p className="mt-4 text-lg font-semibold">Visual screening analytics</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Recharts dashboards show funnel health, ATS movement, and ranking quality.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        <section className="mt-8 grid gap-5 lg:grid-cols-3">
          {featureCards.map((card, index) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: index * 0.08 }}
              className="rounded-[28px] border border-border/60 bg-surface/85 p-6 shadow-panel"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/12 text-accent">
                {card.icon}
              </div>
              <h3 className="mt-5 text-xl font-semibold">{card.title}</h3>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                {card.description}
              </p>
            </motion.div>
          ))}
        </section>
      </div>
    </div>
  );
}
