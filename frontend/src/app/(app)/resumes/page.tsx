"use client";
import { useEffect, useState, useRef } from "react";
import { resumesApi } from "@/lib/api";
import type { Resume } from "@/types/api";

export default function ResumesPage() {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
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
      alert("Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function handleDelete(id: string) {
    await resumesApi.delete(id);
    setResumes((prev) => prev.filter((r) => r.id !== id));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Resumes</h1>
        <label className={`cursor-pointer px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium ${uploading ? "opacity-50 pointer-events-none" : ""}`}>
          {uploading ? "Uploading…" : "Upload Resume"}
          <input ref={fileRef} type="file" accept=".pdf,.doc,.docx" style={{ display: "none" }} onChange={handleUpload} />
        </label>
      </div>
      {loading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : resumes.length === 0 ? (
        <div className="p-8 rounded-xl border border-border bg-card text-center text-muted-foreground">
          No resumes yet. Upload a PDF or Word document to get started.
        </div>
      ) : (
        <div className="space-y-2">
          {resumes.map((r) => (
            <div key={r.id} className="p-4 rounded-lg border border-border bg-card flex items-center justify-between">
              <div className="flex items-center gap-3">
                <p className="font-medium">{r.title}</p>
                {r.is_primary && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary">Primary</span>
                )}
              </div>
              <button
                onClick={() => handleDelete(r.id)}
                className="text-xs text-red-400 hover:text-red-300 px-2 py-1 rounded hover:bg-red-500/10"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
