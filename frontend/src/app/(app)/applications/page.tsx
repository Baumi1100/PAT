"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Trash2 } from "lucide-react";
import { applicationsApi, jobsApi } from "@/lib/api";
import type { Application, Job } from "@/types/api";

export default function ApplicationsPage() {
  const [apps, setApps] = useState<Application[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      applicationsApi.list().then((r) => setApps(r.data)),
      jobsApi.list().then((r) => setJobs(r.data)),
    ]).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const jobsMap = Object.fromEntries(jobs.map((j) => [j.id, j]));

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      await applicationsApi.delete(id);
      setApps((prev) => prev.filter((a) => a.id !== id));
    } finally {
      setDeletingId(null);
      setConfirmId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Bewerbungen</h1>
        <p className="text-sm text-muted-foreground mt-1">KI-analysierte Stellenbewerbungen</p>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 rounded-xl border border-border bg-card animate-pulse" />
          ))}
        </div>
      ) : apps.length === 0 ? (
        <div className="p-12 rounded-xl border border-border bg-card text-center text-muted-foreground text-sm">
          Noch keine Bewerbungen. Sende einen Job via Telegram um die Analyse zu starten.
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Job</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Unternehmen</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                <th className="text-right px-5 py-3 font-medium text-muted-foreground">Match</th>
                <th className="w-28 px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {apps.map((app, i) => {
                const job = jobsMap[app.job_id];
                const isConfirming = confirmId === app.id;
                const isDeleting = deletingId === app.id;
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
                      <div className="flex items-center justify-end gap-1">
                        {isConfirming ? (
                          <>
                            <button
                              onClick={() => handleDelete(app.id)}
                              disabled={isDeleting}
                              className="px-2 py-1 text-xs rounded bg-red-500/15 text-red-400 hover:bg-red-500/25 border border-red-500/20 transition-colors"
                            >
                              Ja
                            </button>
                            <button
                              onClick={() => setConfirmId(null)}
                              className="px-2 py-1 text-xs rounded bg-muted text-muted-foreground hover:bg-muted/80 border border-border transition-colors"
                            >
                              Nein
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => setConfirmId(app.id)}
                            className="p-1.5 rounded text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors"
                            title="Bewerbung löschen"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <Link
                          href={`/applications/${app.id}`}
                          className="p-1.5 rounded text-muted-foreground hover:text-primary transition-colors"
                        >
                          <ArrowRight className="w-4 h-4" />
                        </Link>
                      </div>
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
    pending: "Ausstehend",
    analyzing: "Analysiert…",
    complete: "Abgeschlossen",
    error: "Fehler",
  };
  return (
    <span className={`inline-flex items-center text-xs px-2 py-0.5 rounded-full border font-medium ${styles[status] ?? "bg-muted text-muted-foreground border-border"}`}>
      {labels[status] ?? status}
    </span>
  );
}
