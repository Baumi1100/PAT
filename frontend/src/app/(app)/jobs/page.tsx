"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Search,
  ListFilter,
  MoreHorizontal,
  Building2,
  MapPin,
  ArrowRight,
  ExternalLink,
  Trash2,
  Loader2,
  Briefcase,
  Plus,
  Upload,
} from "lucide-react";
import { jobsApi, applicationsApi } from "@/lib/api";
import type { Job, Application } from "@/types/api";
import { StatusBadge, PriorityBadge, ScoreBadge, STATUS_OPTIONS } from "@/components/ui/badges";

const FILTER_LABELS: Record<string, string> = {
  alle: "Alle",
  interessant: "Interessant",
  beworben: "Beworben",
  gespräch: "Gespräch",
  angebot: "Angebot",
  abgelehnt: "Abgelehnt",
};

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("alle");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      jobsApi.list().then((r) => setJobs(r.data)),
      applicationsApi.list().then((r) => setApplications(r.data)),
    ]).finally(() => setLoading(false));
  }, []);

  const appByJob = useMemo(
    () => Object.fromEntries(applications.map((a) => [a.job_id, a])),
    [applications]
  );

  const counts = useMemo(() => {
    const c: Record<string, number> = { alle: jobs.length };
    for (const s of STATUS_OPTIONS) {
      c[s] = jobs.filter((j) => (j.status ?? "interessant").toLowerCase() === s).length;
    }
    return c;
  }, [jobs]);

  const filtered = useMemo(() => {
    return jobs.filter((j) => {
      if (filter !== "alle") {
        const jobStatus = (j.status ?? "interessant").toLowerCase();
        if (jobStatus !== filter) return false;
      }
      if (!query.trim()) return true;
      const q = query.toLowerCase();
      return `${j.title} ${j.company ?? ""} ${j.location ?? ""}`.toLowerCase().includes(q);
    });
  }, [jobs, filter, query]);

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

  const FILTER_KEYS = ["alle", "interessant", "beworben", "gespräch", "angebot", "abgelehnt"];

  return (
    <div style={{ maxWidth: 1280 }}>
      {/* Page header */}
      <div className="flex items-end justify-between gap-6 mb-7">
        <div>
          <h1
            className="font-bold text-foreground flex items-center gap-2"
            style={{ fontSize: 26, letterSpacing: "-0.02em", lineHeight: 1.2, marginBottom: 4 }}
          >
            Jobs
            <span className="font-mono text-dim" style={{ fontSize: 13, fontWeight: 500, marginLeft: 8 }}>
              {jobs.length}
            </span>
          </h1>
          <p className="text-muted-foreground" style={{ fontSize: 14 }}>
            Alle erfassten Stellen — verfolge Status, Priorität und KI-Match.
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            className="inline-flex items-center gap-[7px] px-3 py-[7px] rounded-md text-[13px] font-semibold border border-border bg-card hover:bg-card-hover hover:border-border-strong transition-colors"
          >
            <Upload className="shrink-0" style={{ width: 14, height: 14 }} />
            Importieren
          </button>
          <button
            className="inline-flex items-center gap-[7px] px-3 py-[7px] rounded-md text-[13px] font-semibold text-white transition-colors"
            style={{ background: "#6366f1" }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "#5457e8")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "#6366f1")}
          >
            <Plus className="shrink-0" style={{ width: 14, height: 14 }} />
            Job hinzufügen
          </button>
        </div>
      </div>

      {/* Filter segment */}
      <div className="flex items-center justify-between mb-[14px] gap-3 flex-wrap">
        <div
          className="inline-flex"
          style={{
            background: "#111111",
            border: "1px solid #222222",
            borderRadius: 8,
            padding: 3,
          }}
        >
          {FILTER_KEYS.map((key) => {
            const active = filter === key;
            return (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className="transition-colors"
                style={{
                  padding: "5px 11px",
                  fontSize: 12.5,
                  fontWeight: 500,
                  borderRadius: 5,
                  color: active ? "#f5f5f7" : "#9a9aa3",
                  background: active ? "#0e0e0e" : "transparent",
                  boxShadow: active ? "inset 0 0 0 1px #2a2a2a" : undefined,
                  border: "none",
                  cursor: "pointer",
                }}
              >
                {FILTER_LABELS[key]}
                <span
                  className="font-mono ml-[6px]"
                  style={{
                    fontSize: 10.5,
                    color: active ? "#9a9aa3" : "#62626b",
                  }}
                >
                  {counts[key] ?? 0}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Table card */}
      <div
        style={{
          background: "#111111",
          border: "1px solid #222222",
          borderRadius: 12,
          overflow: "hidden",
        }}
      >
        {/* Toolbar */}
        <div
          className="flex items-center gap-[10px]"
          style={{
            padding: "12px 14px",
            borderBottom: "1px solid #222222",
          }}
        >
          <div
            className="flex-1 flex items-center gap-2"
            style={{
              padding: "6px 10px",
              background: "#0e0e0e",
              border: "1px solid #222222",
              borderRadius: 7,
            }}
          >
            <Search className="shrink-0 text-dim" style={{ width: 14, height: 14 }} />
            <input
              type="text"
              placeholder="Suchen nach Titel, Firma, Ort…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 bg-transparent border-none outline-none text-foreground"
              style={{ fontSize: 13 }}
            />
            <kbd
              className="font-mono text-dim"
              style={{
                fontSize: 10,
                background: "#141414",
                border: "1px solid #222222",
                padding: "1px 5px",
                borderRadius: 4,
              }}
            >
              ⌘K
            </kbd>
          </div>
          <button
            className="inline-flex items-center gap-[7px] px-[9px] py-[5px] rounded-md text-[12px] font-semibold border border-border bg-card hover:bg-card-hover transition-colors"
          >
            <ListFilter style={{ width: 12, height: 12 }} />
            Filter
          </button>
          <button
            className="inline-flex items-center justify-center rounded-md border border-border bg-card hover:bg-card-hover transition-colors"
            style={{ width: 30, height: 30 }}
          >
            <MoreHorizontal style={{ width: 12, height: 12 }} />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center" style={{ padding: "64px 16px" }}>
            <Loader2 className="animate-spin text-muted-foreground" style={{ width: 20, height: 20 }} />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState hasFilter={filter !== "alle" || query !== ""} />
        ) : (
          <table className="w-full" style={{ borderCollapse: "collapse", fontSize: 13.5 }}>
            <thead>
              <tr style={{ background: "#0c0c0c", borderBottom: "1px solid #222222" }}>
                <th
                  className="text-left font-semibold uppercase text-dim tracking-[0.06em]"
                  style={{ fontSize: 11.5, padding: "10px 16px", width: "42%" }}
                >
                  Position
                </th>
                <th
                  className="text-left font-semibold uppercase text-dim tracking-[0.06em]"
                  style={{ fontSize: 11.5, padding: "10px 16px", width: "14%" }}
                >
                  Status
                </th>
                <th
                  className="text-left font-semibold uppercase text-dim tracking-[0.06em]"
                  style={{ fontSize: 11.5, padding: "10px 16px", width: "12%" }}
                >
                  Priorität
                </th>
                <th
                  className="text-left font-semibold uppercase text-dim tracking-[0.06em]"
                  style={{ fontSize: 11.5, padding: "10px 16px", width: "12%" }}
                >
                  Analyse
                </th>
                <th
                  className="font-semibold uppercase text-dim tracking-[0.06em]"
                  style={{ fontSize: 11.5, padding: "10px 16px", width: "12%", textAlign: "left" }}
                >
                  Beworben
                </th>
                <th style={{ width: "8%", padding: "10px 16px" }} />
              </tr>
            </thead>
            <tbody>
              {filtered.map((job) => {
                const app = appByJob[job.id];
                const isDeleting = deletingId === job.id;
                const isConfirming = confirmId === job.id;

                return (
                  <JobRow
                    key={job.id}
                    job={job}
                    app={app}
                    isDeleting={isDeleting}
                    isConfirming={isConfirming}
                    onConfirm={() => setConfirmId(job.id)}
                    onDelete={() => handleDelete(job.id)}
                    onCancelDelete={() => setConfirmId(null)}
                  />
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function JobRow({
  job,
  app,
  isDeleting,
  isConfirming,
  onConfirm,
  onDelete,
  onCancelDelete,
}: {
  job: Job;
  app?: Application;
  isDeleting: boolean;
  isConfirming: boolean;
  onConfirm: () => void;
  onDelete: () => void;
  onCancelDelete: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  const appStatus = app?.status as "pending" | "analyzing" | "complete" | "error" | undefined;
  const appliedAt = job.applied_at
    ? new Date(job.applied_at).toLocaleDateString("de-DE", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : null;

  return (
    <tr
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        borderBottom: "1px solid #222222",
        background: hovered ? "rgba(99,102,241,0.04)" : "transparent",
        transition: "background 0.1s",
      }}
    >
      {/* Position */}
      <td style={{ padding: "14px 16px" }}>
        <div className="flex flex-col gap-[3px] min-w-0">
          <Link
            href={`/jobs/${job.id}`}
            className="font-semibold text-foreground hover:text-primary-soft transition-colors truncate block"
            style={{ fontSize: 14, letterSpacing: "-0.005em" }}
          >
            {job.title}
          </Link>
          <div
            className="flex items-center gap-2 text-muted-foreground flex-wrap"
            style={{ fontSize: 12.5 }}
          >
            {job.company && (
              <span className="flex items-center gap-1">
                <Building2 className="text-dim shrink-0" style={{ width: 11, height: 11 }} />
                {job.company}
              </span>
            )}
            {job.company && job.location && (
              <span className="w-[2px] h-[2px] rounded-full bg-dim" />
            )}
            {job.location && (
              <span className="flex items-center gap-1">
                <MapPin className="text-dim shrink-0" style={{ width: 11, height: 11 }} />
                {job.location}
              </span>
            )}
            {job.source_platform && (
              <>
                <span className="w-[2px] h-[2px] rounded-full bg-dim" />
                <span className="font-mono text-dim" style={{ fontSize: 11.5 }}>
                  {job.source_platform}
                </span>
              </>
            )}
          </div>
        </div>
      </td>

      {/* Status */}
      <td style={{ padding: "14px 16px" }}>
        <StatusBadge value={job.status} />
      </td>

      {/* Priority */}
      <td style={{ padding: "14px 16px" }}>
        <PriorityBadge value={job.priority} />
      </td>

      {/* Analysis */}
      <td style={{ padding: "14px 16px" }}>
        {app ? (
          appStatus === "complete" && app.match_score != null ? (
            <Link href={`/applications/${app.id}`}>
              <ScoreBadge status="complete" score={app.match_score} />
            </Link>
          ) : (
            <ScoreBadge status={appStatus ?? "pending"} score={app.match_score} />
          )
        ) : (
          <span className="text-dim" style={{ fontSize: 13.5 }}>—</span>
        )}
      </td>

      {/* Applied at */}
      <td style={{ padding: "14px 16px" }}>
        {appliedAt ? (
          <span className="font-mono text-muted-foreground" style={{ fontSize: 12.5 }}>
            {appliedAt}
          </span>
        ) : (
          <span className="text-dim" style={{ fontSize: 13.5 }}>—</span>
        )}
      </td>

      {/* Row actions */}
      <td style={{ padding: "14px 16px" }}>
        <div
          className="flex items-center justify-end gap-[2px]"
          style={{ opacity: hovered || isConfirming ? 1 : 0, transition: "opacity 0.12s" }}
        >
          {isConfirming ? (
            <>
              <button
                onClick={onDelete}
                disabled={isDeleting}
                className="inline-flex items-center px-[7px] py-[3px] rounded-md text-[11.5px] font-semibold transition-colors"
                style={{
                  background: "rgba(239,68,68,0.10)",
                  border: "1px solid rgba(239,68,68,0.28)",
                  color: "#fca5a5",
                }}
              >
                {isDeleting ? <Loader2 style={{ width: 11, height: 11 }} className="animate-spin" /> : "Ja"}
              </button>
              <button
                onClick={onCancelDelete}
                className="inline-flex items-center px-[7px] py-[3px] rounded-md text-[11.5px] font-semibold border border-border bg-card text-muted-foreground hover:bg-card-hover transition-colors"
              >
                Nein
              </button>
            </>
          ) : (
            <>
              <Link
                href={`/jobs/${job.id}`}
                className="flex items-center justify-center rounded-lg border border-transparent text-muted-foreground hover:bg-card hover:border-border hover:text-foreground transition-colors"
                style={{ width: 32, height: 32 }}
                title="Öffnen"
              >
                <ArrowRight style={{ width: 15, height: 15 }} />
              </Link>
              {job.url && (
                <a
                  href={job.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center rounded-lg border border-transparent text-muted-foreground hover:bg-card hover:border-border hover:text-foreground transition-colors"
                  style={{ width: 32, height: 32 }}
                  title="Stellenanzeige öffnen"
                >
                  <ExternalLink style={{ width: 15, height: 15 }} />
                </a>
              )}
              <button
                onClick={onConfirm}
                className="flex items-center justify-center rounded-lg border border-transparent transition-colors"
                style={{
                  width: 32,
                  height: 32,
                  color: "#fca5a5",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = "rgba(239,68,68,0.08)";
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(239,68,68,0.28)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "transparent";
                }}
                title="Löschen"
              >
                <Trash2 style={{ width: 15, height: 15 }} />
              </button>
            </>
          )}
        </div>
      </td>
    </tr>
  );
}

function EmptyState({ hasFilter }: { hasFilter: boolean }) {
  return (
    <div
      className="flex flex-col items-center gap-[10px] text-muted-foreground"
      style={{ padding: "64px 16px" }}
    >
      <div
        className="flex items-center justify-center text-dim"
        style={{
          width: 48,
          height: 48,
          borderRadius: 12,
          background: "#141414",
          border: "1px solid #222222",
        }}
      >
        <Briefcase style={{ width: 20, height: 20 }} />
      </div>
      <h3 className="text-foreground font-semibold" style={{ fontSize: 14, margin: 0 }}>
        Keine Jobs gefunden
      </h3>
      <p
        className="text-muted-foreground text-center"
        style={{ fontSize: 13, maxWidth: 320, margin: 0 }}
      >
        {hasFilter
          ? "Passe deine Filter an oder füge eine neue Stelle hinzu."
          : "Noch keine Jobs. Sende eine Stellenausschreibung an den PAT Telegram-Bot."}
      </p>
    </div>
  );
}
