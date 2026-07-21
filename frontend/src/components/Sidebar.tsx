import { BriefcaseBusiness, ChartNoAxesColumn, FileSearch, ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";

import type { UserRole } from "../types";

const roleCopy: Record<
  UserRole,
  {
    title: string;
    subtitle: string;
    items: Array<{ label: string; description: string; icon: ReactNode }>;
  }
> = {
  candidate: {
    title: "Candidate Workspace",
    subtitle: "Improve resume readiness and track recruiter-facing fit signals.",
    items: [
      {
        label: "Resume Ops",
        description: "Upload and analyze multiple resume versions.",
        icon: <FileSearch size={18} />,
      },
      {
        label: "ATS Signals",
        description: "Monitor score trends and missing keywords.",
        icon: <ChartNoAxesColumn size={18} />,
      },
      {
        label: "Fit Readiness",
        description: "See where your profile stands for active roles.",
        icon: <ShieldCheck size={18} />,
      },
    ],
  },
  recruiter: {
    title: "Recruiter Command",
    subtitle: "Screen, rank, and export candidate intelligence from one place.",
    items: [
      {
        label: "Job Intake",
        description: "Create roles from text or upload job descriptions.",
        icon: <BriefcaseBusiness size={18} />,
      },
      {
        label: "Ranking Engine",
        description: "Compare candidates with ATS, semantic, and skill signals.",
        icon: <ChartNoAxesColumn size={18} />,
      },
      {
        label: "Governance",
        description: "Export reports with auditable screening evidence.",
        icon: <ShieldCheck size={18} />,
      },
    ],
  },
};

interface SidebarProps {
  role: UserRole;
}

export function Sidebar({ role }: SidebarProps) {
  const copy = roleCopy[role];

  return (
    <aside className="hidden min-h-screen w-[320px] flex-col justify-between border-r border-border/60 bg-surface-strong/70 p-8 xl:flex">
      <div>
        <div className="inline-flex items-center gap-3 rounded-full border border-border/60 bg-background/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-accent">
          TalentLens
        </div>
        <div className="mt-8">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            {copy.title}
          </h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">{copy.subtitle}</p>
        </div>

        <div className="mt-10 space-y-4">
          {copy.items.map((item) => (
            <div
              key={item.label}
              className="rounded-[24px] border border-border/50 bg-background/50 p-5"
            >
              <div className="flex items-center gap-3 text-accent">
                {item.icon}
                <p className="text-sm font-semibold text-foreground">{item.label}</p>
              </div>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-[28px] border border-border/60 bg-background/60 p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent-2">
          Why teams use it
        </p>
        <p className="mt-3 text-base font-semibold text-foreground">
          Consistent resume intelligence without manual spreadsheet triage.
        </p>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Blend semantic matching, ATS heuristics, and skills evidence into one
          workflow that is easier to defend to hiring managers.
        </p>
      </div>
    </aside>
  );
}
