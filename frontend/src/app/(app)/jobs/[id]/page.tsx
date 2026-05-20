"use client";
import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Flag,
  Star,
  Calendar,
  User,
  FileText,
  Briefcase,
  Globe,
  Euro,
  Home,
  Shield,
  ExternalLink,
  Building2,
  MapPin,
  Sparkles,
  Loader2,
  Copy,
  Trash2,
  Check,
  X,
  Pencil,
  ChevronDown,
  ArrowLeft,
} from "lucide-react";
import { jobsApi, applicationsApi } from "@/lib/api";
import type { Job, Application } from "@/types/api";
import { StatusBadge, PriorityBadge, STATUS_OPTIONS, PRIORITY_OPTIONS } from "@/components/ui/badges";

// ─── Inline edit primitives ─────────────────────────────────────────────────

function InlineText({
  value,
  onChange,
  placeholder = "Klicken zum Bearbeiten",
  saving,
}: {
  value: string | null | undefined;
  onChange: (v: string | null) => Promise<void>;
  placeholder?: string;
  saving?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? "");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => setDraft(value ?? ""), [value]);
  useEffect(() => { if (editing) inputRef.current?.focus(); }, [editing]);

  async function confirm() {
    await onChange(draft.trim() || null);
    setEditing(false);
  }
  function cancel() { setDraft(value ?? ""); setEditing(false); }

  if (editing) {
    return (
      <div className="flex items-center gap-[6px] w-full">
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") confirm(); if (e.key === "Escape") cancel(); }}
          className="flex-1 text-foreground outline-none"
          style={{
            background: "#0e0e0e",
            border: "1px solid #6366f1",
            borderRadius: 7,
            padding: "5px 9px",
            fontSize: 13.5,
          }}
        />
        <div className="flex gap-[2px]">
          <ActionBtn onClick={confirm} variant="confirm" disabled={saving}>
            {saving ? <Loader2 style={{ width: 13, height: 13 }} className="animate-spin" /> : <Check style={{ width: 13, height: 13 }} />}
          </ActionBtn>
          <ActionBtn onClick={cancel} variant="cancel">
            <X style={{ width: 13, height: 13 }} />
          </ActionBtn>
        </div>
      </div>
    );
  }

  const empty = !value?.trim();
  return (
    <button
      onClick={() => setEditing(true)}
      className="inline-flex items-center gap-2 text-left rounded-md transition-colors group/inline"
      style={{
        padding: "4px 8px",
        margin: "-4px -8px",
        border: "1px solid transparent",
        fontSize: 13.5,
        color: empty ? "#62626b" : "#f5f5f7",
        fontStyle: empty ? "italic" : "normal",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = "#141414";
        (e.currentTarget as HTMLButtonElement).style.borderColor = "#222222";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = "transparent";
        (e.currentTarget as HTMLButtonElement).style.borderColor = "transparent";
      }}
    >
      {empty ? placeholder : value}
      <Pencil
        className="opacity-0 group-hover/inline:opacity-100 transition-opacity text-dim shrink-0"
        style={{ width: 12, height: 12 }}
      />
    </button>
  );
}

