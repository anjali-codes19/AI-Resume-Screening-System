export type UserRole = "candidate" | "recruiter";

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload extends LoginPayload {
  full_name: string;
}

export interface TrendPoint {
  label: string;
  score: number;
}

export interface ParsedResume {
  name: string;
  skills: string[];
  education: string[];
  projects: string[];
  experience: string[];
  estimated_years_experience: number;
  sections: Record<string, string[]>;
}

export interface ResumeRecord {
  id: number;
  filename: string;
  extracted_name: string;
  base_ats_score: number;
  parsed_data: ParsedResume;
  suggestions: string[];
  created_at: string;
}

export interface ResumeUploadResponse {
  resume: ResumeRecord;
  parsed_resume: ParsedResume;
}

export interface CandidateScreeningSnapshot {
  screening_id: number;
  job_id: number;
  job_title: string;
  ats_score: number;
  ranking_position: number | null;
  missing_skills: string[];
  matched_skills: string[];
  created_at: string;
}

export interface CandidateSummary {
  total_resumes: number;
  total_screenings: number;
  latest_resume_score: number | null;
  average_match_score: number | null;
}

export interface CandidateDashboardResponse {
  summary: CandidateSummary;
  score_trend: TrendPoint[];
  top_skills: string[];
  resumes: ResumeRecord[];
  screenings: CandidateScreeningSnapshot[];
}

export interface JobRead {
  id: number;
  title: string;
  department: string | null;
  location: string | null;
  employment_type: string | null;
  description_text: string;
  parsed_requirements: {
    title: string;
    skills: string[];
    education_preferences: string[];
    responsibilities: string[];
    required_years_experience: number;
  };
  created_at: string;
  candidate_count: number;
  average_score: number | null;
}

export interface CandidateRankingRow {
  candidate_id: number;
  candidate_name: string;
  email: string;
  resume_id: number;
  ats_score: number;
  skill_match_score: number;
  semantic_similarity: number;
  matched_skills: string[];
  missing_skills: string[];
  suggestions: string[];
  ranking_position: number | null;
  uploaded_at: string | null;
}

export interface RecruiterSummary {
  total_jobs: number;
  total_candidates: number;
  screened_resumes: number;
  average_score: number | null;
}

export interface PipelineMetric {
  label: string;
  value: number;
}

export interface RecruiterDashboardResponse {
  summary: RecruiterSummary;
  pipeline: PipelineMetric[];
  jobs: JobRead[];
  top_candidates: CandidateRankingRow[];
}

export interface JobCreatePayload {
  title: string;
  description_text: string;
  department?: string;
  location?: string;
  employment_type?: string;
}
