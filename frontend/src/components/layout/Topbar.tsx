// frontend/src/components/layout/Topbar.tsx
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Search, Bell, HelpCircle, ChevronRight } from "lucide-react";
import { authApi } from "@/lib/api";

const ROUTE_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  jobs: "Jobs",
  resumes: "Lebensläufe",
  certificates: "Zeugnisse",
  applications: "Bewerbungen",
  settings: "Einstellungen",
};

interface Crumb { label: string; href: string; }

function useBreadcrumbs(): Crumb[] {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);
  const crumbs: Crumb[] = [];
  let path = "";
  for (const seg of segments) {
    path += `/${seg}`;
    const label = ROUTE_LABELS[seg] ?? (seg.length > 20 ? seg.slice(0, 10) + "…" : seg);
    crumbs.push({ label, href: path });
  }
  return crumbs;
}

function getInitials(name: string): string {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

interface IconBtnProps {
  icon: React.ElementType;
  title: string;
}
function IconBtn({ icon: Icon, title }: IconBtnProps) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      title={title}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: 32,
        height: 32,
        borderRadius: 8,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: hovered ? "#f5f5f7" : "#9a9aa3",
        background: hovered ? "#111111" : "transparent",
        border: `1px solid ${hovered ? "#222222" : "transparent"}`,
        cursor: "pointer",
        transition: "all 0.12s",
      }}
    >
      <Icon style={{ width: 15, height: 15 }} />
    </button>
  );
}

export function Topbar() {
  const crumbs = useBreadcrumbs();
  const [user, setUser] = useState<{ full_name: string } | null>(null);

  useEffect(() => {
    authApi.me().then((r) => setUser(r.data as { full_name: string })).catch(() => {});
  }, []);

  return (
    <div
      style={{
        height: 56,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 28px",
        gap: 16,
        borderBottom: "1px solid #222222",
        background: "rgba(10,10,10,0.85)",
        backdropFilter: "blur(8px)",
        flexShrink: 0,
        zIndex: 10,
      }}
    >
      {/* Breadcrumbs */}
      <nav
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          fontSize: 13.5,
          fontWeight: 500,
          color: "#9a9aa3",
        }}
      >
        {crumbs.map((crumb, i) => {
          const isLast = i === crumbs.length - 1;
          return (
            <span key={crumb.href} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {i > 0 && <ChevronRight style={{ width: 14, height: 14, color: "#62626b" }} />}
              {isLast ? (
                <span style={{ color: "#f5f5f7" }}>{crumb.label}</span>
              ) : (
                <Link
                  href={crumb.href}
                  style={{ color: "#9a9aa3", textDecoration: "none" }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = "#f5f5f7")}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = "#9a9aa3")}
                >
                  {crumb.label}
                </Link>
              )}
            </span>
          );
        })}
      </nav>

      {/* Right actions */}
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <IconBtn icon={Search} title="Suchen" />
        <IconBtn icon={Bell} title="Benachrichtigungen" />
        <IconBtn icon={HelpCircle} title="Hilfe" />

        {/* Divider */}
        <div style={{ width: 1, height: 18, background: "#222222", margin: "0 4px" }} />

        {/* Avatar */}
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
            cursor: "pointer",
          }}
        >
          {user ? getInitials(user.full_name) : ""}
        </div>
      </div>
    </div>
  );
}
