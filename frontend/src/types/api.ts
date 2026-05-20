// frontend/src/types/api.ts
export interface User {
  id: string;
  email: string;
  full_name: string;
  is_active: boolean;
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface Job {
  id: string;
  user_id: string;
  title: string;
  company: string | null;
  location: string | null;
  url: string | null;
  source: string;
  source_platform: string | null;
  status: string;
  match_score: number | null;
  salary_range: string | null;
  remote_policy: string | null;
  employment_type: string | null;
  seniority_level: string | null;
  priority: string | null;
  notes: string | null;
  contact_person: string | null;
  applied_at: string | null;
  raw_text: string | null;
  created_at: string;
}

export interface Resume {
  id: string;
  user_id: string;
  title: string;
  file_name: string | null;
  file_type: string | null;
  is_primary: boolean;
  created_at: string;
}

export interface Application {
  id: string;
  user_id: string;
  job_id: string;
  resume_id: string;
  match_score: number | null;
  status: string;
  celery_task_id: string | null;
  created_at: string;
  strengths?: string[] | null;
  weaknesses?: string[] | null;
  skill_gaps?: string[] | null;
  suggestions?: string[] | null;
  cover_letter?: string | null;
  interview_questions?: string[] | null;
}

export interface WorkCertificate {
  id: string;
  user_id: string;
  title: string;
  file_name: string | null;
  file_type: string | null;
  created_at: string;
}

export interface AIProviderConfig {
  id: string;
  task_type: string;
  provider: string;
  model: string;
  is_active: boolean;
}
