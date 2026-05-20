// frontend/src/components/ui/badges.tsx
import { Star, Loader2 } from "lucide-react";

// ─── Status Badge ────────────────────────────────────────────────────────────

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  interessant: {
    label: "Interessant",
    className: "text-[#7dd3fc] bg-[rgba(56,189,248,0.10)] border-[rgba(56,189,248,0.28)]",
  },
  beworben: {
    label: "Beworben",
    className: "text-[#c4b5fd] bg-[rgba(167,139,250,0.10)] border-[rgba(167,139,250,0.28)]",
  },
  gespräch: {
    label: "Gespräch",
    className: "text-[#fcd34d] bg-[rgba(234,179,8,0.10)] border-[rgba(234,179,8,0.30)]",
  },
  angebot: {
    label: "Angebot",
    className: "text-[#86efac] bg-[rgba(34,197,94,0.10)] border-[rgba(34,197,94,0.30)]",
  },
  abgelehnt: {
    label: "Abgelehnt",
    className: "text-[#fca5a5] bg-[rgba(239,68,68,0.10)] border-[rgba(239,68,68,0.30)]",
  },
  archiviert: {
    label: "Archiviert",
    className: "text-[#94a3b8] bg-[rgba(148,163,184,0.08)] border-[rgba(148,163,184,0.22)]",
  },
};

// Normalize key: "gespräch" and "gespraech" both map to gespräch
function normalizeStatus(v: string | null | undefined): string {
  if (!v) return "interessant";
  const lower = v.toLowerCase();
  if (lower === "gespraech" || lower === "gespräch") return "gespräch";
  return lower;
}

export function StatusBadge({ value }: { value: string | null | undefined }) {
  const key = normalizeStatus(value);
  const meta = STATUS_MAP[key] ?? STATUS_MAP.interessant;
  return (
    <span
      className={`inline-flex items-center gap-[6px] px-[10px] py-[3px] rounded-full text-[12px] font-semibold tracking-[-0.003em] border ${meta.className}`}
    >
      <span className="w-[5px] h-[5px] rounded-full bg-current flex-shrink-0" />
      {meta.label}
    </span>
  );
}

export const STATUS_OPTIONS = [
  "interessant",
  "beworben",
  "gespräch",
  "angebot",
  "abgelehnt",
  "archiviert",
] as const;

export type JobStatus = (typeof STATUS_OPTIONS)[number];

// ─── Priority Badge ───────────────────────────────────────────────────────────

const PRIORITY_MAP: Record<string, { label: string; className: string; filled: boolean }> = {
  hoch: { label: "Hoch", className: "text-[#fbbf24]", filled: true },
  mittel: { label: "Mittel", className: "text-[#a3a3ad]", filled: false },
  niedrig: { label: "Niedrig", className: "text-[#62626b]", filled: false },
};

export function PriorityBadge({ value }: { value: string | null | undefined }) {
  const key = (value ?? "mittel").toLowerCase();
  const meta = PRIORITY_MAP[key] ?? PRIORITY_MAP.mittel;
  return (
    <span className={`inline-flex items-center gap-[5px] text-[12.5px] font-semibold ${meta.className}`}>
      <Star
        className="w-[13px] h-[13px]"
        style={meta.filled ? { fill: "currentColor", strokeWidth: 1 } : { strokeWidth: 1.75 }}
      />
      {meta.label}
    </span>
  );
}

export const PRIORITY_OPTIONS = ["hoch", "mittel", "niedrig"] as const;

// ─── Score / Analysis Badge ───────────────────────────────────────────────────

type AnalysisState = "pending" | "analyzing" | "complete" | "error";

interface ScoreBadgeProps {
  status: AnalysisState;
  score?: number | null;
}

export function ScoreBadge({ status, score }: ScoreBadgeProps) {
  if (status === "analyzing") {
    return (
      <span className="inline-flex items-center gap-[6px] px-[9px] py-[3px] rounded-md text-[12px] font-medium border text-primary-soft bg-[rgba(99,102,241,0.12)] border-[rgba(99,102,241,0.35)]">
        <Loader2 className="w-[10px] h-[10px] animate-spin" />
        Analysiert…
      </span>
    );
  }

  if (status === "complete" && score != null) {
    const cls =
      score >= 75
        ? "text-[#86efac] bg-[rgba(34,197,94,0.09)] border-[rgba(34,197,94,0.25)]"
        : score >= 50
          ? "text-[#fcd34d] bg-[rgba(234,179,8,0.09)] border-[rgba(234,179,8,0.28)]"
          : "text-[#fca5a5] bg-[rgba(239,68,68,0.09)] border-[rgba(239,68,68,0.28)]";
    return (
      <span className={`inline-flex items-center px-[9px] py-[3px] rounded-md text-[12.5px] font-semibold font-mono border ${cls}`}>
        {score}%
      </span>
    );
  }

  if (status === "error") {
    return (
      <span className="inline-flex items-center px-[9px] py-[3px] rounded-md text-[12px] font-medium border text-[#fca5a5] bg-[rgba(239,68,68,0.09)] border-[rgba(239,68,68,0.28)]">
        Fehler
      </span>
    );
  }

  // pending or unknown
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "3px 9px",
        borderRadius: 6,
        fontSize: 12,
        fontWeight: 500,
        border: "1px solid #222222",
        background: "#111111",
        color: "#9a9aa3",
      }}
    >
      Ausstehend
    </span>
  );
}
