"use client";
import { useEffect, useState } from "react";
import { applicationsApi } from "@/lib/api";
import type { Application } from "@/types/api";
import Link from "next/link";

export default function ApplicationsPage() {
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    applicationsApi.list().then((r) => setApps(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Applications</h1>
      {loading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : apps.length === 0 ? (
        <div className="p-8 rounded-xl border border-border bg-card text-center text-muted-foreground">
          No applications yet. Create one from the Jobs page.
        </div>
      ) : (
        <div className="space-y-2">
          {apps.map((app) => (
            <Link
              key={app.id}
              href={`/applications/${app.id}`}
              className="flex items-center justify-between p-4 rounded-lg border border-border bg-card hover:bg-accent transition-colors"
            >
              <span className="text-sm text-muted-foreground font-mono">{app.job_id}</span>
              <div className="flex items-center gap-3">
                <StatusBadge status={app.status} />
                {app.match_score !== null && (
                  <span className="font-bold text-primary">{app.match_score}%</span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
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
