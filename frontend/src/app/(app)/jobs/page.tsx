"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ExternalLink, MapPin, Building2, Star, Trash2, Loader2 } from "lucide-react";
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

const PRIORITY_COLORS: Record<string, string> = {
  hoch: "text-red-400",
  mittel: "text-yellow-400",
  niedrig: "text-muted-foreground",
};

const ANALYSIS_STYLES: Record<string, string> = {
  pending: "bg-yellow-500/15 text-yellow-400 border-yellow-500/20",
  analyzing: "bg-blue-500/15 text-blue-400 border-blue-500/20",
  complete: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  error: "bg-red-500/15 text-red-400 border-red-500/20",
};

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      jobsApi.list().then((r) => setJobs(r.data)),
      applicationsApi.list().then((r) => setApplications(r.data)),
    ]).finally(() => setLoading(false));
  }, []);

  const appByJob = Object.fromEntries(applications.map((a) => [a.job_id, a]));

  async function handleDelete(jobId: string) {
    setDeletingId(jobId);
    try {
      await jobsApi.delete(jobId);
      setJobs((prev) => prev.filter((j) => j.id !== jobId));
    } finally {
      setDeletingId(null);
      setConfirmId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Jobs</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {jobs.length} Stelle{jobs.length !== 1 ? "n" : ""} gespeichert
        </p>
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
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Position</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Priorität</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Analyse</th>
                <th className="w-10 px-2 py-3" />
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => {
                const app = appByJob[job.id];
                const isDeleting = deletingId === job.id;
                const isConfirming = confirmId === job.id;

                return (
                  <tr
                    key={job.id}
                    className="border-b border-border last:border-0 hover:bg-accent/30 transition-colors group"
                  >
                    {/* Position */}
                    <td className="px-4 py-3.5">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/jobs/${job.id}`}
                            className="font-medium hover:text-primary transition-colors truncate max-w-[280px]"
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
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3 shrink-0" />
                              {job.location}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Job tracking status — always the job's own status */}
                    <td className="px-4 py-3.5">
                      <JobStatusBadge status={job.status} />
                    </td>

                    {/* Priority */}
                    <td className="px-4 py-3.5">
                      {job.priority ? (
                        <span
                          className={`flex items-center gap-1 text-xs font-medium ${PRIORITY_COLORS[job.priority.toLowerCase()] ?? "text-muted-foreground"}`}
                        >
                          <Star className="w-3 h-3 shrink-0" />
                          {job.priority}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground/30">—</span>
                      )}
                    </td>

                    {/* Analysis result */}
                    <td className="px-4 py-3.5 text-right">
                      {app ? (
                        app.match_score != null ? (
                          <Link
                            href={`/applications/${app.id}`}
                            className={`text-sm font-semibold hover:underline ${scoreColor(app.match_score)}`}
                          >
                            {app.match_score}%
                          </Link>
                        ) : (
                          <span
                            className={`inline-flex items-center text-xs px-2 py-0.5 rounded-full border font-medium ${ANALYSIS_STYLES[app.status] ?? "bg-muted text-muted-foreground border-border"}`}
                          >
                            {app.status === "analyzing" ? "Analysiert…" : app.status}
                          </span>
                        )
                      ) : (
                        <span className="text-xs text-muted-foreground/30">—</span>
                      )}
                    </td>

                    {/* Delete */}
                    <td className="px-2 py-3.5">
                      {isConfirming ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleDelete(job.id)}
                            disabled={isDeleting}
                            className="text-xs px-2 py-1 rounded bg-red-500/15 text-red-400 hover:bg-red-500/25 border border-red-500/20 transition-colors"
                          >
                            {isDeleting ? <Loader2 className="w-3 h-3 animate-spin" /> : "Ja"}
                          </button>
                          <button
                            onClick={() => setConfirmId(null)}
                            className="text-xs px-2 py-1 rounded bg-muted text-muted-foreground hover:bg-accent transition-colors"
                          >
                            Nein
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmId(job.id)}
                          className="p-1.5 rounded-lg text-muted-foreground/0 group-hover:text-muted-foreground/40 hover:!text-red-400 hover:bg-red-500/10 transition-colors"
                          title="Job löschen"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
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

function JobStatusBadge({ status }: { status: string }) {
  const key = status.toLowerCase();
  return (
    <span
      className={`inline-flex items-center text-xs px-2 py-0.5 rounded-full border font-medium capitalize ${STATUS_STYLES[key] ?? "bg-muted/50 text-muted-foreground border-border"}`}
    >
      {status}
    </span>
  );
}
