// frontend/src/components/layout/Sidebar.tsx
"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Briefcase,
  FileText,
  Award,
  Send,
  Settings,
  ChevronDown,
} from "lucide-react";
import { tokenStorage } from "@/lib/auth";
import { authApi, jobsApi, resumesApi, applicationsApi } from "@/lib/api";

/* ── design tokens ─────────────────────────────────────────────────────────── */
const C = {
  bg: "#080808",
  card: "#111111",
  border: "#222222",
  text: "#f5f5f7",
  muted: "#9a9aa3",
  dim: "#62626b",
  primary: "#6366f1",
  primarySoft: "rgba(99,102,241,0.12)",
  primaryText: "#818cf8",
};

interface NavItemDef {
  href: string;
  label: string;
  icon: React.ElementType;
  countKey?: "jobs" | "resumes" | "applications";
}

const NAV_MAIN: NavItemDef[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/jobs", label: "Jobs", icon: Briefcase, countKey: "jobs" },
  { href: "/resumes", label: "Lebensläufe", icon: FileText, countKey: "resumes" },
  { href: "/certificates", label: "Zeugnisse", icon: Award },
  { href: "/applications", label: "Bewerbungen", icon: Send, countKey: "applications" },
];

const NAV_SYSTEM: NavItemDef[] = [
  { href: "/settings", label: "Einstellungen", icon: Settings },
];

interface UserInfo { full_name: string; email: string; }
type Counts = { jobs: number | null; resumes: number | null; applications: number | null };

function getInitials(name: string): string {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

function NavItem({
  href,
  label,
  icon: Icon,
  active,
  count,
}: {
  href: string;
  label: string;
  icon: React.ElementType;
  active: boolean;
  count?: number | null;
}) {
  const [hovered, setHovered] = useState(false);
  const highlighted = active || hovered;

  return (
    <Link
      href={href}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "7px 10px",
        borderRadius: 6,
        fontSize: 13.5,
        fontWeight: 500,
        textDecoration: "none",
        transition: "background 0.12s, color 0.12s",
        background: active ? C.primarySoft : hovered ? C.card : "transparent",
        color: highlighted ? C.primaryText : C.muted,
      }}
    >
      <Icon style={{ width: 15, height: 15, flexShrink: 0, color: highlighted ? C.primaryText : C.muted }} />
      <span style={{ flex: 1, color: highlighted ? C.primaryText : C.muted }}>{label}</span>
      {count != null && count > 0 && (
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            lineHeight: 1,
            padding: "2px 6px",
            borderRadius: 20,
            background: active ? "rgba(129,140,248,0.18)" : "rgba(148,163,184,0.10)",
            color: active ? C.primaryText : C.dim,
            letterSpacing: "0.01em",
          }}
        >
          {count}
        </span>
      )}
    </Link>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [counts, setCounts] = useState<Counts>({ jobs: null, resumes: null, applications: null });
  const [footerHovered, setFooterHovered] = useState(false);

  useEffect(() => {
    authApi.me().then((r) => setUser(r.data as UserInfo)).catch(() => {});
    // load counts in parallel
    jobsApi.list().then((r) => setCounts((c) => ({ ...c, jobs: r.data.length }))).catch(() => {});
    resumesApi.list().then((r) => setCounts((c) => ({ ...c, resumes: r.data.length }))).catch(() => {});
    applicationsApi.list().then((r) => setCounts((c) => ({ ...c, applications: r.data.length }))).catch(() => {});
  }, []);

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === href;
    return pathname === href || pathname.startsWith(href + "/");
  }

  function handleLogout() {
    tokenStorage.clear();
    router.push("/login");
  }

  return (
    <aside
      style={{
        width: 220,
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        background: C.bg,
        borderRight: `1px solid ${C.border}`,
        overflowY: "auto",
      }}
    >
      {/* ── Brand ──────────────────────────────────────────── */}
      <Link
        href="/dashboard"
        style={{ display: "flex", alignItems: "center", gap: 9, padding: "16px 16px 12px", textDecoration: "none" }}
      >
        <div
          style={{
            width: 26,
            height: 26,
            borderRadius: 7,
            background: "linear-gradient(135deg, #6366f1, #4f46e5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 800,
            fontSize: 12,
            color: "#fff",
            flexShrink: 0,
            boxShadow: "0 0 0 1px rgba(99,102,241,0.35), 0 4px 14px -6px rgba(99,102,241,0.7)",
          }}
        >
          P
        </div>
        <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.15 }}>
          <strong style={{ fontSize: 13.5, fontWeight: 700, letterSpacing: "-0.01em", color: C.text }}>PAT</strong>
          <span style={{ fontSize: 10.5, color: C.dim }}>Application Tracker</span>
        </div>
      </Link>

      {/* ── Overview ───────────────────────────────────────── */}
      <div style={{ padding: "6px 10px", marginTop: 6 }}>
        <div style={{ padding: "4px 10px", fontSize: 10.5, textTransform: "uppercase", letterSpacing: "0.08em", color: C.dim, fontWeight: 600 }}>
          Übersicht
        </div>
        <nav style={{ display: "flex", flexDirection: "column", gap: 1, marginTop: 2 }}>
          {NAV_MAIN.map(({ href, label, icon, countKey }) => (
            <NavItem
              key={href}
              href={href}
              label={label}
              icon={icon}
              active={isActive(href)}
              count={countKey ? counts[countKey] : undefined}
            />
          ))}
        </nav>
      </div>

      {/* ── System ─────────────────────────────────────────── */}
      <div style={{ padding: "6px 10px", marginTop: 6 }}>
        <div style={{ padding: "4px 10px", fontSize: 10.5, textTransform: "uppercase", letterSpacing: "0.08em", color: C.dim, fontWeight: 600 }}>
          System
        </div>
        <nav style={{ display: "flex", flexDirection: "column", gap: 1, marginTop: 2 }}>
          {NAV_SYSTEM.map(({ href, label, icon }) => (
            <NavItem key={href} href={href} label={label} icon={icon} active={isActive(href)} />
          ))}
        </nav>
      </div>

      {/* ── Footer ─────────────────────────────────────────── */}
      <div style={{ marginTop: "auto", borderTop: `1px solid ${C.border}`, padding: 10 }}>
        <button
          onClick={handleLogout}
          onMouseEnter={() => setFooterHovered(true)}
          onMouseLeave={() => setFooterHovered(false)}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            gap: 9,
            padding: "7px 8px",
            borderRadius: 7,
            cursor: "pointer",
            background: footerHovered ? C.card : "transparent",
            border: "none",
            transition: "background 0.12s",
            textAlign: "left",
          }}
        >
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #6366f1, #a855f7)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 11,
              fontWeight: 700,
              color: "#fff",
              flexShrink: 0,
              letterSpacing: "0.02em",
            }}
          >
            {user ? getInitials(user.full_name) : "…"}
          </div>
          <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.25, minWidth: 0, flex: 1 }}>
            <strong style={{ fontSize: 12.5, fontWeight: 600, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {user?.full_name ?? "Laden…"}
            </strong>
            <span style={{ fontSize: 11, color: C.dim, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {user?.email ?? ""}
            </span>
          </div>
          <ChevronDown style={{ width: 13, height: 13, color: C.dim, flexShrink: 0 }} />
        </button>
      </div>
    </aside>
  );
}
