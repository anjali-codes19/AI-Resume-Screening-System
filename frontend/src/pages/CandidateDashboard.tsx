import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { BriefcaseBusiness, Gauge, History, Sparkles, Upload, WandSparkles } from "lucide-react";

import { ApiError, candidateApi } from "../api/client";
import { AppShell } from "../components/AppShell";
import { EmptyState } from "../components/EmptyState";
import { FileDropzone } from "../components/FileDropzone";
import { ScoreBadge } from "../components/ScoreBadge";
import { SectionCard } from "../components/SectionCard";
import { StatCard } from "../components/StatCard";
import { useAuth } from "../contexts/AuthContext";
import { formatDate } from "../lib/utils";
import type { CandidateDashboardResponse } from "../types";

export function CandidateDashboard() {
  const { token } = useAuth();
  const [dashboard, setDashboard] = useState<CandidateDashboardResponse | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadDashboard() {
    if (!token) {
      return;
    }
    setLoading(true);
    try {
      const response = await candidateApi.dashboard(token);
      setDashboard(response);
      setError(null);
    } catch (caughtError) {
      setError(
        caughtError instanceof ApiError
          ? caughtError.message
          : "Unable to load the candidate dashboard.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadDashboard();
  }, [token]);

  async function handleUpload() {
    if (!token || !selectedFile) {
      return;
    }

    setUploading(true);
    setStatus(null);
    setError(null);
    try {
      const response = await candidateApi.uploadResume(token, selectedFile);
      setStatus(
        `Uploaded ${response.resume.filename}. ATS readiness scored ${Math.round(
          response.resume.base_ats_score,
        )}.`,
      );
      setSelectedFile(null);
      await loadDashboard();
    } catch (caughtError) {
      setError(
        caughtError instanceof ApiError
          ? caughtError.message
          : "Unable to upload your resume.",
      );
    } finally {
      setUploading(false);
    }
  }

  const latestResume = dashboard?.resumes[0] ?? null;
  const scoreTrend = dashboard?.score_trend.length
    ? dashboard.score_trend
    : [{ label: "No Data", score: 0 }];
  const screeningBars = dashboard?.screenings.length
    ? dashboard.screenings.slice(0, 5).map((item) => ({
        label: item.job_title.length > 18 ? `${item.job_title.slice(0, 18)}...` : item.job_title,
        score: item.ats_score,
      }))
    : [{ label: "No Screenings", score: 0 }];

  return (
    <AppShell
      role="candidate"
      title="Resume Readiness Command Center"
      subtitle="Upload resume variants, monitor ATS health, and see how your profile aligns with active recruiter workflows."
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Latest ATS"
          value={
            dashboard?.summary.latest_resume_score !== null &&
            dashboard?.summary.latest_resume_score !== undefined
              ? `${Math.round(dashboard.summary.latest_resume_score)}`
              : "--"
          }
          description="Most recent resume quality score"
          icon={<Gauge size={20} />}
        />
        <StatCard
          title="Average Match"
          value={
            dashboard?.summary.average_match_score !== null &&
            dashboard?.summary.average_match_score !== undefined
              ? `${Math.round(dashboard.summary.average_match_score)}`
              : "--"
          }
          description="Average score across recruiter screenings"
          icon={<BriefcaseBusiness size={20} />}
          accentClass="bg-accent-2/12 text-accent-2"
        />
        <StatCard
          title="Resume Versions"
          value={`${dashboard?.summary.total_resumes ?? 0}`}
          description="Tracked resume submissions"
          icon={<History size={20} />}
          accentClass="bg-success/12 text-success"
        />
        <StatCard
          title="AI Suggestions"
          value={`${latestResume?.suggestions.length ?? 0}`}
          description="Tailoring ideas from your latest resume"
          icon={<WandSparkles size={20} />}
          accentClass="bg-warning/12 text-warning"
        />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <SectionCard title="ATS Score Trend" eyebrow="Progress">
          {loading ? (
            <div className="h-[280px] animate-pulse rounded-[24px] bg-background/60" />
          ) : (
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={scoreTrend}>
                  <defs>
                    <linearGradient id="candidateScore" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0ea5e9" stopOpacity={0.55} />
                      <stop offset="100%" stopColor="#0ea5e9" stopOpacity={0.05} />
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
                    stroke="#0ea5e9"
                    strokeWidth={3}
                    fill="url(#candidateScore)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </SectionCard>

        <SectionCard title="AI Suggestions" eyebrow="Latest Resume">
          {latestResume ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-[22px] border border-border/60 bg-background/60 px-4 py-3">
                <div>
                  <p className="font-medium text-foreground">{latestResume.filename}</p>
                  <p className="text-sm text-muted-foreground">
                    Updated {formatDate(latestResume.created_at)}
                  </p>
                </div>
                <ScoreBadge score={latestResume.base_ats_score} />
              </div>
              <ul className="space-y-3">
                {latestResume.suggestions.map((suggestion) => (
                  <li
                    key={suggestion}
                    className="rounded-2xl border border-border/60 bg-background/50 px-4 py-3 text-sm leading-6 text-muted-foreground"
                  >
                    {suggestion}
                  </li>
                ))}
              </ul>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
                  Top Skills Detected
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {dashboard?.top_skills.map((skill) => (
                    <span
                      key={skill}
                      className="rounded-full bg-accent/10 px-3 py-1.5 text-xs font-medium text-accent"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <EmptyState
              title="No resume uploaded yet"
              description="Upload a PDF resume to unlock ATS scoring, history, and personalized improvement guidance."
            />
          )}
        </SectionCard>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[0.92fr_1.08fr]">
        <SectionCard
          title="Upload New Resume"
          eyebrow="Candidate Module"
          action={
            <button
              type="button"
              onClick={handleUpload}
              disabled={!selectedFile || uploading}
              className="inline-flex items-center gap-2 rounded-2xl bg-foreground px-4 py-2.5 text-sm font-semibold text-background transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Upload size={16} />
              {uploading ? "Uploading..." : "Analyze PDF"}
            </button>
          }
        >
          <FileDropzone
            id="resume-upload"
            label="Drop a tailored resume for ATS scoring"
            fileName={selectedFile?.name}
            onChange={setSelectedFile}
          />
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

        <SectionCard title="Job Match Snapshot" eyebrow="Recent Screenings">
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={screeningBars}>
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
                <Bar dataKey="score" fill="#f59e0b" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_1fr]">
        <SectionCard title="Resume History" eyebrow="Version Tracking">
          {dashboard?.resumes.length ? (
            <div className="space-y-4">
              {dashboard.resumes.map((resume) => (
                <motion.div
                  key={resume.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-[24px] border border-border/60 bg-background/55 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-foreground">{resume.filename}</p>
                      <p className="text-sm text-muted-foreground">
                        Uploaded {formatDate(resume.created_at)}
                      </p>
                    </div>
                    <ScoreBadge score={resume.base_ats_score} />
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {resume.parsed_data.skills.slice(0, 6).map((skill) => (
                      <span
                        key={skill}
                        className="rounded-full bg-background px-3 py-1 text-xs font-medium text-muted-foreground"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No history yet"
              description="Your uploaded resume versions will appear here with extracted skills and ATS quality scores."
            />
          )}
        </SectionCard>

        <SectionCard title="Recruiter Screenings" eyebrow="Ranked Roles">
          {dashboard?.screenings.length ? (
            <div className="space-y-3">
              {dashboard.screenings.map((screening) => (
                <div
                  key={screening.screening_id}
                  className="rounded-[24px] border border-border/60 bg-background/55 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-foreground">{screening.job_title}</p>
                      <p className="text-sm text-muted-foreground">
                        Rank #{screening.ranking_position ?? "--"} • {formatDate(screening.created_at)}
                      </p>
                    </div>
                    <ScoreBadge score={screening.ats_score} label="Match" />
                  </div>
                  <div className="mt-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
                      Missing Skills
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {screening.missing_skills.length ? (
                        screening.missing_skills.map((skill) => (
                          <span
                            key={skill}
                            className="rounded-full bg-danger/10 px-3 py-1 text-xs font-medium text-danger"
                          >
                            {skill}
                          </span>
                        ))
                      ) : (
                        <span className="rounded-full bg-success/10 px-3 py-1 text-xs font-medium text-success">
                          No critical gaps detected
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No recruiter screenings yet"
              description="Once a recruiter ranks candidates against a job, your job match snapshots will show up here."
            />
          )}
        </SectionCard>
      </div>
    </AppShell>
  );
}
