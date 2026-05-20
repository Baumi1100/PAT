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
    certificatesApi
      .list()
      .then((r) => setCerts(r.data))
      .finally(() => setLoading(false));
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
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Arbeitszeugnisse</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Lade deine Zeugnisse hoch — die KI extrahiert daraus Erfahrungen und Kompetenzen,
          die automatisch in Lebenslauf und Anschreiben einfließen.
        </p>
      </div>

      {/* Info banner */}
      <div className="flex gap-3 p-4 rounded-xl border border-blue-500/20 bg-blue-500/5 text-sm text-blue-300">
        <Info className="w-4 h-4 shrink-0 mt-0.5" />
        <p>
          Beim nächsten Analyse-Durchlauf werden die Zeugnisse automatisch berücksichtigt.
          Bestehende Bewerbungen müssen erneut analysiert werden.
        </p>
      </div>

      {/* Upload area */}
      <div
        onClick={() => inputRef.current?.click()}
        className="relative flex flex-col items-center justify-center gap-3 p-8 rounded-xl border-2 border-dashed border-border hover:border-primary/50 hover:bg-accent/20 transition-all cursor-pointer group"
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.docx,.txt,.png,.jpg,.jpeg,.webp"
          className="hidden"
          onChange={handleUpload}
        />
        {uploading ? (
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        ) : (
          <Upload className="w-8 h-8 text-muted-foreground group-hover:text-primary transition-colors" />
        )}
        <div className="text-center">
          <p className="text-sm font-medium">
            {uploading ? "Wird hochgeladen…" : "Zeugnis hochladen"}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">PDF, Word, Bild — max. 10 MB</p>
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2">
          {error}
        </p>
      )}

      {/* Certificate list */}
      {loading ? (
        <div className="space-y-2">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-16 rounded-xl border border-border bg-card animate-pulse" />
          ))}
        </div>
      ) : certs.length === 0 ? (
        <div className="p-10 rounded-xl border border-border bg-card text-center">
          <Award className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Noch keine Zeugnisse hochgeladen.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {certs.map((cert) => (
            <div
              key={cert.id}
              className="flex items-center gap-4 px-4 py-3.5 rounded-xl border border-border bg-card hover:bg-accent/20 transition-colors group"
            >
              <div className="p-2 rounded-lg bg-muted shrink-0">
                <FileText className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{cert.file_name ?? cert.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {cert.file_type?.toUpperCase() ?? "Dokument"} ·{" "}
                  {new Date(cert.created_at).toLocaleDateString("de-DE", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </div>
              <button
                onClick={() => handleDelete(cert.id)}
                disabled={deletingId === cert.id}
                className="p-1.5 rounded-lg text-muted-foreground/40 hover:text-red-400 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"
                title="Löschen"
              >
                {deletingId === cert.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
