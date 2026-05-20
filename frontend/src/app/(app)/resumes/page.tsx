// frontend/src/app/(app)/resumes/page.tsx
"use client";
import { useEffect, useState, useRef } from "react";
import { Upload, FileText, Trash2, Star, Loader2 } from "lucide-react";
import { resumesApi } from "@/lib/api";
import type { Resume } from "@/types/api";

export default function ResumesPage() {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [settingPrimaryId, setSettingPrimaryId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function load() {
    resumesApi.list().then((r) => setResumes(r.data)).catch(() => {}).finally(() => setLoading(false));
  }
  useEffect(() => { load(); }, []);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      await resumesApi.upload(file);
      load();
    } catch {
      alert("Upload fehlgeschlagen");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function handleSetPrimary(id: string) {
    setSettingPrimaryId(id);
    try {
      await resumesApi.update(id, { is_primary: true });
      setResumes((prev) => prev.map((r) => ({ ...r, is_primary: r.id === id })));
    } finally {
      setSettingPrimaryId(null);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      await resumesApi.delete(id);
      setResumes((prev) => prev.filter((r) => r.id !== id));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div style={{ maxWidth: 860 }}>
      {/* Page header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: "#f5f5f7", margin: 0, letterSpacing: "-0.02em" }}>
            Lebensläufe{" "}
            {!loading && resumes.length > 0 && (
              <span style={{ fontSize: 15, fontWeight: 500, color: "#62626b", fontFamily: "var(--font-mono)", letterSpacing: "0" }}>
                {resumes.length}
              </span>
            )}
          </h1>
          <p style={{ fontSize: 14, color: "#9a9aa3", marginTop: 4 }}>
            Lade deinen Lebenslauf hoch — die KI verwendet ihn für Match-Scores und Bewerbungen.
          </p>
        </div>

        {/* Upload button */}
        <label
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 7,
            padding: "8px 16px",
            borderRadius: 8,
            fontSize: 13.5,
            fontWeight: 600,
            background: uploading ? "rgba(99,102,241,0.15)" : "rgba(99,102,241,0.90)",
            color: uploading ? "#818cf8" : "#fff",
            border: uploading ? "1px solid rgba(99,102,241,0.30)" : "1px solid rgba(99,102,241,0.60)",
            cursor: uploading ? "default" : "pointer",
            transition: "background 0.15s",
            flexShrink: 0,
          }}
        >
          {uploading ? <Loader2 style={{ width: 14, height: 14, animation: "spin 1s linear infinite" }} /> : <Upload style={{ width: 14, height: 14 }} />}
          {uploading ? "Hochladen…" : "Lebenslauf hochladen"}
          <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,.tex,.txt" style={{ display: "none" }} onChange={handleUpload} />
        </label>
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {[...Array(2)].map((_, i) => (
            <div key={i} style={{ height: 60, borderRadius: 8, background: "#111111", border: "1px solid #1a1a1a" }} />
          ))}
        </div>
      ) : resumes.length === 0 ? (
        <EmptyUploadZone onClick={() => fileRef.current?.click()} />
      ) : (
        <div style={{ border: "1px solid #1e1e1e", borderRadius: 10, overflow: "hidden", background: "#0c0c0c" }}>
          {/* Header */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 100px 90px",
              padding: "0 18px",
              height: 38,
              alignItems: "center",
              borderBottom: "1px solid #1e1e1e",
            }}
          >
            {["DATEI", "STATUS", ""].map((h) => (
              <span key={h} style={{ fontSize: 11, fontWeight: 600, color: "#62626b", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                {h}
              </span>
            ))}
          </div>

          {resumes.map((r, i) => (
            <ResumeRow
              key={r.id}
              resume={r}
              last={i === resumes.length - 1}
              settingPrimary={settingPrimaryId === r.id}
              deleting={deletingId === r.id}
              onSetPrimary={() => handleSetPrimary(r.id)}
              onDelete={() => handleDelete(r.id)}
            />
          ))}
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function ResumeRow({
  resume: r,
  last,
  settingPrimary,
  deleting,
  onSetPrimary,
  onDelete,
}: {
  resume: Resume;
  last: boolean;
  settingPrimary: boolean;
  deleting: boolean;
  onSetPrimary: () => void;
  onDelete: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 100px 90px",
        padding: "0 18px",
        height: 58,
        alignItems: "center",
        borderBottom: last ? "none" : "1px solid #1a1a1a",
        background: hovered ? "rgba(99,102,241,0.03)" : "transparent",
        transition: "background 0.1s",
      }}
    >
      {/* File info */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: 7,
            background: "#161616",
            border: "1px solid #222",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <FileText style={{ width: 15, height: 15, color: "#62626b" }} />
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 13.5, fontWeight: 500, color: "#f5f5f7", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {r.title}
          </div>
          {r.file_name && r.file_name !== r.title && (
            <div style={{ fontSize: 11.5, color: "#62626b", marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {r.file_name}
            </div>
          )}
        </div>
      </div>

      {/* Status */}
      <div>
        {r.is_primary ? (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              padding: "3px 8px",
              borderRadius: 20,
              fontSize: 11.5,
              fontWeight: 600,
              color: "#fbbf24",
              background: "rgba(251,191,36,0.10)",
              border: "1px solid rgba(251,191,36,0.25)",
            }}
          >
            <Star style={{ width: 10, height: 10, fill: "currentColor", strokeWidth: 0 }} />
            Primär
          </span>
        ) : (
          <span style={{ fontSize: 12, color: "#62626b" }}>—</span>
        )}
      </div>

      {/* Actions */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 4 }}>
        {!r.is_primary && (
          <ActionBtn
            title="Als primären Lebenslauf setzen"
            visible={hovered}
            loading={settingPrimary}
            onClick={onSetPrimary}
            style="star"
          />
        )}
        <ActionBtn
          title="Löschen"
          visible={hovered}
          loading={deleting}
          onClick={onDelete}
          style="danger"
        />
      </div>
    </div>
  );
}

function ActionBtn({
  title,
  visible,
  loading,
  onClick,
  style: variant,
}: {
  title: string;
  visible: boolean;
  loading: boolean;
  onClick: () => void;
  style: "star" | "danger";
}) {
  const [hovered, setHovered] = useState(false);

  const colors = variant === "danger"
    ? { text: hovered ? "#fca5a5" : "#9a9aa3", bg: hovered ? "rgba(239,68,68,0.08)" : "transparent", border: hovered ? "rgba(239,68,68,0.25)" : "transparent" }
    : { text: hovered ? "#fbbf24" : "#9a9aa3", bg: hovered ? "rgba(251,191,36,0.08)" : "transparent", border: hovered ? "rgba(251,191,36,0.25)" : "transparent" };

  return (
    <button
      title={title}
      onClick={onClick}
      disabled={loading}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: 28,
        height: 28,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 6,
        border: `1px solid ${colors.border}`,
        background: colors.bg,
        color: colors.text,
        opacity: visible || loading ? 1 : 0,
        transition: "opacity 0.1s, background 0.1s, color 0.1s",
        cursor: loading ? "default" : "pointer",
      }}
    >
      {loading ? (
        <Loader2 style={{ width: 12, height: 12, animation: "spin 1s linear infinite" }} />
      ) : variant === "star" ? (
        <Star style={{ width: 12, height: 12 }} />
      ) : (
        <Trash2 style={{ width: 12, height: 12 }} />
      )}
    </button>
  );
}

function EmptyUploadZone({ onClick }: { onClick: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 10,
        padding: "52px 32px",
        border: `2px dashed ${hovered ? "rgba(99,102,241,0.40)" : "#222"}`,
        borderRadius: 10,
        background: hovered ? "rgba(99,102,241,0.03)" : "#0c0c0c",
        cursor: "pointer",
        transition: "border-color 0.15s, background 0.15s",
        textAlign: "center",
      }}
    >
      <div
        style={{
          width: 42,
          height: 42,
          borderRadius: 10,
          background: hovered ? "rgba(99,102,241,0.12)" : "#161616",
          border: `1px solid ${hovered ? "rgba(99,102,241,0.25)" : "#222"}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "background 0.15s, border-color 0.15s",
        }}
      >
        <Upload style={{ width: 18, height: 18, color: hovered ? "#818cf8" : "#62626b", transition: "color 0.15s" }} />
      </div>
      <div>
        <p style={{ fontSize: 14, fontWeight: 600, color: "#f5f5f7", margin: 0 }}>Lebenslauf hochladen</p>
        <p style={{ fontSize: 13, color: "#9a9aa3", marginTop: 3 }}>PDF, Word oder LaTeX — max. 10 MB</p>
      </div>
    </div>
  );
}
