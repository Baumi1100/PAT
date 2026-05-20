"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ExternalLink,
  MapPin,
  Building2,
  Calendar,
  Euro,
  Wifi,
  Star,
  Plus,
} from "lucide-react";
import { jobsApi, applicationsApi } from "@/lib/api";
import type { Job, Application } from "@/types/api";

const STATUS_STYLES: Record<string, string> = {
  interessant: "bg-blue-500/15 text-blue-400 border-blue-500/20",
  beworben: "bg-violet-500/15 text-violet-400 border-violet-500/20",
  gespräch: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  angebot: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  abgelehnt: "bg-red-500/15 text-red-400 border-red-500/20",
  archiviert: "bg-muted/50 text-muted-foreground border-border",
};

const PRIORITY_STYLES: Record<string, string> = {
  hoch: "text-red-400",
  mittel: "text-yellow-400",
  niedrig: "text-muted-foreground",
};

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Jobs</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {jobs.length} Stelle{jobs.length !== 1 ? "n" : ""} gespeichert
          </p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-16 rounded-xl border border-border bg-card animate-pulse" />
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <div className="p-12 rounded-xl border border-border bg-card text-center">
          <Building2 className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">
            Noch keine Jobs. Sende eine Stellenausschreibung an den PAT Telegram-Bot.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-x-auto">
          <table className="w-full text-sm min-w-[900px]">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Position</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Platform</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Gehalt</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Remote</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden xl:table-cell">Priorität</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Match</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => {
                const app = appByJob[job.id];
                return (
                  <tr
                    key={job.id}
                    className="border-b border-border last:border-0 hover:bg-accent/30 transition-colors group"
                  >
                    <td className="px-4 py-3.5">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/jobs/${job.id}`}
                            className="font-medium hover:text-primary transition-colors truncate max-w-[260px]"
                          >
                            {job.title}
                          </Link>
                          {job.url && (
                            <a
                              href={job.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-muted-foreground/40 hover:text-primary transition-colors opacity-0 group-hover:opacity-100 shrink-0"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                          {job.company && (
                            <span className="flex items-center gap-1">
                              <Building2 className="w-3 h-3 shrink-0" />
                              {job.company}
                            </span>
                          )}
                          {job.location && (
                            <span className="flex items-center gap-1 hidden sm:flex">
                              <MapPin className="w-3 h-3 shrink-0" />
                              {job.location}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      {job.source_platform ? (
                        <span className="text-xs text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-md">
                          {job.source_platform}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground/40">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusBadge jobStatus={job.status} appStatus={app?.status} />
                    </td>
                    <td className="px-4 py-3.5 hidden lg:table-cell">
                      {job.salary_range ? (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Euro className="w-3 h-3 shrink-0" />
                          {job.salary_range}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground/40">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 hidden lg:table-cell">
                      {job.remote_policy ? (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Wifi className="w-3 h-3 shrink-0" />
                          {job.remote_policy}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground/40">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 hidden xl:table-cell">
                      {job.priority ? (
                        <span className={`flex items-center gap-1 text-xs font-medium ${PRIORITY_STYLES[job.priority.toLowerCase()] ?? "text-muted-foreground"}`}>
                          <Star className="w-3 h-3 shrink-0" />
                          {job.priority}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground/40">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      {app?.match_score != null ? (
                        <Link
                          href={`/applications/${app.id}`}
                          className={`text-sm font-semibold hover:underline ${scoreColor(app.match_score)}`}
                        >
                          {app.match_score}%
                        </Link>
                      ) : (
                        <span className="text-xs text-muted-foreground/40">—</span>
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

function StatusBadge({ jobStatus, appStatus }: { jobStatus: string; appStatus?: string }) {
  const APP_STATUS_STYLES: Record<string, string> = {
    pending: "bg-yellow-500/15 text-yellow-400 border-yellow-500/20",
    analyzing: "bg-blue-500/15 text-blue-400 border-blue-500/20",
    complete: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
    error: "bg-red-500/15 text-red-400 border-red-500/20",
  };
  const APP_LABELS: Record<string, string> = {
    pending: "Ausstehend",
    analyzing: "Analysiert…",
    complete: "Analysiert",
    error: "Fehler",
  };

  if (appStatus) {
    return (
      <span
        className={`inline-flex items-center text-xs px-2 py-0.5 rounded-full border font-medium ${APP_STATUS_STYLES[appStatus] ?? "bg-muted text-muted-foreground border-border"}`}
      >
        {APP_LABELS[appStatus] ?? appStatus}
      </span>
    );
  }

  const key = jobStatus.toLowerCase();
  return (
    <span
      className={`inline-flex items-center text-xs px-2 py-0.5 rounded-full border font-medium capitalize ${STATUS_STYLES[key] ?? "bg-muted/50 text-muted-foreground border-border"}`}
    >
      {jobStatus}
    </span>
  );
}
