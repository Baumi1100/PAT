"use client";
import { useEffect, useState, useRef } from "react";
import { Upload, FileText, Trash2, Star } from "lucide-react";
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
        <div>
          <h1 className="text-2xl font-bold">Resumes</h1>
          <p className="text-sm text-muted-foreground mt-1">Upload your CV for AI analysis</p>
        </div>
        <label className={`inline-flex items-center gap-2 cursor-pointer px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium transition-opacity ${uploading ? "opacity-50 pointer-events-none" : "hover:bg-primary/90"}`}>
          <Upload className="w-4 h-4" />
          {uploading ? "Uploading…" : "Upload Resume"}
          <input ref={fileRef} type="file" accept=".pdf,.doc,.docx" style={{ display: "none" }} onChange={handleUpload} />
        </label>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-16 rounded-xl border border-border bg-card animate-pulse" />
          ))}
        </div>
      ) : resumes.length === 0 ? (
        <div className="p-12 rounded-xl border border-dashed border-border bg-card text-center">
          <FileText className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">No resumes yet.</p>
          <p className="text-muted-foreground text-xs mt-1">Upload a PDF or Word document to get started.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          {resumes.map((r, i) => (
            <div
              key={r.id}
              className={`flex items-center gap-4 px-5 py-4 ${i < resumes.length - 1 ? "border-b border-border" : ""} ${i % 2 === 0 ? "" : "bg-muted/10"}`}
            >
              <div className="p-2 rounded-lg bg-muted shrink-0">
                <FileText className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium truncate">{r.title}</p>
                  {r.is_primary && (
                    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/20 font-medium shrink-0">
                      <Star className="w-2.5 h-2.5" />
                      Primary
                    </span>
                  )}
                </div>
                {r.file_name && r.file_name !== r.title && (
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">{r.file_name}</p>
                )}
              </div>
              <button
                onClick={() => handleDelete(r.id)}
                className="p-2 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer shrink-0"
                title="Delete resume"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
