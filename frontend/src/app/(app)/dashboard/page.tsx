// frontend/src/app/(app)/dashboard/page.tsx
"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Briefcase, Send, TrendingUp, ArrowRight, ChevronRight } from "lucide-react";
import { applicationsApi, jobsApi } from "@/lib/api";
import { ScoreBadge, StatusBadge } from "@/components/ui/badges";
import type { Application, Job } from "@/types/api";

export default function DashboardPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      jobsApi.list().then((r) => setJobs(r.data)),
      applicationsApi.list().then((r) => setApplications(r.data)),
    ])
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const jobsMap = Object.fromEntries(jobs.map((j) => [j.id, j]));

  const completedApps = applications.filter((a) => a.match_score != null);
  const avgScore =
    completedApps.length > 0
      ? Math.round(completedApps.reduce((s, a) => s + (a.match_score ?? 0), 0) / completedApps.length)
      : null;

  const recentJobs = [...jobs]
    .sort((a, b) => new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime())
    .slice(0, 6);

  return (
    <div style={{ maxWidth: 960 }}>
      {/* Page header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: "#f5f5f7", margin: 0, letterSpacing: "-0.02em" }}>
          Dashboard
        </h1>
        <p style={{ fontSize: 14, color: "#9a9aa3", marginTop: 4 }}>
          Dein Überblick über Bewerbungen, Jobs und KI-Analysen.
        </p>
      </div>

      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 32 }}>
        <StatCard
          icon={Briefcase}
          label="Jobs erfasst"
          value={loading ? "—" : String(jobs.length)}
          iconColor="#818cf8"
          iconBg="rgba(99,102,241,0.12)"
          href="/jobs"
        />
        <StatCard
          icon={Send}
          label="Bewerbungen"
          value={loading ? "—" : String(applications.length)}
          iconColor="#c4b5fd"
          iconBg="rgba(167,139,250,0.10)"
          href="/applications"
        />
        <StatCard
          icon={TrendingUp}
          label="Ø Match-Score"
          value={loading ? "—" : avgScore != null ? `${avgScore} %` : "—"}
          iconColor="#86efac"
          iconBg="rgba(34,197,94,0.10)"
          mono
        />
      </div>

      {/* Recent jobs */}
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <h2 style={{ fontSize: 14, fontWeight: 600, color: "#f5f5f7", margin: 0 }}>Zuletzt hinzugefügte Jobs</h2>
          <Link
            href="/jobs"
            style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12.5, color: "#818cf8", textDecoration: "none", fontWeight: 500 }}
          >
            Alle anzeigen <ArrowRight style={{ width: 13, height: 13 }} />
          </Link>
        </div>

        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {[...Array(4)].map((_, i) => (
              <div key={i} style={{ height: 52, borderRadius: 8, background: "#111111", border: "1px solid #1a1a1a" }} />
            ))}
          </div>
        ) : recentJobs.length === 0 ? (
          <EmptyState
            icon={Briefcase}
            title="Noch keine Jobs"
            description="Importiere deinen ersten Job über den Telegram-Bot oder die Jobs-Seite."
            action={{ label: "Job hinzufügen", href: "/jobs" }}
          />
        ) : (
          <div style={{ border: "1px solid #1e1e1e", borderRadius: 10, overflow: "hidden", background: "#0c0c0c" }}>
            {/* Table header */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 130px 110px 90px 32px",
                padding: "0 18px",
                height: 38,
                alignItems: "center",
                borderBottom: "1px solid #1e1e1e",
                background: "#0c0c0c",
              }}
            >
              {["POSITION", "STATUS", "PRIORITÄT", "ANALYSE", ""].map((h) => (
                <span key={h} style={{ fontSize: 11, fontWeight: 600, color: "#62626b", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  {h}
                </span>
              ))}
            </div>

            {recentJobs.map((job, i) => {
              const app = applications.find((a) => a.job_id === job.id);
              return (
                <JobRow key={job.id} job={job} app={app ?? null} last={i === recentJobs.length - 1} />
              );
            })}
          </div>
        )}
      </div>

      {/* Recent applications section */}
      {applications.length > 0 && (
        <div style={{ marginTop: 32 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <h2 style={{ fontSize: 14, fontWeight: 600, color: "#f5f5f7", margin: 0 }}>Letzte Bewerbungen</h2>
            <Link
              href="/applications"
              style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12.5, color: "#818cf8", textDecoration: "none", fontWeight: 500 }}
            >
              Alle anzeigen <ArrowRight style={{ width: 13, height: 13 }} />
            </Link>
          </div>

          <div style={{ border: "1px solid #1e1e1e", borderRadius: 10, overflow: "hidden", background: "#0c0c0c" }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 160px 110px",
                padding: "0 18px",
                height: 38,
                alignItems: "center",
                borderBottom: "1px solid #1e1e1e",
                background: "#0c0c0c",
              }}
            >
              {["JOB", "UNTERNEHMEN", "ANALYSE"].map((h) => (
                <span key={h} style={{ fontSize: 11, fontWeight: 600, color: "#62626b", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  {h}
                </span>
              ))}
            </div>

            {applications.slice(0, 5).map((app, i) => {
              const job = jobsMap[app.job_id];
              return (
                <AppRow key={app.id} app={app} job={job ?? null} last={i === Math.min(applications.length, 5) - 1} />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Sub-components ──────────────────────────────────────────────────────── */

function StatCard({
  icon: Icon,
  label,
  value,
  iconColor,
  iconBg,
  href,
  mono,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  iconColor: string;
  iconBg: string;
  href?: string;
  mono?: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const inner = (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: "18px 20px",
        borderRadius: 10,
        border: `1px solid ${hovered && href ? "#2a2a2a" : "#1e1e1e"}`,
        background: hovered && href ? "#111111" : "#0c0c0c",
        transition: "border-color 0.12s, background 0.12s",
        display: "flex",
        alignItems: "center",
        gap: 16,
        cursor: href ? "pointer" : "default",
      }}
    >
      <div style={{ width: 38, height: 38, borderRadius: 9, background: iconBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icon style={{ width: 17, height: 17, color: iconColor }} />
      </div>
      <div>
        <p style={{ fontSize: 11.5, color: "#9a9aa3", fontWeight: 500, margin: 0, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</p>
        <p style={{ fontSize: 24, fontWeight: 700, color: "#f5f5f7", margin: "2px 0 0", fontFamily: mono ? "var(--font-mono)" : undefined, letterSpacing: mono ? "-0.02em" : "-0.03em" }}>
          {value}
        </p>
      </div>
      {href && (
        <ChevronRight style={{ width: 15, height: 15, color: hovered ? "#9a9aa3" : "#3a3a3a", marginLeft: "auto", transition: "color 0.12s" }} />
      )}
    </div>
  );
  if (href) return <Link href={href} style={{ textDecoration: "none" }}>{inner}</Link>;
  return inner;
}

function JobRow({ job, app, last }: { job: Job; app: Application | null; last: boolean }) {
  const [hovered, setHovered] = useState(false);
  return (
    <Link
      href={`/jobs/${job.id}`}
      style={{ textDecoration: "none" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 130px 110px 90px 32px",
          padding: "0 18px",
          height: 52,
          alignItems: "center",
          borderBottom: last ? "none" : "1px solid #1a1a1a",
          background: hovered ? "rgba(99,102,241,0.04)" : "transparent",
          transition: "background 0.1s",
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 13.5, fontWeight: 500, color: "#f5f5f7", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {job.title}
          </div>
          <div style={{ fontSize: 11.5, color: "#62626b", marginTop: 1 }}>{job.company ?? "—"}</div>
        </div>
        <div><StatusBadge value={job.status} /></div>
        <div style={{ fontSize: 13, color: "#9a9aa3", fontWeight: 500 }}>{job.priority ?? "—"}</div>
        <div>
          {app ? (
            <ScoreBadge
              status={app.status as "pending" | "analyzing" | "complete" | "error"}
              score={app.match_score}
            />
          ) : (
            <span style={{ fontSize: 12, color: "#62626b" }}>—</span>
          )}
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <ChevronRight style={{ width: 14, height: 14, color: hovered ? "#9a9aa3" : "#2a2a2a", transition: "color 0.1s" }} />
        </div>
      </div>
    </Link>
  );
}

function AppRow({ app, job, last }: { app: Application; job: Job | null; last: boolean }) {
  const [hovered, setHovered] = useState(false);
  return (
    <Link
      href={`/applications/${app.id}`}
      style={{ textDecoration: "none" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 160px 110px",
          padding: "0 18px",
          height: 52,
          alignItems: "center",
          borderBottom: last ? "none" : "1px solid #1a1a1a",
          background: hovered ? "rgba(99,102,241,0.04)" : "transparent",
          transition: "background 0.1s",
        }}
      >
        <div style={{ fontSize: 13.5, fontWeight: 500, color: "#f5f5f7", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {job?.title ?? "Job"}
        </div>
        <div style={{ fontSize: 13, color: "#9a9aa3", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {job?.company ?? "—"}
        </div>
        <div>
          <ScoreBadge
            status={app.status as "pending" | "analyzing" | "complete" | "error"}
            score={app.match_score}
          />
        </div>
      </div>
    </Link>
  );
}

function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  action?: { label: string; href: string };
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 10,
        padding: "48px 32px",
        border: "1px solid #1e1e1e",
        borderRadius: 10,
        background: "#0c0c0c",
        textAlign: "center",
      }}
    >
      <div style={{ width: 40, height: 40, borderRadius: 10, background: "#161616", border: "1px solid #222", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Icon style={{ width: 18, height: 18, color: "#62626b" }} />
      </div>
      <div>
        <p style={{ fontSize: 14, fontWeight: 600, color: "#f5f5f7", margin: 0 }}>{title}</p>
        <p style={{ fontSize: 13, color: "#9a9aa3", marginTop: 4 }}>{description}</p>
      </div>
      {action && (
        <Link
          href={action.href}
          style={{
            marginTop: 4,
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "7px 14px",
            borderRadius: 7,
            fontSize: 13,
            fontWeight: 600,
            background: "rgba(99,102,241,0.15)",
            color: "#818cf8",
            border: "1px solid rgba(99,102,241,0.25)",
            textDecoration: "none",
          }}
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}
