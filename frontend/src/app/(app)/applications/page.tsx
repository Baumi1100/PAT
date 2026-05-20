// frontend/src/app/(app)/applications/page.tsx
"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Send, ChevronRight, Trash2, ExternalLink, Loader2 } from "lucide-react";
import { applicationsApi, jobsApi } from "@/lib/api";
import { ScoreBadge } from "@/components/ui/badges";
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
    ])
      .catch(() => {})
      .finally(() => setLoading(false));
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
    <div style={{ maxWidth: 960 }}>
      {/* Page header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: "#f5f5f7", margin: 0, letterSpacing: "-0.02em" }}>
            Bewerbungen{" "}
            {!loading && apps.length > 0 && (
              <span style={{ fontSize: 15, fontWeight: 500, color: "#62626b", fontFamily: "var(--font-mono)", letterSpacing: "0" }}>
                {apps.length}
              </span>
            )}
          </h1>
          <p style={{ fontSize: 14, color: "#9a9aa3", marginTop: 4 }}>
            KI-analysierte Stellenbewerbungen
          </p>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {[...Array(3)].map((_, i) => (
            <div key={i} style={{ height: 54, borderRadius: 8, background: "#111111", border: "1px solid #1a1a1a" }} />
          ))}
        </div>
      ) : apps.length === 0 ? (
        <EmptyState />
      ) : (
        <div style={{ border: "1px solid #1e1e1e", borderRadius: 10, overflow: "hidden", background: "#0c0c0c" }}>
          {/* Header row */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 160px 120px 110px 80px",
              padding: "0 18px",
              height: 38,
              alignItems: "center",
              borderBottom: "1px solid #1e1e1e",
              background: "#0c0c0c",
            }}
          >
            {["POSITION", "UNTERNEHMEN", "STATUS", "ANALYSE", ""].map((h) => (
              <span key={h} style={{ fontSize: 11, fontWeight: 600, color: "#62626b", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                {h}
              </span>
            ))}
          </div>

          {apps.map((app, i) => {
            const job = jobsMap[app.job_id];
            const isConfirming = confirmId === app.id;
            const isDeleting = deletingId === app.id;
            const last = i === apps.length - 1;

            return (
              <AppRow
                key={app.id}
                app={app}
                job={job ?? null}
                last={last}
                isConfirming={isConfirming}
                isDeleting={isDeleting}
                onDeleteClick={() => setConfirmId(app.id)}
                onConfirm={() => handleDelete(app.id)}
                onCancel={() => setConfirmId(null)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

function AppRow({
  app,
  job,
  last,
  isConfirming,
  isDeleting,
  onDeleteClick,
  onConfirm,
  onCancel,
}: {
  app: Application;
  job: Job | null;
  last: boolean;
  isConfirming: boolean;
  isDeleting: boolean;
  onDeleteClick: () => void;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 160px 120px 110px 80px",
        padding: "0 18px",
        height: 54,
        alignItems: "center",
        borderBottom: last ? "none" : "1px solid #1a1a1a",
        background: hovered ? "rgba(99,102,241,0.04)" : "transparent",
        transition: "background 0.1s",
      }}
    >
      {/* Position */}
      <div style={{ minWidth: 0, paddingRight: 12 }}>
        <div style={{ fontSize: 13.5, fontWeight: 500, color: "#f5f5f7", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {job?.title ?? "Job"}
        </div>
        {job?.location && (
          <div style={{ fontSize: 11.5, color: "#62626b", marginTop: 1 }}>{job.location}</div>
        )}
      </div>

      {/* Unternehmen */}
      <div style={{ fontSize: 13, color: "#9a9aa3", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", paddingRight: 8 }}>
        {job?.company ?? "—"}
      </div>

      {/* Status */}
      <div>
        <AnalysisStatusBadge status={app.status} />
      </div>

      {/* Analyse / Score */}
      <div>
        <ScoreBadge
          status={app.status as "pending" | "analyzing" | "complete" | "error"}
          score={app.match_score}
        />
      </div>

      {/* Actions */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 4 }}>
        {isConfirming ? (
          <>
            <button
              onClick={onConfirm}
              disabled={isDeleting}
              style={{
                padding: "3px 8px",
                fontSize: 11.5,
                fontWeight: 600,
                borderRadius: 5,
                border: "1px solid rgba(239,68,68,0.30)",
                background: "rgba(239,68,68,0.10)",
                color: "#fca5a5",
                cursor: "pointer",
              }}
            >
              {isDeleting ? <Loader2 style={{ width: 11, height: 11, animation: "spin 1s linear infinite" }} /> : "Ja"}
            </button>
            <button
              onClick={onCancel}
              style={{
                padding: "3px 8px",
                fontSize: 11.5,
                fontWeight: 600,
                borderRadius: 5,
                border: "1px solid #222",
                background: "transparent",
                color: "#9a9aa3",
                cursor: "pointer",
              }}
            >
              Nein
            </button>
          </>
        ) : (
          <>
            <ActionIconBtn
              icon={Trash2}
              title="Löschen"
              visible={hovered}
              onClick={onDeleteClick}
              danger
            />
            <Link href={`/applications/${app.id}`} style={{ textDecoration: "none" }}>
              <ActionIconBtn
                icon={ChevronRight}
                title="Öffnen"
                visible={hovered}
              />
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

function ActionIconBtn({
  icon: Icon,
  title,
  visible,
  onClick,
  danger,
}: {
  icon: React.ElementType;
  title: string;
  visible: boolean;
  onClick?: () => void;
  danger?: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      title={title}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: 28,
        height: 28,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 6,
        border: hovered
          ? danger
            ? "1px solid rgba(239,68,68,0.25)"
            : "1px solid #2a2a2a"
          : "1px solid transparent",
        background: hovered
          ? danger
            ? "rgba(239,68,68,0.08)"
            : "#111111"
          : "transparent",
        color: hovered
          ? danger
            ? "#fca5a5"
            : "#f5f5f7"
          : "#62626b",
        opacity: visible ? 1 : 0,
        transition: "opacity 0.1s, background 0.1s, border-color 0.1s, color 0.1s",
        cursor: "pointer",
      }}
    >
      <Icon style={{ width: 13, height: 13 }} />
    </button>
  );
}

function AnalysisStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string; bg: string; border: string }> = {
    pending: { label: "Ausstehend", color: "#9a9aa3", bg: "rgba(148,163,184,0.08)", border: "rgba(148,163,184,0.20)" },
    analyzing: { label: "Analysiert…", color: "#7dd3fc", bg: "rgba(56,189,248,0.08)", border: "rgba(56,189,248,0.25)" },
    complete: { label: "Abgeschlossen", color: "#86efac", bg: "rgba(34,197,94,0.08)", border: "rgba(34,197,94,0.25)" },
    error: { label: "Fehler", color: "#fca5a5", bg: "rgba(239,68,68,0.08)", border: "rgba(239,68,68,0.25)" },
  };
  const s = map[status] ?? map.pending;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "3px 8px",
        borderRadius: 20,
        fontSize: 11.5,
        fontWeight: 600,
        color: s.color,
        background: s.bg,
        border: `1px solid ${s.border}`,
      }}
    >
      <span style={{ width: 4, height: 4, borderRadius: "50%", background: "currentColor", flexShrink: 0 }} />
      {s.label}
    </span>
  );
}

function EmptyState() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 10,
        padding: "60px 32px",
        border: "1px solid #1e1e1e",
        borderRadius: 10,
        background: "#0c0c0c",
        textAlign: "center",
      }}
    >
      <div style={{ width: 42, height: 42, borderRadius: 10, background: "#161616", border: "1px solid #222", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Send style={{ width: 18, height: 18, color: "#62626b" }} />
      </div>
      <div>
        <p style={{ fontSize: 14, fontWeight: 600, color: "#f5f5f7", margin: 0 }}>Noch keine Bewerbungen</p>
        <p style={{ fontSize: 13, color: "#9a9aa3", marginTop: 4, maxWidth: 320 }}>
          Sende einen Job über den Telegram-Bot oder starte eine Analyse direkt auf der Jobs-Seite.
        </p>
      </div>
      <Link
        href="/jobs"
        style={{
          marginTop: 4,
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          padding: "7px 14px",
          borderRadius: 7,
          fontSize: 13,
          fontWeight: 600,
          background: "rgba(99,102,241,0.15)",
          color: "#818cf8",
          border: "1px solid rgba(99,102,241,0.25)",
          textDecoration: "none",
        }}
      >
        <ExternalLink style={{ width: 13, height: 13 }} />
        Zu den Jobs
      </Link>
    </div>
  );
}
