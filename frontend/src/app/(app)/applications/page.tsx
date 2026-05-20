"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { applicationsApi, jobsApi } from "@/lib/api";
import type { Application, Job } from "@/types/api";

export default function ApplicationsPage() {
  const [apps, setApps] = useState<Application[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      applicationsApi.list().then((r) => setApps(r.data)),
      jobsApi.list().then((r) => setJobs(r.data)),
    ]).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const jobsMap = Object.fromEntries(jobs.map((j) => [j.id, j]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Applications</h1>
        <p className="text-sm text-muted-foreground mt-1">AI-analyzed job applications</p>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 rounded-xl border border-border bg-card animate-pulse" />
          ))}
        </div>
      ) : apps.length === 0 ? (
        <div className="p-12 rounded-xl border border-border bg-card text-center text-muted-foreground text-sm">
          No applications yet. Send a job via Telegram to trigger analysis.
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Job</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Company</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                <th className="text-right px-5 py-3 font-medium text-muted-foreground">Match</th>
                <th className="w-10" />
              </tr>
            </thead>
            <tbody>
              {apps.map((app, i) => {
                const job = jobsMap[app.job_id];
                return (
                  <tr
                    key={app.id}
                    className={`border-b border-border last:border-0 hover:bg-accent/40 transition-colors ${i % 2 === 0 ? "" : "bg-muted/10"}`}
                  >
                    <td className="px-5 py-3.5">
                      <span className="font-medium">{job?.title ?? "Job"}</span>
                      {job?.location && (
                        <p className="text-xs text-muted-foreground mt-0.5">{job.location}</p>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-muted-foreground hidden sm:table-cell">
                      {job?.company ?? "—"}
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusBadge status={app.status} />
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      {app.match_score !== null ? (
                        <span className={`font-semibold ${scoreColor(app.match_score)}`}>
                          {app.match_score}%
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="pr-4 py-3.5">
                      <Link href={`/applications/${app.id}`} className="text-muted-foreground hover:text-primary transition-colors">
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function scoreColor(score: number) {
  if (score >= 75) return "text-emerald-400";
  if (score >= 50) return "text-yellow-400";
  return "text-red-400";
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: "bg-yellow-500/15 text-yellow-400 border-yellow-500/20",
    analyzing: "bg-blue-500/15 text-blue-400 border-blue-500/20",
    complete: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
    error: "bg-red-500/15 text-red-400 border-red-500/20",
  };
  const labels: Record<string, string> = {
    pending: "Pending",
    analyzing: "Analyzing…",
    complete: "Complete",
    error: "Error",
  };
  return (
    <span className={`inline-flex items-center text-xs px-2 py-0.5 rounded-full border font-medium ${styles[status] ?? "bg-muted text-muted-foreground border-border"}`}>
      {labels[status] ?? status}
    </span>
  );
}
