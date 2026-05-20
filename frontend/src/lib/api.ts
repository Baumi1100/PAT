// frontend/src/lib/api.ts
import axios, { AxiosInstance, AxiosError } from "axios";
import { tokenStorage } from "@/lib/auth";
import type {
  Application,
  Job,
  Resume,
  TokenResponse,
  User,
  WorkCertificate,
} from "@/types/api";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function createClient(): AxiosInstance {
  const client = axios.create({ baseURL: `${BASE_URL}/api/v1` });

  client.interceptors.request.use((config) => {
    const token = tokenStorage.getAccess();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });

  client.interceptors.response.use(
    (r) => r,
    async (error: AxiosError) => {
      if (error.response?.status === 401) {
        tokenStorage.clear();
        if (typeof window !== "undefined") window.location.href = "/login";
      }
      return Promise.reject(error);
    }
  );

  return client;
}

const client = createClient();

export const authApi = {
  login: (email: string, password: string) =>
    client.post<TokenResponse>("/auth/login", { email, password }),
  register: (email: string, password: string, full_name: string) =>
    client.post<User>("/auth/register", { email, password, full_name }),
  me: () => client.get<User>("/users/me"),
};

export const jobsApi = {
  list: (status?: string) =>
    client.get<Job[]>("/jobs/", { params: status ? { status } : undefined }),
  get: (id: string) => client.get<Job>(`/jobs/${id}`),
  create: (data: Partial<Job>) => client.post<Job>("/jobs/", data),
  update: (id: string, data: Partial<Job>) => client.patch<Job>(`/jobs/${id}`, data),
  delete: (id: string) => client.delete(`/jobs/${id}`),
  analyze: (id: string) => client.post<{ application_id: string; task_id: string }>(`/jobs/${id}/analyze`),
};

export const resumesApi = {
  list: () => client.get<Resume[]>("/resumes/"),
  get: (id: string) => client.get<Resume>(`/resumes/${id}`),
  upload: (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    return client.post<Resume>("/uploads/resume", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  delete: (id: string) => client.delete(`/resumes/${id}`),
};

export const applicationsApi = {
  list: () => client.get<Application[]>("/applications/"),
  get: (id: string) => client.get<Application>(`/applications/${id}`),
  create: (job_id: string, resume_id: string) =>
    client.post<Application>("/applications/", { job_id, resume_id }),
};

export const certificatesApi = {
  list: () => client.get<WorkCertificate[]>("/certificates/"),
  upload: (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    return client.post<WorkCertificate>("/uploads/certificate", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  delete: (id: string) => client.delete(`/certificates/${id}`),
};

export const exportApi = {
  resumeTex: (id: string) =>
    client.get(`/applications/${id}/export/resume.tex`, { responseType: "blob" }),
  resumePdf: (id: string) =>
    client.get(`/applications/${id}/export/resume.pdf`, { responseType: "blob" }),
  coverLetterTex: (id: string) =>
    client.get(`/applications/${id}/export/cover_letter.tex`, { responseType: "blob" }),
  coverLetterPdf: (id: string) =>
    client.get(`/applications/${id}/export/cover_letter.pdf`, { responseType: "blob" }),
};

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
