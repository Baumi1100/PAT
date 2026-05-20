"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ExternalLink,
  MapPin,
  Building2,
  Calendar,
  Euro,
  Wifi,
  Briefcase,
  Star,
  User,
  FileText,
  Pencil,
  Check,
  X,
  Loader2,
  TrendingUp,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { jobsApi, applicationsApi } from "@/lib/api";
import type { Job, Application } from "@/types/api";

const STATUS_OPTIONS = [
  "interessant",
  "beworben",
  "gespräch",
  "angebot",
  "abgelehnt",
  "archiviert",
];
const PRIORITY_OPTIONS = ["Hoch", "Mittel", "Niedrig"];

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [job, setJob] = useState<Job | null>(null);
  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [showRawText, setShowRawText] = useState(false);
  const [editField, setEditField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      jobsApi.get(id).then((r) => setJob(r.data)),
      applicationsApi
        .list()
        .then((r) => {
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

  function startEdit(field: string, current: string | null) {
    setEditField(field);
    setEditValue(current ?? "");
  }

  async function saveEdit() {
    if (!editField || !job) return;
    setSaving(true);
    try {
      const res = await jobsApi.update(id, { [editField]: editValue || null });
      setJob(res.data);
      setEditField(null);
    } finally {
      setSaving(false);
    }
  }

  function cancelEdit() {
    setEditField(null);
    setEditValue("");
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Job nicht gefunden.{" "}
        <Link href="/jobs" className="text-primary hover:underline">
          Zurück zur Übersicht
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-6">
      {/* Back + title */}
      <div>
        <Link
          href="/jobs"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Alle Jobs
        </Link>

        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold truncate">{job.title}</h1>
            <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground flex-wrap">
              {job.company && (
                <span className="flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5" />
                  {job.company}
                </span>
              )}
              {job.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {job.location}
                </span>
              )}
              {job.url && (
                <a
                  href={job.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-primary hover:underline"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Ausschreibung öffnen
                </a>
              )}
            </div>
          </div>

          <div className="shrink-0 flex items-center gap-2">
            {application && (
              <Link
                href={`/applications/${application.id}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border border-primary/30 text-primary hover:bg-primary/10 transition-colors"
              >
                <TrendingUp className="w-3.5 h-3.5" />
                {application.match_score != null ? `${application.match_score}% Match` : "Zur Analyse"}
              </Link>
            )}
            <button
              onClick={handleAnalyze}
              disabled={analyzing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-60"
            >
              {analyzing ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <TrendingUp className="w-3.5 h-3.5" />
              )}
              {analyzing ? "Analysiert…" : application ? "Neu analysieren" : "Jetzt analysieren"}
            </button>
          </div>
        </div>
      </div>

      {/* Main info grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left: tracking fields */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Tracking
          </h2>

          <TrackingRow
            icon={<Star className="w-3.5 h-3.5" />}
            label="Status"
            field="status"
            value={job.status}
            editField={editField}
            editValue={editValue}
            setEditValue={setEditValue}
            onEdit={startEdit}
            onSave={saveEdit}
            onCancel={cancelEdit}
            saving={saving}
            type="select"
            options={STATUS_OPTIONS}
          />

          <TrackingRow
            icon={<Star className="w-3.5 h-3.5" />}
            label="Priorität"
            field="priority"
            value={job.priority}
            editField={editField}
            editValue={editValue}
            setEditValue={setEditValue}
            onEdit={startEdit}
            onSave={saveEdit}
            onCancel={cancelEdit}
            saving={saving}
            type="select"
            options={PRIORITY_OPTIONS}
          />

          <TrackingRow
            icon={<Calendar className="w-3.5 h-3.5" />}
            label="Bewerbungsdatum"
            field="applied_at"
            value={job.applied_at ? job.applied_at.slice(0, 10) : null}
            editField={editField}
            editValue={editValue}
            setEditValue={setEditValue}
            onEdit={startEdit}
            onSave={saveEdit}
            onCancel={cancelEdit}
            saving={saving}
            type="date"
          />

          <TrackingRow
            icon={<User className="w-3.5 h-3.5" />}
            label="Kontaktperson"
            field="contact_person"
            value={job.contact_person}
            editField={editField}
            editValue={editValue}
            setEditValue={setEditValue}
            onEdit={startEdit}
            onSave={saveEdit}
            onCancel={cancelEdit}
            saving={saving}
          />

          <TrackingRow
            icon={<FileText className="w-3.5 h-3.5" />}
            label="Notizen"
            field="notes"
            value={job.notes}
            editField={editField}
            editValue={editValue}
            setEditValue={setEditValue}
            onEdit={startEdit}
            onSave={saveEdit}
            onCancel={cancelEdit}
            saving={saving}
            type="textarea"
          />
        </div>

        {/* Right: job details */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Stellendetails
          </h2>

          <InfoRow icon={<Building2 className="w-3.5 h-3.5" />} label="Platform" value={job.source_platform} />
          <InfoRow icon={<Euro className="w-3.5 h-3.5" />} label="Gehalt" value={job.salary_range} />
          <InfoRow icon={<Wifi className="w-3.5 h-3.5" />} label="Remote" value={job.remote_policy} />
          <InfoRow icon={<Briefcase className="w-3.5 h-3.5" />} label="Anstellungsart" value={job.employment_type} />
          <InfoRow icon={<TrendingUp className="w-3.5 h-3.5" />} label="Seniority" value={job.seniority_level} />
          <InfoRow
            icon={<Calendar className="w-3.5 h-3.5" />}
            label="Hinzugefügt"
            value={new Date(job.created_at).toLocaleDateString("de-DE", {
              day: "2-digit",
              month: "long",
              year: "numeric",
            })}
          />
        </div>
      </div>

      {/* Raw text collapsible */}
      {job.raw_text && (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <button
            onClick={() => setShowRawText(!showRawText)}
            className="w-full flex items-center justify-between px-5 py-4 text-sm font-medium hover:bg-accent/30 transition-colors"
          >
            <span className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-muted-foreground" />
              Ausschreibungstext
            </span>
            {showRawText ? (
              <ChevronUp className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            )}
          </button>
          {showRawText && (
            <div className="px-5 pb-5">
              <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-mono leading-relaxed max-h-96 overflow-y-auto rounded-lg bg-muted/30 p-4">
                {job.raw_text}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div className="flex items-start gap-3 text-sm">
      <span className="text-muted-foreground mt-0.5 shrink-0">{icon}</span>
      <span className="text-muted-foreground w-32 shrink-0">{label}</span>
      <span className={value ? "text-foreground" : "text-muted-foreground/40"}>
        {value ?? "—"}
      </span>
    </div>
  );
}

function TrackingRow({
  icon,
  label,
  field,
  value,
  editField,
  editValue,
  setEditValue,
  onEdit,
  onSave,
  onCancel,
  saving,
  type = "text",
  options,
}: {
  icon: React.ReactNode;
  label: string;
  field: string;
  value: string | null | undefined;
  editField: string | null;
  editValue: string;
  setEditValue: (v: string) => void;
  onEdit: (field: string, value: string | null) => void;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
  type?: "text" | "select" | "date" | "textarea";
  options?: string[];
}) {
  const isEditing = editField === field;

  return (
    <div className="flex items-start gap-3 text-sm group">
      <span className="text-muted-foreground mt-0.5 shrink-0">{icon}</span>
      <span className="text-muted-foreground w-36 shrink-0 pt-0.5">{label}</span>
      <div className="flex-1 min-w-0">
        {isEditing ? (
          <div className="flex items-start gap-1.5 flex-wrap">
            {type === "select" && options ? (
              <select
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="bg-muted border border-border rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                autoFocus
              >
                <option value="">—</option>
                {options.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            ) : type === "textarea" ? (
              <textarea
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                rows={3}
                className="bg-muted border border-border rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary w-full resize-none"
                autoFocus
              />
            ) : (
              <input
                type={type}
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="bg-muted border border-border rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") onSave();
                  if (e.key === "Escape") onCancel();
                }}
              />
            )}
            <div className="flex items-center gap-1 mt-0.5">
              <button
                onClick={onSave}
                disabled={saving}
                className="p-1 rounded hover:bg-primary/20 text-primary transition-colors"
              >
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={onCancel}
                className="p-1 rounded hover:bg-muted text-muted-foreground transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => onEdit(field, value ?? null)}
            className="flex items-center gap-1.5 group/edit text-left w-full"
          >
            <span className={value ? "text-foreground" : "text-muted-foreground/40"}>
              {value ?? "Klicken zum Bearbeiten"}
            </span>
            <Pencil className="w-3 h-3 text-muted-foreground/0 group-hover/edit:text-muted-foreground transition-colors shrink-0" />
          </button>
        )}
      </div>
    </div>
  );
}
