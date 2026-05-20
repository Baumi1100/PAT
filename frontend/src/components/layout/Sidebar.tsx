// frontend/src/components/layout/Sidebar.tsx
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Briefcase,
  FileText,
  ClipboardList,
  Award,
  Settings,
  LogOut,
} from "lucide-react";
import { tokenStorage } from "@/lib/auth";
import { useRouter } from "next/navigation";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/jobs", label: "Jobs", icon: Briefcase },
  { href: "/resumes", label: "Lebensläufe", icon: FileText },
  { href: "/certificates", label: "Zeugnisse", icon: Award },
  { href: "/applications", label: "Bewerbungen", icon: ClipboardList },
  { href: "/settings", label: "Einstellungen", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  function handleLogout() {
    tokenStorage.clear();
    router.push("/login");
  }

  return (
    <aside className="w-60 min-h-screen border-r border-border bg-card flex flex-col shrink-0">
      <div className="px-6 py-5 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-xs font-bold text-primary-foreground">PAT</span>
          </div>
          <div>
            <p className="text-sm font-semibold leading-none">PAT</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Application Tracker</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="px-3 py-4 border-t border-border">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          Abmelden
        </button>
      </div>
    </aside>
  );
}
