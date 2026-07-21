import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";

import { ApiError } from "../api/client";
import { ThemeToggle } from "../components/ThemeToggle";
import { useAuth } from "../contexts/AuthContext";
import type { UserRole } from "../types";

const roleOptions: UserRole[] = ["candidate", "recruiter"];

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [role, setRole] = useState<UserRole>("candidate");
  const [formState, setFormState] = useState({ email: "", password: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const authenticatedRole = await login(formState);
      navigate(authenticatedRole === "candidate" ? "/candidate" : "/recruiter");
    } catch (caughtError) {
      setError(
        caughtError instanceof ApiError
          ? caughtError.message
          : "Unable to sign in right now.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-6">
      <div className="mx-auto flex max-w-6xl items-center justify-between">
        <Link to="/" className="text-sm font-semibold text-foreground">
          TalentLens
        </Link>
        <ThemeToggle />
      </div>

      <div className="mx-auto mt-10 grid max-w-6xl gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-[36px] border border-border/60 bg-surface/85 p-8 shadow-panel">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">
            Secure access
          </p>
          <h1 className="mt-5 text-4xl font-semibold tracking-tight">
            Step back into your screening workspace.
          </h1>
          <p className="mt-4 text-sm leading-7 text-muted-foreground">
            Use the seeded demo credentials or your own account. Candidate and
            recruiter sessions automatically route to the correct dashboard.
          </p>

          <div className="mt-8 rounded-[28px] border border-border/60 bg-background/55 p-5">
            <p className="text-sm font-semibold">Demo accounts</p>
            <div className="mt-4 space-y-3 text-sm text-muted-foreground">
              <p>
                Candidate: <span className="font-medium text-foreground">aanya.patel@example.com</span>
              </p>
              <p>
                Password: <span className="font-medium text-foreground">Candidate123</span>
              </p>
              <p>
                Recruiter: <span className="font-medium text-foreground">sara.kim@talentlens.ai</span>
              </p>
              <p>
                Password: <span className="font-medium text-foreground">Recruiter123</span>
              </p>
            </div>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-[36px] border border-border/60 bg-surface/85 p-8 shadow-panel"
        >
          <div className="inline-flex rounded-full border border-border/70 bg-background/60 p-1">
            {roleOptions.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setRole(option)}
                className={`rounded-full px-4 py-2 text-sm font-medium capitalize transition ${
                  role === option
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {option}
              </button>
            ))}
          </div>

          <div className="mt-6 grid gap-4">
            <label className="grid gap-2">
              <span className="text-sm font-medium">Email</span>
              <input
                type="email"
                required
                value={formState.email}
                onChange={(event) =>
                  setFormState((current) => ({ ...current, email: event.target.value }))
                }
                className="rounded-2xl border border-border/70 bg-background/60 px-4 py-3 text-sm"
                placeholder={role === "candidate" ? "candidate@example.com" : "recruiter@company.com"}
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-medium">Password</span>
              <input
                type="password"
                required
                value={formState.password}
                onChange={(event) =>
                  setFormState((current) => ({ ...current, password: event.target.value }))
                }
                className="rounded-2xl border border-border/70 bg-background/60 px-4 py-3 text-sm"
                placeholder="Enter your password"
              />
            </label>
          </div>

          {error ? (
            <p className="mt-4 rounded-2xl border border-danger/20 bg-danger/10 px-4 py-3 text-sm text-danger">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={submitting}
            className="mt-6 inline-flex w-full items-center justify-center rounded-2xl bg-foreground px-5 py-3 text-sm font-semibold text-background transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Signing in..." : `Sign in as ${role}`}
          </button>

          <p className="mt-5 text-sm text-muted-foreground">
            Need an account?{" "}
            <Link to="/register" className="font-semibold text-accent">
              Create one
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
