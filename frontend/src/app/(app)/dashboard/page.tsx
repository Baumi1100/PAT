// frontend/src/app/(app)/dashboard/page.tsx
"use client";
import { useEffect, useState } from "react";
import { applicationsApi, jobsApi } from "@/lib/api";
import type { Application, Job } from "@/types/api";

export default function DashboardPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);

  useEffect(() => {
    jobsApi.list().then((r) => setJobs(r.data)).catch(() => {});
    applicationsApi.list().then((r) => setApplications(r.data)).catch(() => {});
  }, []);

  const avgScore =
    applications.filter((a) => a.match_score !== null).length > 0
      ? Math.round(
          applications.reduce((s, a) => s + (a.match_score ?? 0), 0) /
            applications.filter((a) => a.match_score !== null).length
        )
      : null;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label="Total Jobs" value={jobs.length} />
        <StatCard label="Applications" value={applications.length} />
        <StatCard label="Avg Match Score" value={avgScore !== null ? `${avgScore}%` : "—"} />
      </div>
      <div>
        <h2 className="text-xl font-semibold mb-3">Recent Applications</h2>
        <div className="space-y-2">
          {applications.slice(0, 5).map((app) => (
            <a
              key={app.id}
              href={`/applications/${app.id}`}
              className="flex items-center justify-between p-4 rounded-lg border border-border bg-card hover:bg-accent transition-colors"
            >
              <span className="text-sm text-muted-foreground">{app.job_id}</span>
              <div className="flex items-center gap-3">
                <StatusBadge status={app.status} />
                {app.match_score !== null && (
                  <span className="font-bold text-primary">{app.match_score}%</span>
                )}
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="p-6 rounded-xl border border-border bg-card">
      <p className="text-muted-foreground text-sm">{label}</p>
      <p className="text-3xl font-bold mt-1">{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    pending: "bg-yellow-500/20 text-yellow-400",
    analyzing: "bg-blue-500/20 text-blue-400",
    complete: "bg-green-500/20 text-green-400",
    error: "bg-red-500/20 text-red-400",
  };
  return (
    <span className={`text-xs px-2 py-1 rounded-full ${colors[status] ?? "bg-muted text-muted-foreground"}`}>
      {status}
    </span>
  );
}
