// frontend/src/app/(app)/certificates/page.tsx
"use client";
import { useEffect, useRef, useState } from "react";
import { Award, Trash2, Upload, FileText, Loader2, Info } from "lucide-react";
import { certificatesApi } from "@/lib/api";
import type { WorkCertificate } from "@/types/api";

export default function CertificatesPage() {
  const [certs, setCerts] = useState<WorkCertificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    certificatesApi.list().then((r) => setCerts(r.data)).finally(() => setLoading(false));
  }, []);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const res = await certificatesApi.upload(file);
      setCerts((prev) => [res.data, ...prev]);
    } catch {
      setError("Upload fehlgeschlagen. Bitte versuche es erneut.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      await certificatesApi.delete(id);
      setCerts((prev) => prev.filter((c) => c.id !== id));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div style={{ maxWidth: 760 }}>
      {/* Page header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: "#f5f5f7", margin: 0, letterSpacing: "-0.02em" }}>
            Zeugnisse{" "}
            {!loading && certs.length > 0 && (
              <span style={{ fontSize: 15, fontWeight: 500, color: "#62626b", fontFamily: "var(--font-mono)", letterSpacing: "0" }}>
                {certs.length}
              </span>
            )}
          </h1>
          <p style={{ fontSize: 14, color: "#9a9aa3", marginTop: 4, maxWidth: 520 }}>
            Lade Arbeitszeugnisse hoch — die KI extrahiert Erfahrungen und Kompetenzen für Match-Score und Anschreiben.
          </p>
        </div>
      </div>

      {/* Info banner */}
      <div
        style={{
          display: "flex",
          gap: 12,
          padding: "13px 16px",
          borderRadius: 9,
          border: "1px solid rgba(99,102,241,0.20)",
          background: "rgba(99,102,241,0.06)",
          marginBottom: 20,
        }}
      >
        <Info style={{ width: 15, height: 15, color: "#818cf8", flexShrink: 0, marginTop: 1 }} />
        <p style={{ fontSize: 13, color: "#9a9aa3", margin: 0, lineHeight: 1.55 }}>
          Beim nächsten Analyse-Durchlauf werden die Zeugnisse automatisch berücksichtigt.
          Bestehende Bewerbungen müssen ggf. erneut analysiert werden.
        </p>
      </div>

      {/* Upload zone */}
      <UploadZone uploading={uploading} onClick={() => inputRef.current?.click()} />
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.docx,.txt,.png,.jpg,.jpeg,.webp"
        style={{ display: "none" }}
        onChange={handleUpload}
      />

      {/* Error */}
      {error && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 14px",
            borderRadius: 8,
            border: "1px solid rgba(239,68,68,0.25)",
            background: "rgba(239,68,68,0.06)",
            marginTop: 12,
          }}
        >
          <p style={{ fontSize: 13, color: "#fca5a5", margin: 0 }}>{error}</p>
        </div>
      )}

      {/* Certificate list */}
      <div style={{ marginTop: 20 }}>
        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {[...Array(2)].map((_, i) => (
              <div key={i} style={{ height: 56, borderRadius: 8, background: "#111111", border: "1px solid #1a1a1a" }} />
            ))}
          </div>
        ) : certs.length === 0 ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 8,
              padding: "40px 32px",
              textAlign: "center",
            }}
          >
            <Award style={{ width: 28, height: 28, color: "#3a3a3a" }} />
            <p style={{ fontSize: 13, color: "#62626b", margin: 0 }}>Noch keine Zeugnisse hochgeladen.</p>
          </div>
        ) : (
          <div style={{ border: "1px solid #1e1e1e", borderRadius: 10, overflow: "hidden", background: "#0c0c0c" }}>
            {/* Header */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 110px 44px",
                padding: "0 18px",
                height: 38,
                alignItems: "center",
                borderBottom: "1px solid #1e1e1e",
              }}
            >
              {["DATEI", "HOCHGELADEN", ""].map((h) => (
                <span key={h} style={{ fontSize: 11, fontWeight: 600, color: "#62626b", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  {h}
                </span>
              ))}
            </div>

            {certs.map((cert, i) => (
              <CertRow
                key={cert.id}
                cert={cert}
                last={i === certs.length - 1}
                deleting={deletingId === cert.id}
                onDelete={() => handleDelete(cert.id)}
              />
            ))}
          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function CertRow({
  cert,
  last,
  deleting,
  onDelete,
}: {
  cert: WorkCertificate;
  last: boolean;
  deleting: boolean;
  onDelete: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const [btnHovered, setBtnHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 110px 44px",
        padding: "0 18px",
        height: 56,
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
            width: 32,
            height: 32,
            borderRadius: 7,
            background: "#161616",
            border: "1px solid #222",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <FileText style={{ width: 14, height: 14, color: "#62626b" }} />
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 13.5, fontWeight: 500, color: "#f5f5f7", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {cert.file_name ?? cert.title}
          </div>
          <div style={{ fontSize: 11.5, color: "#62626b", marginTop: 1 }}>
            {cert.file_type?.toUpperCase() ?? "Dokument"}
          </div>
        </div>
      </div>

      {/* Date */}
      <div style={{ fontSize: 12.5, color: "#9a9aa3", fontFamily: "var(--font-mono)" }}>
        {new Date(cert.created_at).toLocaleDateString("de-DE", { day: "2-digit", month: "short", year: "numeric" })}
      </div>

      {/* Delete */}
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button
          onClick={onDelete}
          disabled={deleting}
          onMouseEnter={() => setBtnHovered(true)}
          onMouseLeave={() => setBtnHovered(false)}
          style={{
            width: 28,
            height: 28,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 6,
            border: `1px solid ${btnHovered ? "rgba(239,68,68,0.25)" : "transparent"}`,
            background: btnHovered ? "rgba(239,68,68,0.08)" : "transparent",
            color: btnHovered ? "#fca5a5" : "#62626b",
            opacity: hovered || deleting ? 1 : 0,
            transition: "opacity 0.1s, background 0.1s, color 0.1s",
            cursor: deleting ? "default" : "pointer",
          }}
        >
          {deleting ? (
            <Loader2 style={{ width: 12, height: 12, animation: "spin 1s linear infinite" }} />
          ) : (
            <Trash2 style={{ width: 12, height: 12 }} />
          )}
        </button>
      </div>
    </div>
  );
}

function UploadZone({ uploading, onClick }: { uploading: boolean; onClick: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "16px 20px",
        borderRadius: 9,
        border: `2px dashed ${hovered ? "rgba(99,102,241,0.40)" : "#1e1e1e"}`,
        background: hovered ? "rgba(99,102,241,0.03)" : "transparent",
        cursor: uploading ? "default" : "pointer",
        transition: "border-color 0.15s, background 0.15s",
      }}
    >
      <div
        style={{
          width: 38,
          height: 38,
          borderRadius: 8,
          background: hovered ? "rgba(99,102,241,0.12)" : "#161616",
          border: `1px solid ${hovered ? "rgba(99,102,241,0.25)" : "#222"}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          transition: "background 0.15s",
        }}
      >
        {uploading
          ? <Loader2 style={{ width: 16, height: 16, color: "#818cf8", animation: "spin 1s linear infinite" }} />
          : <Upload style={{ width: 16, height: 16, color: hovered ? "#818cf8" : "#62626b", transition: "color 0.15s" }} />
        }
      </div>
      <div>
        <p style={{ fontSize: 13.5, fontWeight: 600, color: "#f5f5f7", margin: 0 }}>
          {uploading ? "Wird hochgeladen…" : "Zeugnis hochladen"}
        </p>
        <p style={{ fontSize: 12.5, color: "#9a9aa3", margin: "2px 0 0" }}>
          PDF, Word, Bild — max. 10 MB
        </p>
      </div>
    </div>
  );
}
