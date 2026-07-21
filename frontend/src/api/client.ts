import type {
  CandidateDashboardResponse,
  CandidateRankingRow,
  JobCreatePayload,
  JobRead,
  LoginPayload,
  RecruiterDashboardResponse,
  RegisterPayload,
  ResumeRecord,
  ResumeUploadResponse,
  TokenResponse,
  User,
  UserRole,
} from "../types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api/v1";

class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  token?: string | null,
): Promise<T> {
  const headers = new Headers(options.headers);
  if (!(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let detail = "Request failed";
    try {
      const payload = (await response.json()) as { detail?: string };
      detail = payload.detail ?? detail;
    } catch {
      detail = response.statusText || detail;
    }
    throw new ApiError(detail, response.status);
  }

  return (await response.json()) as T;
}

export const authApi = {
  login: (payload: LoginPayload) =>
    request<TokenResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  register: (role: UserRole, payload: RegisterPayload) =>
    request<TokenResponse>(`/auth/register/${role}`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  me: (token: string) => request<User>("/auth/me", {}, token),
};

export const candidateApi = {
  dashboard: (token: string) =>
    request<CandidateDashboardResponse>("/candidate/dashboard", {}, token),
  resumes: (token: string) => request<ResumeRecord[]>("/candidate/resumes", {}, token),
  uploadResume: (token: string, file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return request<ResumeUploadResponse>(
      "/candidate/resumes/upload",
      {
        method: "POST",
        body: formData,
      },
      token,
    );
  },
};

export const recruiterApi = {
  dashboard: (token: string) =>
    request<RecruiterDashboardResponse>("/recruiter/dashboard", {}, token),
  jobs: (token: string) => request<JobRead[]>("/recruiter/jobs", {}, token),
  createJob: (token: string, payload: JobCreatePayload) =>
    request<JobRead>(
      "/recruiter/jobs",
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
      token,
    ),
  uploadJobPdf: (
    token: string,
    payload: {
      title: string;
      department?: string;
      location?: string;
      employment_type?: string;
      file: File;
    },
  ) => {
    const formData = new FormData();
    formData.append("title", payload.title);
    if (payload.department) {
      formData.append("department", payload.department);
    }
    if (payload.location) {
      formData.append("location", payload.location);
    }
    if (payload.employment_type) {
      formData.append("employment_type", payload.employment_type);
    }
    formData.append("file", payload.file);
    return request<JobRead>(
      "/recruiter/jobs/upload",
      {
        method: "POST",
        body: formData,
      },
      token,
    );
  },
  rankCandidates: (token: string, jobId: number) =>
    request<CandidateRankingRow[]>(`/recruiter/jobs/${jobId}/rank`, { method: "POST" }, token),
  candidates: (token: string, jobId: number) =>
    request<CandidateRankingRow[]>(`/recruiter/jobs/${jobId}/candidates`, {}, token),
  async downloadReport(token: string, jobId: number, title: string) {
    const response = await fetch(`${API_BASE_URL}/recruiter/jobs/${jobId}/report`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      throw new ApiError("Unable to download report", response.status);
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${title.toLowerCase().replace(/\s+/g, "-")}-report.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  },
};

export { ApiError };