function InlineTextarea({
  value,
  onChange,
  placeholder = "Notizen hinzufügen…",
  saving,
}: {
  value: string | null | undefined;
  onChange: (v: string | null) => Promise<void>;
  placeholder?: string;
  saving?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? "");
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => setDraft(value ?? ""), [value]);
  useEffect(() => { if (editing) ref.current?.focus(); }, [editing]);

  async function confirm() {
    await onChange(draft.trim() || null);
    setEditing(false);
  }
  function cancel() { setDraft(value ?? ""); setEditing(false); }

  if (editing) {
    return (
      <div className="w-full">
        <textarea
          ref={ref}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={4}
          className="w-full text-foreground outline-none resize-none"
          style={{
            background: "#0e0e0e",
            border: "1px solid #6366f1",
            borderRadius: 7,
            padding: "8px 10px",
            fontSize: 13.5,
            lineHeight: 1.55,
            minHeight: 96,
          }}
        />
        <div className="flex gap-[2px] mt-2">
          <ActionBtn onClick={confirm} variant="confirm" disabled={saving}>
            {saving ? <Loader2 style={{ width: 13, height: 13 }} className="animate-spin" /> : <Check style={{ width: 13, height: 13 }} />}
          </ActionBtn>
          <ActionBtn onClick={cancel} variant="cancel">
            <X style={{ width: 13, height: 13 }} />
          </ActionBtn>
        </div>
      </div>
    );
  }

  const empty = !value?.trim();
  return (
    <div
      onClick={() => setEditing(true)}
      className="relative cursor-pointer group/notes w-full transition-colors"
      style={{
        background: "#0e0e0e",
        border: "1px solid #222222",
        borderRadius: 8,
        padding: "10px 12px",
        fontSize: 13,
        color: empty ? "#62626b" : "#9a9aa3",
        fontStyle: empty ? "italic" : "normal",
        lineHeight: 1.6,
        whiteSpace: "pre-wrap",
        minHeight: 60,
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = "#2a2a2a";
        (e.currentTarget as HTMLDivElement).style.background = "#0d0d0d";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = "#222222";
        (e.currentTarget as HTMLDivElement).style.background = "#0e0e0e";
      }}
    >
      {empty ? placeholder : value}
      <Pencil
        className="absolute top-2 right-2 opacity-0 group-hover/notes:opacity-100 transition-opacity text-dim"
        style={{ width: 13, height: 13 }}
      />
    </div>
  );
}

