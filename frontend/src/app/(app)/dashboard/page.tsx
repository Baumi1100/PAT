// frontend/src/app/(app)/dashboard/page.tsx
"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { TrendingUp, Briefcase, ClipboardList, ArrowRight } from "lucide-react";
import { applicationsApi, jobsApi } from "@/lib/api";
import type { Application, Job } from "@/types/api";

export default function DashboardPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);

  useEffect(() => {
    jobsApi.list().then((r) => setJobs(r.data)).catch(() => {});
    applicationsApi.list().then((r) => setApplications(r.data)).catch(() => {});
  }, []);

  const jobsMap = Object.fromEntries(jobs.map((j) => [j.id, j]));

  const completedApps = applications.filter((a) => a.match_score !== null);
  const avgScore =
    completedApps.length > 0
      ? Math.round(completedApps.reduce((s, a) => s + (a.match_score ?? 0), 0) / completedApps.length)
      : null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Overview of your job applications</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard icon={Briefcase} label="Total Jobs" value={jobs.length} color="text-blue-400" />
        <StatCard icon={ClipboardList} label="Applications" value={applications.length} color="text-violet-400" />
        <StatCard
          icon={TrendingUp}
          label="Avg Match Score"
          value={avgScore !== null ? `${avgScore}%` : "—"}
          color="text-emerald-400"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold">Recent Applications</h2>
          <Link href="/applications" className="text-xs text-primary hover:underline flex items-center gap-1">
            View all <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        {applications.length === 0 ? (
          <EmptyState message="No applications yet. Send a job via Telegram or the Jobs page." />
        ) : (
          <div className="rounded-xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Job</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Company</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Match</th>
                </tr>
              </thead>
              <tbody>
                {applications.slice(0, 8).map((app, i) => {
                  const job = jobsMap[app.job_id];
                  return (
                    <tr
                      key={app.id}
                      className={`border-b border-border last:border-0 hover:bg-accent/50 transition-colors ${i % 2 === 0 ? "" : "bg-muted/20"}`}
                    >
                      <td className="px-4 py-3">
                        <Link href={`/applications/${app.id}`} className="font-medium hover:text-primary transition-colors">
                          {job?.title ?? "Job"}
                        </Link>
                        {job?.location && (
                          <p className="text-xs text-muted-foreground mt-0.5">{job.location}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {job?.company ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={app.status} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        {app.match_score !== null ? (
                          <span className={`font-semibold ${scoreColor(app.match_score)}`}>
                            {app.match_score}%
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function scoreColor(score: number) {
  if (score >= 75) return "text-emerald-400";
  if (score >= 50) return "text-yellow-400";
  return "text-red-400";
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <div className="p-5 rounded-xl border border-border bg-card flex items-center gap-4">
      <div className={`p-2.5 rounded-lg bg-muted ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-bold mt-0.5">{value}</p>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: "bg-yellow-500/15 text-yellow-400 border-yellow-500/20",
    analyzing: "bg-blue-500/15 text-blue-400 border-blue-500/20",
    complete: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
    error: "bg-red-500/15 text-red-400 border-red-500/20",
  };
  return (
    <span className={`inline-flex items-center text-xs px-2 py-0.5 rounded-full border font-medium ${styles[status] ?? "bg-muted text-muted-foreground border-border"}`}>
      {status}
    </span>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="p-10 rounded-xl border border-border bg-card text-center text-muted-foreground text-sm">
      {message}
    </div>
  );
}
