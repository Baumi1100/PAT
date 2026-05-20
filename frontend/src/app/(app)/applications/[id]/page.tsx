// frontend/src/app/(app)/applications/[id]/page.tsx
"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft,
  Download,
  FileText,
  MessageSquare,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  Target,
  Loader2,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { applicationsApi, exportApi, jobsApi, downloadBlob } from "@/lib/api";
import { ScoreBadge } from "@/components/ui/badges";
import type { Application, Job } from "@/types/api";

export default function ApplicationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [app, setApp] = useState<Application | null>(null);
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => {
    applicationsApi.get(id)
      .then(async (r) => {
        setApp(r.data);
        try {
          const jobRes = await jobsApi.get(r.data.job_id);
          setJob(jobRes.data);
        } catch {}
      })
      .finally(() => setLoading(false));
  }, [id]);

  async function handleDownload(type: "resume" | "cover_letter", format: "tex" | "pdf") {
    const key = `${type}.${format}`;
    setDownloading(key);
    try {
      const resp =
        type === "resume"
          ? format === "tex" ? await exportApi.resumeTex(id) : await exportApi.resumePdf(id)
          : format === "tex" ? await exportApi.coverLetterTex(id) : await exportApi.coverLetterPdf(id);
      downloadBlob(resp.data as Blob, `${type}_${id.slice(0, 8)}.${format}`);
    } catch {
      alert(`Download fehlgeschlagen für ${key}`);
    } finally {
      setDownloading(null);
    }
  }

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 300 }}>
        <Loader2 style={{ width: 22, height: 22, color: "#62626b", animation: "spin 1s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!app) {
    return (
      <div style={{ textAlign: "center", padding: "60px 0" }}>
        <p style={{ color: "#9a9aa3", fontSize: 14 }}>Bewerbung nicht gefunden.</p>
        <Link href="/applications" style={{ color: "#818cf8", fontSize: 13, marginTop: 8, display: "inline-block" }}>
          ← Zurück zu Bewerbungen
        </Link>
      </div>
    );
  }

  const isComplete = app.status === "complete";
  const score = app.match_score;

  return (
    <div style={{ maxWidth: 820 }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Back link */}
      <Link
        href="/applications"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 5,
          fontSize: 13,
          color: "#9a9aa3",
          textDecoration: "none",
          marginBottom: 24,
          fontWeight: 500,
        }}
      >
        <ChevronLeft style={{ width: 14, height: 14 }} />
        Bewerbungen
      </Link>

      {/* Header card */}
      <div
        style={{
          padding: "22px 24px",
          borderRadius: 10,
          border: "1px solid #1e1e1e",
          background: "#0c0c0c",
          marginBottom: 20,
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: 11.5, color: "#62626b", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 6px" }}>
              Bewerbung
            </p>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: "#f5f5f7", margin: "0 0 4px", letterSpacing: "-0.02em" }}>
              {job?.title ?? "Job"}
            </h1>
            {job?.company && (
              <p style={{ fontSize: 13.5, color: "#9a9aa3", margin: 0 }}>
                {job.company}{job?.location ? ` · ${job.location}` : ""}
              </p>
            )}
          </div>

          {/* Score block */}
          <div style={{ flexShrink: 0, textAlign: "right" }}>
            <ScoreBadge
              status={app.status as "pending" | "analyzing" | "complete" | "error"}
              score={score}
            />
            {score != null && (
              <div style={{ marginTop: 8 }}>
                <ScoreBar value={score} />
              </div>
            )}
          </div>
        </div>

        {/* Meta row */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 16, paddingTop: 14, borderTop: "1px solid #1a1a1a" }}>
          <MetaChip
            icon={app.status === "complete" ? CheckCircle2 : Clock}
            label={statusLabel(app.status)}
            color={app.status === "complete" ? "#86efac" : app.status === "analyzing" ? "#7dd3fc" : "#9a9aa3"}
          />
          <span style={{ fontSize: 11.5, color: "#62626b", fontFamily: "var(--font-mono)" }}>
            {app.id.slice(0, 8)}
          </span>
          <span style={{ fontSize: 11.5, color: "#62626b" }}>
            {new Date(app.created_at).toLocaleDateString("de-DE", { day: "2-digit", month: "short", year: "numeric" })}
          </span>
          {job && (
            <Link
              href={`/jobs/${job.id}`}
              style={{ marginLeft: "auto", fontSize: 12.5, color: "#818cf8", textDecoration: "none", fontWeight: 500 }}
            >
              Job ansehen →
            </Link>
          )}
        </div>
      </div>

      {/* Downloads */}
      {isComplete && (
        <div
          style={{
            padding: "18px 22px",
            borderRadius: 10,
            border: "1px solid #1e1e1e",
            background: "#0c0c0c",
            marginBottom: 20,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <Download style={{ width: 14, height: 14, color: "#818cf8" }} />
            <span style={{ fontSize: 13.5, fontWeight: 600, color: "#f5f5f7" }}>Dokumente herunterladen</span>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {(["resume", "cover_letter"] as const).map((docType) =>
              (["pdf", "tex"] as const).map((fmt) => {
                const key = `${docType}.${fmt}`;
                const label = docType === "resume"
                  ? fmt === "pdf" ? "Lebenslauf PDF" : "Lebenslauf .tex"
                  : fmt === "pdf" ? "Anschreiben PDF" : "Anschreiben .tex";
                const isPrimary = fmt === "pdf";
                return (
                  <DownloadBtn
                    key={key}
                    label={label}
                    loading={downloading === key}
                    primary={isPrimary}
                    onClick={() => handleDownload(docType, fmt)}
                  />
                );
              })
            )}
          </div>
          <p style={{ fontSize: 11.5, color: "#62626b", marginTop: 10 }}>
            .tex = LaTeX-Quelltext (editierbar) · .pdf = druckfertiges Dokument
          </p>
        </div>
      )}

      {/* Analysis sections — 2 column grid */}
      {isComplete && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 }}>
          <AnalysisSection
            icon={TrendingUp}
            title="Stärken"
            items={app.strengths}
            accent="#86efac"
            accentBg="rgba(34,197,94,0.08)"
          />
          <AnalysisSection
            icon={AlertTriangle}
            title="Schwächen"
            items={app.weaknesses}
            accent="#fca5a5"
            accentBg="rgba(239,68,68,0.08)"
          />
          <AnalysisSection
            icon={Target}
            title="Skill-Lücken"
            items={app.skill_gaps}
            accent="#fcd34d"
            accentBg="rgba(234,179,8,0.08)"
          />
          <AnalysisSection
            icon={Lightbulb}
            title="Empfehlungen"
            items={app.suggestions}
            accent="#c4b5fd"
            accentBg="rgba(167,139,250,0.08)"
          />
        </div>
      )}

      {/* Cover letter */}
      {app.cover_letter && (
        <div
          style={{
            padding: "20px 22px",
            borderRadius: 10,
            border: "1px solid #1e1e1e",
            background: "#0c0c0c",
            marginBottom: 14,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <FileText style={{ width: 14, height: 14, color: "#818cf8" }} />
            <span style={{ fontSize: 13.5, fontWeight: 600, color: "#f5f5f7" }}>Anschreiben</span>
          </div>
          <pre
            style={{
              whiteSpace: "pre-wrap",
              fontSize: 13,
              color: "#9a9aa3",
              fontFamily: "var(--font-sans)",
              lineHeight: 1.7,
              margin: 0,
            }}
          >
            {app.cover_letter}
          </pre>
        </div>
      )}

      {/* Interview questions */}
      {app.interview_questions && app.interview_questions.length > 0 && (
        <div
          style={{
            padding: "20px 22px",
            borderRadius: 10,
            border: "1px solid #1e1e1e",
            background: "#0c0c0c",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <MessageSquare style={{ width: 14, height: 14, color: "#818cf8" }} />
            <span style={{ fontSize: 13.5, fontWeight: 600, color: "#f5f5f7" }}>Mögliche Interviewfragen</span>
          </div>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8 }}>
            {app.interview_questions.map((q, i) => (
              <li
                key={i}
                style={{
                  display: "flex",
                  gap: 10,
                  fontSize: 13.5,
                  color: "#9a9aa3",
                  lineHeight: 1.5,
                }}
              >
                <span style={{ color: "#3a3a3a", fontFamily: "var(--font-mono)", fontSize: 12, marginTop: 1, flexShrink: 0 }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                {q}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/* ── Helper components ────────────────────────────────────────────────────── */

function ScoreBar({ value }: { value: number }) {
  const color = value >= 75 ? "#86efac" : value >= 50 ? "#fcd34d" : "#fca5a5";
  return (
    <div style={{ width: 120, height: 4, borderRadius: 4, background: "#1a1a1a", overflow: "hidden" }}>
      <div style={{ height: "100%", width: `${value}%`, background: color, borderRadius: 4, transition: "width 0.4s ease" }} />
    </div>
  );
}

function MetaChip({ icon: Icon, label, color }: { icon: React.ElementType; label: string; color: string }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, color, fontWeight: 500 }}>
      <Icon style={{ width: 12, height: 12 }} />
      {label}
    </span>
  );
}

function AnalysisSection({
  icon: Icon,
  title,
  items,
  accent,
  accentBg,
}: {
  icon: React.ElementType;
  title: string;
  items?: string[] | null;
  accent: string;
  accentBg: string;
}) {
  if (!items?.length) return null;
  return (
    <div
      style={{
        padding: "18px 20px",
        borderRadius: 10,
        border: "1px solid #1e1e1e",
        background: "#0c0c0c",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 7,
          marginBottom: 12,
          paddingBottom: 10,
          borderBottom: `1px solid ${accentBg}`,
        }}
      >
        <div style={{ width: 26, height: 26, borderRadius: 6, background: accentBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon style={{ width: 13, height: 13, color: accent }} />
        </div>
        <span style={{ fontSize: 13, fontWeight: 600, color: "#f5f5f7" }}>{title}</span>
        <span
          style={{
            marginLeft: "auto",
            fontSize: 11,
            fontWeight: 600,
            color: accent,
            background: accentBg,
            padding: "1px 7px",
            borderRadius: 20,
          }}
        >
          {items.length}
        </span>
      </div>
      <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 6 }}>
        {items.map((item, i) => (
          <li key={i} style={{ display: "flex", gap: 8, fontSize: 13, color: "#9a9aa3", lineHeight: 1.45 }}>
            <span style={{ color: accent, fontSize: 10, marginTop: 3, flexShrink: 0 }}>●</span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function DownloadBtn({
  label,
  loading,
  primary,
  onClick,
}: {
  label: string;
  loading: boolean;
  primary: boolean;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      disabled={loading}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "7px 14px",
        borderRadius: 7,
        fontSize: 13,
        fontWeight: 600,
        cursor: loading ? "default" : "pointer",
        transition: "background 0.12s, border-color 0.12s",
        ...(primary
          ? {
              background: hovered ? "rgba(99,102,241,0.25)" : "rgba(99,102,241,0.15)",
              color: "#818cf8",
              border: "1px solid rgba(99,102,241,0.30)",
            }
          : {
              background: hovered ? "#161616" : "transparent",
              color: "#9a9aa3",
              border: "1px solid #222",
            }),
        opacity: loading ? 0.6 : 1,
      }}
    >
      {loading ? <Loader2 style={{ width: 13, height: 13, animation: "spin 1s linear infinite" }} /> : <Download style={{ width: 13, height: 13 }} />}
      {label}
    </button>
  );
}

function statusLabel(status: string): string {
  const map: Record<string, string> = {
    pending: "Ausstehend",
    analyzing: "Analysiert…",
    complete: "Abgeschlossen",
    error: "Fehler",
  };
  return map[status] ?? status;
}