function ActionBtn({
  onClick,
  variant,
  children,
  disabled,
}: {
  onClick: () => void;
  variant: "confirm" | "cancel";
  children: React.ReactNode;
  disabled?: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const base = { width: 26, height: 26, borderRadius: 6, display: "inline-flex", alignItems: "center", justifyContent: "center", border: "1px solid #222222", background: "#0e0e0e", color: "#9a9aa3", cursor: "pointer", transition: "all 0.12s" };
  const hoverStyles =
    variant === "confirm"
      ? { color: "#86efac", borderColor: "rgba(34,197,94,0.3)", background: "rgba(34,197,94,0.08)" }
      : { color: "#fca5a5", borderColor: "rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.08)" };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{ ...base, ...(hovered ? hoverStyles : {}), opacity: disabled ? 0.5 : 1 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {children}
    </button>
  );
}

// ─── Status/Priority Popover ────────────────────────────────────────────────

function StatusPopover({
  value,
  onChange,
}: {
  value: string | null | undefined;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") setOpen(false); }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div ref={containerRef} style={{ position: "relative", display: "inline-block" }}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-2 rounded-md transition-colors group/inline"
        style={{
          padding: "4px 6px",
          margin: "-4px -6px",
          border: `1px solid ${open ? "#2a2a2a" : "transparent"}`,
          background: open ? "#141414" : "transparent",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = "#141414";
          (e.currentTarget as HTMLButtonElement).style.borderColor = "#222222";
        }}
        onMouseLeave={(e) => {
          if (!open) {
            (e.currentTarget as HTMLButtonElement).style.background = "transparent";
            (e.currentTarget as HTMLButtonElement).style.borderColor = "transparent";
          }
        }}
      >
        <StatusBadge value={value} />
        <Pencil
          className="opacity-0 group-hover/inline:opacity-100 transition-opacity text-dim"
          style={{ width: 12, height: 12 }}
        />
      </button>
      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            zIndex: 50,
            background: "#111111",
            border: "1px solid #2a2a2a",
            borderRadius: 9,
            padding: 5,
            boxShadow: "0 18px 48px -16px rgba(0,0,0,0.6)",
            minWidth: 200,
            display: "flex",
            flexDirection: "column",
            gap: 1,
          }}
        >
          {STATUS_OPTIONS.map((opt) => {
            const active = (value ?? "interessant").toLowerCase() === opt;
            return (
              <button
                key={opt}
                onClick={() => { onChange(opt); setOpen(false); }}
                className="flex items-center gap-2 text-left transition-colors rounded-md"
                style={{
                  padding: "7px 9px",
                  borderRadius: 6,
                  fontSize: 13,
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "#141414")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "transparent")}
              >
                <StatusBadge value={opt} />
                <Check
                  style={{
                    width: 13,
                    height: 13,
                    marginLeft: "auto",
                    color: "#818cf8",
                    opacity: active ? 1 : 0,
                  }}
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function PriorityPopover({
  value,
  onChange,
}: {
  value: string | null | undefined;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={containerRef} style={{ position: "relative", display: "inline-block" }}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-2 rounded-md transition-colors group/inline"
        style={{
          padding: "4px 6px",
          margin: "-4px -6px",
          border: `1px solid ${open ? "#2a2a2a" : "transparent"}`,
          background: open ? "#141414" : "transparent",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = "#141414";
          (e.currentTarget as HTMLButtonElement).style.borderColor = "#222222";
        }}
        onMouseLeave={(e) => {
          if (!open) {
            (e.currentTarget as HTMLButtonElement).style.background = "transparent";
            (e.currentTarget as HTMLButtonElement).style.borderColor = "transparent";
          }
        }}
      >
        <PriorityBadge value={value} />
        <Pencil
          className="opacity-0 group-hover/inline:opacity-100 transition-opacity text-dim"
          style={{ width: 12, height: 12 }}
        />
      </button>
      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            zIndex: 50,
            background: "#111111",
            border: "1px solid #2a2a2a",
            borderRadius: 9,
            padding: 5,
            boxShadow: "0 18px 48px -16px rgba(0,0,0,0.6)",
            minWidth: 160,
            display: "flex",
            flexDirection: "column",
            gap: 1,
          }}
        >
          {PRIORITY_OPTIONS.map((opt) => {
            const active = (value ?? "mittel").toLowerCase() === opt;
            return (
              <button
                key={opt}
                onClick={() => { onChange(opt); setOpen(false); }}
                className="flex items-center gap-2 text-left"
                style={{
                  padding: "7px 9px",
                  borderRadius: 6,
                  fontSize: 13,
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "#141414")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "transparent")}
              >
                <PriorityBadge value={opt} />
                <Check
                  style={{
                    width: 13,
                    height: 13,
                    marginLeft: "auto",
                    color: "#818cf8",
                    opacity: active ? 1 : 0,
                  }}
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Match Circle ────────────────────────────────────────────────────────────

function MatchCircle({ score, analyzing }: { score?: number | null; analyzing?: boolean }) {
  const SIZE = 54;
  const STROKE = 5;
  const R = (SIZE - STROKE) / 2;
  const CIRC = 2 * Math.PI * R;

  if (analyzing) {
    return (
      <div style={{ width: SIZE, height: SIZE, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
        <svg width={SIZE} height={SIZE} style={{ position: "absolute", inset: 0, animation: "spin 1.4s linear infinite" }}>
          <circle cx={SIZE / 2} cy={SIZE / 2} r={R} fill="none" stroke="rgba(99,102,241,0.15)" strokeWidth={STROKE} />
          <circle cx={SIZE / 2} cy={SIZE / 2} r={R} fill="none" stroke="#6366f1" strokeWidth={STROKE}
            strokeDasharray={`${CIRC * 0.3} ${CIRC * 0.7}`} strokeLinecap="round"
            style={{ transformOrigin: "center" }}
          />
        </svg>
        <span style={{ fontSize: 12, fontWeight: 700, color: "#818cf8", position: "relative", zIndex: 1 }}>…</span>
      </div>
    );
  }

  if (score == null) return null;

  const trackColor = "rgba(255,255,255,0.06)";
  const fillColor = score >= 75 ? "#22c55e" : score >= 50 ? "#eab308" : "#ef4444";
  const textColor = score >= 75 ? "#86efac" : score >= 50 ? "#fcd34d" : "#fca5a5";
  const offset = CIRC - (score / 100) * CIRC;

  return (
    <div style={{ width: SIZE, height: SIZE, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
      <svg width={SIZE} height={SIZE} style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)" }}>
        <circle cx={SIZE / 2} cy={SIZE / 2} r={R} fill="none" stroke={trackColor} strokeWidth={STROKE} />
        <circle cx={SIZE / 2} cy={SIZE / 2} r={R} fill="none" stroke={fillColor} strokeWidth={STROKE}
          strokeDasharray={CIRC} strokeDashoffset={offset} strokeLinecap="round"
        />
      </svg>
      <span style={{ fontSize: 12, fontWeight: 700, color: textColor, position: "relative", zIndex: 1 }}>
        {score}%
      </span>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [job, setJob] = useState<Job | null>(null);
  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [rawOpen, setRawOpen] = useState(false);

  useEffect(() => {
    Promise.all([
      jobsApi.get(id).then((r) => setJob(r.data)),
      applicationsApi.list().then((r) => {
        const app = r.data.find((a) => a.job_id === id);
        setApplication(app ?? null);
      }),
    ]).finally(() => setLoading(false));
  }, [id]);

  async function handleAnalyze() {
    if (!job) return;
    setAnalyzing(true);
    try {
      const res = await jobsApi.analyze(id);
      const appId = res.data.application_id;
      router.push(`/applications/${appId}`);
    } finally {
      setAnalyzing(false);
    }
  }

  async function handlePatch(field: string, value: string | null) {
    if (!job) return;
    setSaving(true);
    try {
      const res = await jobsApi.update(id, { [field]: value });
      setJob(res.data);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ height: 256 }}>
        <Loader2 className="animate-spin text-muted-foreground" style={{ width: 24, height: 24 }} />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="text-center text-muted-foreground p-12">
        Job nicht gefunden.{" "}
        <Link href="/jobs" className="text-primary-soft hover:underline">
          Zurück zur Übersicht
        </Link>
      </div>
    );
  }

  const appStatus = application?.status as "pending" | "analyzing" | "complete" | "error" | undefined;
  const hasScore = appStatus === "complete" && application?.match_score != null;
  const isAnalyzing = appStatus === "analyzing" || analyzing;

  const appliedAt = job.applied_at
    ? new Date(job.applied_at).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" })
    : null;

  const cardStyle = {
    background: "#111111",
    border: "1px solid #222222",
    borderRadius: 12,
    overflow: "hidden",
  };

  const kvRowStyle = {
    display: "grid",
    gridTemplateColumns: "140px 1fr",
    gap: 14,
    alignItems: "center",
    padding: "11px 0",
    borderBottom: "1px dashed #222222",
    fontSize: 13.5,
  };

  const fieldRowStyle = {
    display: "grid",
    gridTemplateColumns: "140px 1fr",
    gap: 14,
    alignItems: "start",
    padding: "13px 0",
    borderBottom: "1px dashed #222222",
  };

  return (
    <div style={{ maxWidth: 1280 }}>
      {/* Back link */}
      <Link
        href="/jobs"
        className="inline-flex items-center gap-[6px] text-muted-foreground hover:text-foreground transition-colors mb-5"
        style={{ fontSize: 13 }}
      >
        <ArrowLeft style={{ width: 14, height: 14 }} />
        Alle Jobs
      </Link>

      {/* Header card */}
      <div
        style={{ ...cardStyle, padding: "22px 24px", marginBottom: 20, display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 24 }}
      >
        <div className="min-w-0 flex-1">
          {/* Eyebrow */}
          <div
            className="flex items-center gap-2 font-semibold uppercase text-dim mb-2"
            style={{ fontSize: 11.5, letterSpacing: "0.08em" }}
          >
            <span>Job</span>
            <span>·</span>
            {job.source_platform && (
              <span
                className="font-mono normal-case text-muted-foreground"
                style={{
                  fontSize: 10.5,
                  letterSpacing: 0,
                  background: "#141414",
                  border: "1px solid #222222",
                  borderRadius: 5,
                  padding: "2px 8px",
                }}
              >
                {job.source_platform}
              </span>
            )}
          </div>

          {/* Title */}
          <h1
            className="font-bold text-foreground"
            style={{ fontSize: 22, letterSpacing: "-0.02em", lineHeight: 1.25, margin: "0 0 8px" }}
          >
            {job.title}
          </h1>

          {/* Meta */}
          <div className="flex items-center gap-[14px] text-muted-foreground flex-wrap" style={{ fontSize: 13.5 }}>
            {job.company && (
              <span className="flex items-center gap-[5px]">
                <Building2 className="text-dim" style={{ width: 13, height: 13 }} />
                {job.company}
              </span>
            )}
            {job.location && (
              <span className="flex items-center gap-[5px]">
                <MapPin className="text-dim" style={{ width: 13, height: 13 }} />
                {job.location}
              </span>
            )}
            {job.url && (
              <a
                href={job.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 hover:underline"
                style={{ color: "#818cf8" }}
              >
                Stellenanzeige
                <ExternalLink style={{ width: 13, height: 13 }} />
              </a>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            className="flex items-center justify-center rounded-lg border border-transparent text-muted-foreground hover:bg-card hover:border-border hover:text-foreground transition-colors"
            style={{ width: 32, height: 32 }}
            title="Kopieren"
          >
            <Copy style={{ width: 14, height: 14 }} />
          </button>
          <button
            className="inline-flex items-center gap-[7px] px-[9px] py-[5px] rounded-md text-[12px] font-semibold transition-colors"
            style={{ color: "#fca5a5" }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "rgba(239,68,68,0.08)";
              (e.currentTarget as HTMLButtonElement).style.border = "1px solid rgba(239,68,68,0.3)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "transparent";
              (e.currentTarget as HTMLButtonElement).style.border = "1px solid transparent";
            }}
          >
            <Trash2 style={{ width: 12, height: 12 }} />
            Löschen
          </button>
          {application && (
            <Link
              href={`/applications/${application.id}`}
              className="inline-flex items-center gap-[7px] px-3 py-[7px] rounded-md text-[13px] font-semibold border border-border bg-card hover:bg-card-hover transition-colors"
            >
              {hasScore ? `${application.match_score}% Match` : "Zur Analyse"}
            </Link>
          )}
          <button
            onClick={handleAnalyze}
            disabled={analyzing}
            className="inline-flex items-center gap-[7px] px-3 py-[7px] rounded-md text-[13px] font-semibold text-white transition-colors disabled:opacity-60"
            style={{ background: "#6366f1" }}
            onMouseEnter={(e) => !analyzing && ((e.currentTarget as HTMLButtonElement).style.background = "#5457e8")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "#6366f1")}
          >
            {analyzing ? (
              <Loader2 style={{ width: 14, height: 14 }} className="animate-spin" />
            ) : (
              <Sparkles style={{ width: 14, height: 14 }} />
            )}
            {analyzing ? "Analysiert…" : application ? "Neu analysieren" : "Jetzt analysieren"}
          </button>
        </div>
      </div>

      {/* Two-column grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
        {/* Tracking card */}
        <div style={cardStyle}>
          <div
            className="flex items-center justify-between gap-3"
            style={{ padding: "14px 18px", borderBottom: "1px solid #222222" }}
          >
            <div className="flex items-center gap-2 font-semibold text-foreground" style={{ fontSize: 14, letterSpacing: "-0.005em" }}>
              <Flag className="text-muted-foreground" style={{ width: 14, height: 14 }} />
              Tracking
            </div>
            <span className="font-mono text-dim" style={{ fontSize: 11.5 }}>
              {appliedAt ? `Aktualisiert ${appliedAt}` : "Noch nicht beworben"}
            </span>
          </div>
          <div style={{ padding: "8px 18px 18px" }}>
            {/* Status */}
            <div style={{ ...fieldRowStyle, alignItems: "center" }}>
              <div className="flex items-center gap-[6px] text-muted-foreground" style={{ fontSize: 12.5, fontWeight: 500, paddingTop: 5 }}>
                <Flag className="text-dim" style={{ width: 12, height: 12 }} />
                Status
              </div>
              <StatusPopover
                value={job.status}
                onChange={(v) => handlePatch("status", v)}
              />
            </div>

            {/* Priority */}
            <div style={{ ...fieldRowStyle, alignItems: "center" }}>
              <div className="flex items-center gap-[6px] text-muted-foreground" style={{ fontSize: 12.5, fontWeight: 500, paddingTop: 5 }}>
                <Star className="text-dim" style={{ width: 12, height: 12 }} />
                Priorität
              </div>
              <PriorityPopover
                value={job.priority}
                onChange={(v) => handlePatch("priority", v)}
              />
            </div>

            {/* Applied at */}
            <div style={fieldRowStyle}>
              <div className="flex items-center gap-[6px] text-muted-foreground" style={{ fontSize: 12.5, fontWeight: 500, paddingTop: 5 }}>
                <Calendar className="text-dim" style={{ width: 12, height: 12 }} />
                Bewerbungsdatum
              </div>
              <div className="flex items-start pt-[2px]">
                <InlineText
                  value={appliedAt}
                  onChange={async (v) => {
                    if (!v) { await handlePatch("applied_at", null); return; }
                    const m = v.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
                    if (m) await handlePatch("applied_at", `${m[3]}-${m[2]}-${m[1]}`);
                  }}
                  placeholder="TT.MM.JJJJ"
                  saving={saving}
                />
              </div>
            </div>

            {/* Contact */}
            <div style={fieldRowStyle}>
              <div className="flex items-center gap-[6px] text-muted-foreground" style={{ fontSize: 12.5, fontWeight: 500, paddingTop: 5 }}>
                <User className="text-dim" style={{ width: 12, height: 12 }} />
                Kontaktperson
              </div>
              <div className="flex items-start pt-[2px]">
                <InlineText
                  value={job.contact_person}
                  onChange={(v) => handlePatch("contact_person", v)}
                  placeholder="Name hinzufügen"
                  saving={saving}
                />
              </div>
            </div>

            {/* Notes */}
            <div style={{ ...fieldRowStyle, borderBottom: "none", alignItems: "start" }}>
              <div className="flex items-center gap-[6px] text-muted-foreground" style={{ fontSize: 12.5, fontWeight: 500, paddingTop: 10 }}>
                <FileText className="text-dim" style={{ width: 12, height: 12 }} />
                Notizen
              </div>
              <InlineTextarea
                value={job.notes}
                onChange={(v) => handlePatch("notes", v)}
                placeholder="Eigene Notizen hinzufügen — Gespräche, Eindrücke, To-dos…"
                saving={saving}
              />
            </div>
          </div>
        </div>

        {/* Details card */}
        <div style={cardStyle}>
          <div
            className="flex items-center justify-between gap-3"
            style={{ padding: "14px 18px", borderBottom: "1px solid #222222" }}
          >
            <div className="flex items-center gap-2 font-semibold text-foreground" style={{ fontSize: 14, letterSpacing: "-0.005em" }}>
              <Briefcase className="text-muted-foreground" style={{ width: 14, height: 14 }} />
              Stellendetails
            </div>
            <span className="text-dim" style={{ fontSize: 11.5 }}>Schreibgeschützt</span>
          </div>
          <div style={{ padding: "8px 18px 18px" }}>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {[
                { icon: Globe, label: "Plattform", value: job.source_platform },
                { icon: Euro, label: "Gehalt", value: job.salary_range, mono: true },
                { icon: Home, label: "Remote", value: job.remote_policy },
                { icon: Briefcase, label: "Anstellungsart", value: job.employment_type },
                { icon: Shield, label: "Seniority", value: job.seniority_level },
                {
                  icon: Calendar,
                  label: "Hinzugefügt",
                  value: new Date(job.created_at).toLocaleDateString("de-DE", { day: "2-digit", month: "long", year: "numeric" }),
                },
              ].map(({ icon: Icon, label, value, mono }, idx, arr) => (
                <div
                  key={label}
                  style={{
                    ...kvRowStyle,
                    borderBottom: idx === arr.length - 1 ? "none" : "1px dashed #222222",
                  }}
                >
                  <div className="flex items-center gap-[6px] text-muted-foreground" style={{ fontSize: 12.5, fontWeight: 500 }}>
                    <Icon className="text-dim" style={{ width: 12, height: 12 }} />
                    {label}
                  </div>
                  <div
                    className={mono ? "font-mono" : ""}
                    style={{ fontSize: 13.5, fontWeight: 500, color: value ? "#f5f5f7" : "#62626b" }}
                  >
                    {value ?? "—"}
                  </div>
                </div>
              ))}
            </div>

            {/* Match block */}
            {(hasScore || isAnalyzing) && (
              <div
                style={{
                  marginTop: 12,
                  background: "linear-gradient(180deg, rgba(99,102,241,0.06), transparent)",
                  border: "1px solid rgba(99,102,241,0.2)",
                  borderRadius: 10,
                  padding: "14px 16px",
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                }}
              >
                <MatchCircle
                  score={hasScore ? application!.match_score : null}
                  analyzing={isAnalyzing && !hasScore}
                />
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-foreground" style={{ fontSize: 13.5, margin: "0 0 2px" }}>
                    {isAnalyzing && !hasScore
                      ? "Analyse läuft"
                      : hasScore && application!.match_score! >= 75
                        ? "Sehr gute Übereinstimmung"
                        : hasScore && application!.match_score! >= 50
                          ? "Solider Match"
                          : "Geringe Übereinstimmung"}
                  </h4>
                  <p className="text-muted-foreground" style={{ fontSize: 12.5, lineHeight: 1.5, margin: 0 }}>
                    {isAnalyzing && !hasScore
                      ? "Stellenanzeige wird mit deinem persönlichen Profil abgeglichen…"
                      : "Basierend auf deinem persönlichen Profil und den Anforderungen der Stelle."}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Raw text collapsible */}
      {job.raw_text && (
        <div
          style={{
            background: "#111111",
            border: "1px solid #222222",
            borderRadius: 12,
            overflow: "hidden",
          }}
        >
          <button
            onClick={() => setRawOpen((o) => !o)}
            className="w-full flex items-center justify-between gap-3 transition-colors"
            style={{
              padding: "14px 18px",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "#141414")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "transparent")}
          >
            <h3
              className="flex items-center gap-2 font-semibold text-foreground"
              style={{ fontSize: 14, margin: 0 }}
            >
              <FileText className="text-muted-foreground" style={{ width: 14, height: 14 }} />
              Rohtext der Stellenanzeige
            </h3>
            <span className="flex items-center gap-[10px]">
              <span className="font-mono text-dim" style={{ fontSize: 11.5 }}>
                {job.raw_text.length.toLocaleString("de-DE")} Zeichen
              </span>
              <ChevronDown
                className="text-muted-foreground transition-transform"
                style={{
                  width: 14,
                  height: 14,
                  transform: rawOpen ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "transform 0.15s ease",
                }}
              />
            </span>
          </button>
          {rawOpen && (
            <div
              style={{
                borderTop: "1px solid #222222",
                padding: "0 18px 18px",
              }}
            >
              <pre
                className="font-mono"
                style={{
                  fontSize: 12,
                  background: "#080808",
                  border: "1px solid #222222",
                  borderRadius: 8,
                  padding: 14,
                  marginTop: 14,
                  lineHeight: 1.65,
                  color: "#bcbcc4",
                  whiteSpace: "pre-wrap",
                  maxHeight: 380,
                  overflowY: "auto",
                  margin: "14px 0 0",
                }}
              >
                {job.raw_text}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
