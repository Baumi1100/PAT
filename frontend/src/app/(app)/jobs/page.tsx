"use client";
import { useEffect, useState } from "react";
import { jobsApi } from "@/lib/api";
import type { Job } from "@/types/api";

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    jobsApi.list().then((r) => setJobs(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Jobs</h1>
      {loading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : jobs.length === 0 ? (
        <div className="p-8 rounded-xl border border-border bg-card text-center text-muted-foreground">
          No jobs yet. Add a job via the API to get started.
        </div>
      ) : (
        <div className="space-y-2">
          {jobs.map((job) => (
            <div key={job.id} className="p-4 rounded-lg border border-border bg-card flex items-center justify-between">
              <div>
                <p className="font-medium">{job.title}</p>
                <p className="text-sm text-muted-foreground">{job.company ?? "—"}{job.location ? ` · ${job.location}` : ""}</p>
              </div>
              <div className="flex items-center gap-3">
                {job.match_score !== null && (
                  <span className="font-bold text-primary">{job.match_score}%</span>
                )}
                <StatusBadge status={job.status} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    new: "bg-blue-500/20 text-blue-400",
    applied: "bg-yellow-500/20 text-yellow-400",
    archived: "bg-muted text-muted-foreground",
  };
  return (
    <span className={`text-xs px-2 py-1 rounded-full ${colors[status] ?? "bg-muted text-muted-foreground"}`}>
      {status}
    </span>
  );
}
