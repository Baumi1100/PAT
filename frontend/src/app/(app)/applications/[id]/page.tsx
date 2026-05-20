// frontend/src/app/(app)/applications/[id]/page.tsx
"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { applicationsApi, exportApi, downloadBlob } from "@/lib/api";
import type { Application } from "@/types/api";

export default function ApplicationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [app, setApp] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => {
    applicationsApi.get(id)
      .then((r) => setApp(r.data))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleDownload(
    type: "resume" | "cover_letter",
    format: "tex" | "pdf"
  ) {
    const key = `${type}.${format}`;
    setDownloading(key);
    try {
      const resp =
        type === "resume"
          ? format === "tex"
            ? await exportApi.resumeTex(id)
            : await exportApi.resumePdf(id)
          : format === "tex"
          ? await exportApi.coverLetterTex(id)
          : await exportApi.coverLetterPdf(id);
      downloadBlob(resp.data as Blob, `${type}_${id.slice(0, 8)}.${format}`);
    } catch {
      alert(`Download failed for ${key}`);
    } finally {
      setDownloading(null);
    }
  }

  if (loading) return <div className="text-muted-foreground">Loading...</div>;
  if (!app) return <div className="text-red-500">Application not found.</div>;

  const isComplete = app.status === "complete";

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Application Detail</h1>
        {app.match_score !== null && (
          <div className="text-4xl font-bold text-primary">{app.match_score}%</div>
        )}
      </div>

      <ProgressBar label="Match Score" value={app.match_score ?? 0} />

      {isComplete && (
        <div className="p-4 rounded-xl border border-border bg-card">
          <h2 className="font-semibold mb-3">Downloads</h2>
          <div className="flex flex-wrap gap-2">
            {(["resume", "cover_letter"] as const).map((docType) =>
              (["tex", "pdf"] as const).map((fmt) => {
                const key = `${docType}.${fmt}`;
                const label =
                  docType === "resume"
                    ? fmt === "tex" ? "Lebenslauf .tex" : "Lebenslauf .pdf"
                    : fmt === "tex" ? "Anschreiben .tex" : "Anschreiben .pdf";
                return (
                  <button
                    key={key}
                    onClick={() => handleDownload(docType, fmt)}
                    disabled={downloading === key}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
                      ${fmt === "pdf"
                        ? "bg-primary text-primary-foreground hover:bg-primary/90"
                        : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                      } disabled:opacity-50`}
                  >
                    {downloading === key ? "…" : label}
                  </button>
                );
              })
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            .tex = LaTeX-Quelltext (editierbar) · .pdf = direkt druckfertiges Dokument
          </p>
        </div>
      )}

      <Section title="Strengths" items={app.strengths} color="text-green-400" />
      <Section title="Weaknesses" items={app.weaknesses} color="text-red-400" />
      <Section title="Skill Gaps" items={app.skill_gaps} color="text-yellow-400" />
      <Section title="Suggestions" items={app.suggestions} color="text-blue-400" />

      {app.cover_letter && (
        <div className="p-6 rounded-xl border border-border bg-card">
          <h2 className="font-semibold mb-3">Cover Letter</h2>
          <pre className="whitespace-pre-wrap text-sm text-muted-foreground font-sans">{app.cover_letter}</pre>
        </div>
      )}

      {app.interview_questions && app.interview_questions.length > 0 && (
        <div className="p-6 rounded-xl border border-border bg-card">
          <h2 className="font-semibold mb-3">Interview Questions</h2>
          <ul className="space-y-2">
            {app.interview_questions.map((q, i) => (
              <li key={i} className="text-sm text-muted-foreground">• {q}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function Section({ title, items, color }: { title: string; items?: string[] | null; color: string }) {
  if (!items?.length) return null;
  return (
    <div className="p-4 rounded-xl border border-border bg-card">
      <h2 className={`font-semibold mb-2 ${color}`}>{title}</h2>
      <ul className="space-y-1">
        {items.map((item, i) => <li key={i} className="text-sm">• {item}</li>)}
      </ul>
    </div>
  );
}

function ProgressBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{value}%</span>
      </div>
      <div className="w-full h-3 rounded-full bg-secondary overflow-hidden">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}
