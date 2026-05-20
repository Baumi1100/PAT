"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ExternalLink, MapPin, Building2, Calendar } from "lucide-react";
import { jobsApi, applicationsApi } from "@/lib/api";
import type { Job, Application } from "@/types/api";

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      jobsApi.list().then((r) => setJobs(r.data)),
      applicationsApi.list().then((r) => setApplications(r.data)),
    ]).finally(() => setLoading(false));
  }, []);

  const appByJob = Object.fromEntries(applications.map((a) => [a.job_id, a]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Jobs</h1>
        <p className="text-sm text-muted-foreground mt-1">
          All job postings tracked via Telegram or API
        </p>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 rounded-xl border border-border bg-card animate-pulse" />
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <div className="p-12 rounded-xl border border-border bg-card text-center">
          <p className="text-muted-foreground text-sm">
            No jobs yet. Share a job posting URL with the PAT Telegram bot to get started.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Job</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Added</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                <th className="text-right px-5 py-3 font-medium text-muted-foreground">Match</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job, i) => {
                const app = appByJob[job.id];
                return (
                  <tr
                    key={job.id}
                    className={`border-b border-border last:border-0 hover:bg-accent/40 transition-colors ${i % 2 === 0 ? "" : "bg-muted/10"}`}
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-muted shrink-0 mt-0.5">
                          <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            {app ? (
                              <Link href={`/applications/${app.id}`} className="font-semibold hover:text-primary transition-colors">
                                {job.title}
                              </Link>
                            ) : (
                              <span className="font-semibold">{job.title}</span>
                            )}
                            {job.url && (
                              <a
                                href={job.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-muted-foreground hover:text-primary transition-colors"
                                title="Open original posting"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                            {job.company && (
                              <span className="flex items-center gap-1">
                                <Building2 className="w-3 h-3" />
                                {job.company}
                              </span>
                            )}
                            {job.location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {job.location}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-muted-foreground hidden md:table-cell">
                      <span className="flex items-center gap-1.5 text-xs">
                        <Calendar className="w-3 h-3" />
                        {new Date(job.created_at).toLocaleDateString("de-DE", { day: "2-digit", month: "short", year: "numeric" })}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      {app ? (
                        <AppStatusBadge status={app.status} />
                      ) : (
                        <JobStatusBadge status={job.status} />
                      )}
                    </td>
                    <td className="px-5 py-4 text-right">
                      {app?.match_score !== null && app?.match_score !== undefined ? (
                        <Link href={`/applications/${app.id}`} className={`font-semibold hover:underline ${scoreColor(app.match_score)}`}>
                          {app.match_score}%
                        </Link>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
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
  );
}

function scoreColor(score: number) {
  if (score >= 75) return "text-emerald-400";
  if (score >= 50) return "text-yellow-400";
  return "text-red-400";
}

function AppStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: "bg-yellow-500/15 text-yellow-400 border-yellow-500/20",
    analyzing: "bg-blue-500/15 text-blue-400 border-blue-500/20",
    complete: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
    error: "bg-red-500/15 text-red-400 border-red-500/20",
  };
  const labels: Record<string, string> = {
    pending: "Pending",
    analyzing: "Analyzing…",
    complete: "Analyzed",
    error: "Error",
  };
  return (
    <span className={`inline-flex items-center text-xs px-2 py-0.5 rounded-full border font-medium ${styles[status] ?? "bg-muted text-muted-foreground border-border"}`}>
      {labels[status] ?? status}
    </span>
  );
}

function JobStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    new: "bg-blue-500/15 text-blue-400 border-blue-500/20",
    applied: "bg-violet-500/15 text-violet-400 border-violet-500/20",
    archived: "bg-muted text-muted-foreground border-border",
  };
  return (
    <span className={`inline-flex items-center text-xs px-2 py-0.5 rounded-full border font-medium ${styles[status] ?? "bg-muted text-muted-foreground border-border"}`}>
      {status}
    </span>
  );
}
