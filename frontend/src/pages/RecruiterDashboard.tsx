import { useEffect, useState, type FormEvent } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowUpRight, Download, FilePlus2, GaugeCircle, Sparkles, Trophy, Users } from "lucide-react";

import { ApiError, recruiterApi } from "../api/client";
import { AppShell } from "../components/AppShell";
import { EmptyState } from "../components/EmptyState";
import { FileDropzone } from "../components/FileDropzone";
import { ScoreBadge } from "../components/ScoreBadge";
import { SectionCard } from "../components/SectionCard";
import { StatCard } from "../components/StatCard";
import { useAuth } from "../contexts/AuthContext";
import { formatDate } from "../lib/utils";
import type { CandidateRankingRow, RecruiterDashboardResponse } from "../types";

const initialJobForm = {
  title: "",
  department: "",
  location: "",
  employment_type: "Full-time",
  description_text: "",
};

export function RecruiterDashboard() {
  const { token } = useAuth();
  const [dashboard, setDashboard] = useState<RecruiterDashboardResponse | null>(null);
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
  const [rankings, setRankings] = useState<CandidateRankingRow[]>([]);
  const [jobForm, setJobForm] = useState(initialJobForm);
  const [jobPdf, setJobPdf] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [creatingJob, setCreatingJob] = useState(false);
  const [rankingJobId, setRankingJobId] = useState<number | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadDashboard() {
    if (!token) {
      return;
    }

    setLoading(true);
    try {
      const response = await recruiterApi.dashboard(token);
      setDashboard(response);
      setError(null);
      if (!selectedJobId && response.jobs[0]) {
        setSelectedJobId(response.jobs[0].id);
      }
    } catch (caughtError) {
      setError(
        caughtError instanceof ApiError
          ? caughtError.message
          : "Unable to load the recruiter dashboard.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadDashboard();
  }, [token]);

  useEffect(() => {
    async function loadRankings() {
      if (!token || !selectedJobId) {
        setRankings([]);
        return;
      }

      try {
        const response = await recruiterApi.candidates(token, selectedJobId);
        setRankings(response);
      } catch {
        setRankings([]);
      }
    }

    void loadRankings();
  }, [selectedJobId, token]);

  async function handleCreateJob(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) {
      return;
    }

    setCreatingJob(true);
    setStatus(null);
    setError(null);
    try {
      const response = await recruiterApi.createJob(token, jobForm);
      setJobForm(initialJobForm);
      setSelectedJobId(response.id);
      setStatus(`Created ${response.title}.`);
      await loadDashboard();
    } catch (caughtError) {
      setError(
        caughtError instanceof ApiError
          ? caughtError.message
          : "Unable to create the job description.",
      );
    } finally {
      setCreatingJob(false);
    }
  }

  async function handleUploadJobPdf() {
    if (!token || !jobPdf || !jobForm.title) {
      return;
    }

    setCreatingJob(true);
    setStatus(null);
    setError(null);
    try {
      const response = await recruiterApi.uploadJobPdf(token, {
        title: jobForm.title,
        department: jobForm.department,
        location: jobForm.location,
        employment_type: jobForm.employment_type,
        file: jobPdf,
      });
      setJobPdf(null);
      setJobForm(initialJobForm);
      setSelectedJobId(response.id);
      setStatus(`Uploaded and parsed ${response.title}.`);
      await loadDashboard();
    } catch (caughtError) {
      setError(
        caughtError instanceof ApiError
          ? caughtError.message
          : "Unable to upload the job description PDF.",
      );
    } finally {
      setCreatingJob(false);
    }
  }

  async function handleRank(jobId: number) {
    if (!token) {
      return;
    }

    setRankingJobId(jobId);
    setError(null);
    try {
      const response = await recruiterApi.rankCandidates(token, jobId);
      setRankings(response);
      setSelectedJobId(jobId);
      setStatus(`Ranked ${response.length} candidates for this role.`);
      await loadDashboard();
    } catch (caughtError) {
      setError(
        caughtError instanceof ApiError
          ? caughtError.message
          : "Unable to rank candidates right now.",
      );
    } finally {
      setRankingJobId(null);
    }
  }

  async function handleDownload(jobId: number, title: string) {
    if (!token) {
      return;
    }

    try {
      await recruiterApi.downloadReport(token, jobId, title);
    } catch (caughtError) {
      setError(
        caughtError instanceof ApiError
          ? caughtError.message
          : "Unable to download the report right now.",
      );
    }
  }

  const selectedJob =
    dashboard?.jobs.find((job) => job.id === selectedJobId) ?? dashboard?.jobs[0] ?? null;
  const jobScoreData = dashboard?.jobs.length
    ? dashboard.jobs.map((job) => ({
        label: job.title.length > 16 ? `${job.title.slice(0, 16)}...` : job.title,
        score: job.average_score ?? 0,
      }))
    : [{ label: "No Jobs", score: 0 }];

  return (
    <AppShell
      role="recruiter"
      title="Recruiter Screening Command"
      subtitle="Create job descriptions, rank candidates, export reports, and monitor funnel quality from one enterprise cockpit."
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Open Jobs"
          value={`${dashboard?.summary.total_jobs ?? 0}`}
          description="Active roles in this workspace"
          icon={<FilePlus2 size={20} />}
        />
        <StatCard
          title="Candidates Screened"
          value={`${dashboard?.summary.screened_resumes ?? 0}`}
          description="Saved ranking outcomes"
          icon={<Users size={20} />}
          accentClass="bg-accent-2/12 text-accent-2"
        />
        <StatCard
          title="Average ATS"
          value={
            dashboard?.summary.average_score !== null &&
            dashboard?.summary.average_score !== undefined
              ? `${Math.round(dashboard.summary.average_score)}`
              : "--"
          }
          description="Average screening score across jobs"
          icon={<GaugeCircle size={20} />}
          accentClass="bg-success/12 text-success"
        />
        <StatCard
          title="Top Candidates"
          value={`${dashboard?.summary.total_candidates ?? 0}`}
          description="Distinct candidates ranked so far"
          icon={<Trophy size={20} />}
          accentClass="bg-warning/12 text-warning"
        />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <SectionCard title="Create Job Description" eyebrow="Recruiter Module">
          <form onSubmit={handleCreateJob} className="grid gap-4">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2">
                <span className="text-sm font-medium">Role title</span>
                <input
                  type="text"
                  required
                  value={jobForm.title}
                  onChange={(event) =>
                    setJobForm((current) => ({ ...current, title: event.target.value }))
                  }
                  className="rounded-2xl border border-border/70 bg-background/60 px-4 py-3 text-sm"
                  placeholder="Senior AI Platform Engineer"
                />
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-medium">Department</span>
                <input
                  type="text"
                  value={jobForm.department}
                  onChange={(event) =>
                    setJobForm((current) => ({ ...current, department: event.target.value }))
                  }
                  className="rounded-2xl border border-border/70 bg-background/60 px-4 py-3 text-sm"
                  placeholder="Engineering"
                />
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-medium">Location</span>
                <input
                  type="text"
                  value={jobForm.location}
                  onChange={(event) =>
                    setJobForm((current) => ({ ...current, location: event.target.value }))
                  }
                  className="rounded-2xl border border-border/70 bg-background/60 px-4 py-3 text-sm"
                  placeholder="Remote"
                />
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-medium">Employment type</span>
                <select
                  value={jobForm.employment_type}
                  onChange={(event) =>
                    setJobForm((current) => ({
                      ...current,
                      employment_type: event.target.value,
                    }))
                  }
                  className="rounded-2xl border border-border/70 bg-background/60 px-4 py-3 text-sm"
                >
                  <option>Full-time</option>
                  <option>Contract</option>
                  <option>Hybrid</option>
                </select>
              </label>
            </div>

            <label className="grid gap-2">
              <span className="text-sm font-medium">Description text</span>
              <textarea
                required
                rows={7}
                value={jobForm.description_text}
                onChange={(event) =>
                  setJobForm((current) => ({
                    ...current,
                    description_text: event.target.value,
                  }))
                }
                className="rounded-[24px] border border-border/70 bg-background/60 px-4 py-3 text-sm leading-6"
                placeholder="Paste the job description, required skills, responsibilities, and experience bands."
              />
            </label>

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={creatingJob}
                className="inline-flex items-center gap-2 rounded-2xl bg-foreground px-5 py-3 text-sm font-semibold text-background transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Sparkles size={16} />
                {creatingJob ? "Saving..." : "Create from text"}
              </button>
            </div>
          </form>

          <div className="mt-6 rounded-[28px] border border-border/60 bg-background/55 p-4">
            <p className="text-sm font-semibold text-foreground">Or upload a JD PDF</p>
            <div className="mt-4 grid gap-4 lg:grid-cols-[0.78fr_0.22fr]">
              <FileDropzone
                id="job-pdf-upload"
                label="Upload job description PDF"
                fileName={jobPdf?.name}
                onChange={setJobPdf}
              />
              <button
                type="button"
                onClick={handleUploadJobPdf}
                disabled={!jobPdf || !jobForm.title || creatingJob}
                className="inline-flex items-center justify-center rounded-2xl bg-accent px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Upload PDF
              </button>
            </div>
          </div>

          {status ? (
            <p className="mt-4 rounded-2xl border border-success/20 bg-success/10 px-4 py-3 text-sm text-success">
              {status}
            </p>
          ) : null}
          {error ? (
            <p className="mt-4 rounded-2xl border border-danger/20 bg-danger/10 px-4 py-3 text-sm text-danger">
              {error}
            </p>
          ) : null}
        </SectionCard>

        <SectionCard title="Pipeline Health" eyebrow="Recharts">
          <div className="h-[340px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dashboard?.pipeline ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.18)" />
                <XAxis
                  dataKey="label"
                  stroke="currentColor"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#94a3b8", fontSize: 12 }}
                />
                <YAxis
                  stroke="currentColor"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#94a3b8", fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(15, 23, 42, 0.92)",
                    border: "1px solid rgba(148,163,184,0.18)",
                    borderRadius: 18,
                  }}
                />
                <Bar dataKey="value" fill="#0ea5e9" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[0.92fr_1.08fr]">
        <SectionCard title="Open Jobs" eyebrow="Ranking Controls">
          {dashboard?.jobs.length ? (
            <div className="space-y-4">
              {dashboard.jobs.map((job) => (
                <div
                  key={job.id}
                  className={`rounded-[24px] border p-4 transition ${
                    selectedJobId === job.id
                      ? "border-accent/40 bg-accent/5"
                      : "border-border/60 bg-background/55"
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <button
                        type="button"
                        onClick={() => setSelectedJobId(job.id)}
                        className="text-left"
                      >
                        <p className="font-semibold text-foreground">{job.title}</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {job.department ?? "General"} • {job.location ?? "Flexible"}
                        </p>
                      </button>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {job.parsed_requirements.skills.slice(0, 5).map((skill) => (
                          <span
                            key={skill}
                            className="rounded-full bg-background px-3 py-1 text-xs font-medium text-muted-foreground"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => void handleRank(job.id)}
                        disabled={rankingJobId === job.id}
                        className="inline-flex items-center gap-2 rounded-2xl bg-foreground px-4 py-2.5 text-sm font-semibold text-background transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <ArrowUpRight size={16} />
                        {rankingJobId === job.id ? "Ranking..." : "Rank candidates"}
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDownload(job.id, job.title)}
                        className="inline-flex items-center gap-2 rounded-2xl border border-border/70 px-4 py-2.5 text-sm font-semibold text-foreground transition hover:border-accent/40 hover:text-accent"
                      >
                        <Download size={16} />
                        Export
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No jobs created yet"
              description="Create or upload a job description to start ranking candidates."
            />
          )}
        </SectionCard>

        <SectionCard title="Average Score by Job" eyebrow="Performance View">
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={jobScoreData}>
                <defs>
                  <linearGradient id="jobScores" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.18)" />
                <XAxis
                  dataKey="label"
                  stroke="currentColor"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#94a3b8", fontSize: 12 }}
                />
                <YAxis
                  stroke="currentColor"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#94a3b8", fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(15, 23, 42, 0.92)",
                    border: "1px solid rgba(148,163,184,0.18)",
                    borderRadius: 18,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="score"
                  stroke="#f59e0b"
                  strokeWidth={3}
                  fill="url(#jobScores)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.08fr_0.92fr]">
        <SectionCard
          title={selectedJob ? `Ranked Candidates for ${selectedJob.title}` : "Ranked Candidates"}
          eyebrow="Best Fit Table"
        >
          {rankings.length ? (
            <div className="space-y-4">
              {rankings.map((candidate) => (
                <div
                  key={`${candidate.candidate_id}-${candidate.resume_id}`}
                  className="rounded-[24px] border border-border/60 bg-background/55 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold text-foreground">
                        #{candidate.ranking_position ?? "--"} {candidate.candidate_name}
                      </p>
                      <p className="text-sm text-muted-foreground">{candidate.email}</p>
                    </div>
                    <ScoreBadge score={candidate.ats_score} label="Fit" />
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-3">
                    <div className="rounded-2xl bg-surface px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
                        Skill Match
                      </p>
                      <p className="mt-2 text-xl font-semibold">{Math.round(candidate.skill_match_score)}</p>
                    </div>
                    <div className="rounded-2xl bg-surface px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent-2">
                        Semantic
                      </p>
                      <p className="mt-2 text-xl font-semibold">{Math.round(candidate.semantic_similarity)}</p>
                    </div>
                    <div className="rounded-2xl bg-surface px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-success">
                        Uploaded
                      </p>
                      <p className="mt-2 text-sm font-semibold">{formatDate(candidate.uploaded_at)}</p>
                    </div>
                  </div>

                  <div className="mt-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
                      Missing Skills
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {candidate.missing_skills.length ? (
                        candidate.missing_skills.map((skill) => (
                          <span
                            key={skill}
                            className="rounded-full bg-danger/10 px-3 py-1 text-xs font-medium text-danger"
                          >
                            {skill}
                          </span>
                        ))
                      ) : (
                        <span className="rounded-full bg-success/10 px-3 py-1 text-xs font-medium text-success">
                          No critical gaps
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No ranking data yet"
              description="Run candidate ranking for a job to populate fit scores, missing skills, and recruiter-ready recommendations."
            />
          )}
        </SectionCard>

        <SectionCard title="Leaderboard" eyebrow="Top Candidates">
          {dashboard?.top_candidates.length ? (
            <div className="space-y-3">
              {dashboard.top_candidates.map((candidate) => (
                <div
                  key={`${candidate.candidate_id}-${candidate.resume_id}`}
                  className="rounded-[24px] border border-border/60 bg-background/55 p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-foreground">{candidate.candidate_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {candidate.matched_skills.slice(0, 3).join(", ") || "General fit"}
                      </p>
                    </div>
                    <ScoreBadge score={candidate.ats_score} label="ATS" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="Leaderboard is empty"
              description="Once jobs are ranked, your strongest candidates will be highlighted here."
            />
          )}
        </SectionCard>
      </div>
    </AppShell>
  );
}
