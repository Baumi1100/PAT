"use client";
import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { User, MessageCircle, CheckCircle2, FileText, Loader2 } from "lucide-react";
import { authApi } from "@/lib/api";
import { tokenStorage } from "@/lib/auth";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface FullUser {
  id: string;
  email: string;
  full_name: string;
  is_active: boolean;
  telegram_chat_id: string | null;
  profile_text: string | null;
  created_at: string;
}

async function patchMe(data: Record<string, unknown>) {
  const token = tokenStorage.getAccess();
  const r = await axios.patch<FullUser>(`${BASE_URL}/api/v1/users/me`, data, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return r.data;
}

export default function SettingsPage() {
  const [user, setUser] = useState<FullUser | null>(null);

  // Telegram
  const [chatId, setChatId] = useState("");
  const [savingTelegram, setSavingTelegram] = useState(false);
  const [savedTelegram, setSavedTelegram] = useState(false);

  // Profile
  const [profileText, setProfileText] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [savedProfile, setSavedProfile] = useState(false);
  const profileTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    authApi
      .me()
      .then((r) => {
        const u = r.data as FullUser;
        setUser(u);
        setChatId(u.telegram_chat_id ?? "");
        setProfileText(u.profile_text ?? "");
      })
      .catch(() => {});
  }, []);

  async function handleSaveTelegram(e: React.FormEvent) {
    e.preventDefault();
    setSavingTelegram(true);
    try {
      const u = await patchMe({ telegram_chat_id: chatId.trim() || null });
      setUser(u);
      setSavedTelegram(true);
      setTimeout(() => setSavedTelegram(false), 3000);
    } catch {
      alert("Speichern fehlgeschlagen");
    } finally {
      setSavingTelegram(false);
    }
  }

  async function handleSaveProfile() {
    setSavingProfile(true);
    try {
      const u = await patchMe({ profile_text: profileText.trim() || null });
      setUser(u);
      setSavedProfile(true);
      if (profileTimer.current) clearTimeout(profileTimer.current);
      profileTimer.current = setTimeout(() => setSavedProfile(false), 3000);
    } catch {
      alert("Speichern fehlgeschlagen");
    } finally {
      setSavingProfile(false);
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Einstellungen</h1>
        <p className="text-sm text-muted-foreground mt-1">Konto, Profil und Integrationen</p>
      </div>

      {/* Account */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center gap-3">
          <User className="w-4 h-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold">Konto</h2>
        </div>
        {user ? (
          <dl className="divide-y divide-border">
            {[
              { label: "Name", value: user.full_name },
              { label: "E-Mail", value: user.email },
              {
                label: "Mitglied seit",
                value: new Date(user.created_at).toLocaleDateString("de-DE", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                }),
              },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between px-5 py-3 text-sm">
                <dt className="text-muted-foreground">{label}</dt>
                <dd className="font-medium">{value}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <div className="px-5 py-4">
            <div className="h-4 w-48 rounded bg-muted animate-pulse" />
          </div>
        )}
      </div>

      {/* Personal Profile */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center gap-3">
          <FileText className="w-4 h-4 text-muted-foreground" />
          <div className="flex-1">
            <h2 className="text-sm font-semibold">Persönliches Profil</h2>
          </div>
          {savedProfile && (
            <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Gespeichert
            </span>
          )}
        </div>
        <div className="px-5 py-4 space-y-3">
          <p className="text-sm text-muted-foreground">
            Beschreibe dich und deine bisherige Tätigkeit in eigenen Worten — konkrete Projekte,
            Verantwortlichkeiten, Erfolge. Die KI verwendet ausschließlich diese Informationen
            als Basis für Lebenslauf und Anschreiben und erfindet nichts dazu.
          </p>
          <p className="text-xs text-muted-foreground/60">
            Tipp: Je konkreter du bist (z. B. „Ich habe als IT-Projektmanager ein
            Team von 5 Entwicklern geführt und ein ERP-Migrationsprojekt mit einem Budget von
            500k€ erfolgreich abgeschlossen"), desto besser die Ergebnisse.
          </p>
          <textarea
            value={profileText}
            onChange={(e) => setProfileText(e.target.value)}
            rows={12}
            placeholder="Beispiel:&#10;Ich bin IT-Projektmanager mit 8 Jahren Erfahrung im Bereich digitale Transformation...&#10;&#10;Meine wichtigsten Projekte:&#10;- Migration des ERP-Systems (SAP S/4HANA) bei Firma X, 500k€ Budget, 12 Monate, erfolgreich abgeschlossen&#10;- Aufbau eines agilen Delivery-Teams aus 8 Personen..."
            className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors resize-none font-mono leading-relaxed"
          />
          <div className="flex justify-end">
            <button
              onClick={handleSaveProfile}
              disabled={savingProfile}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {savingProfile && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {savingProfile ? "Speichert…" : "Profil speichern"}
            </button>
          </div>
        </div>
      </div>

      {/* Telegram */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center gap-3">
          <MessageCircle className="w-4 h-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold">Telegram</h2>
          {user?.telegram_chat_id && (
            <span className="ml-auto inline-flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Verbunden
            </span>
          )}
        </div>
        <div className="px-5 py-4 space-y-4">
          <p className="text-sm text-muted-foreground">
            Sende{" "}
            <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">/myid</code> an
            deinen PAT Telegram-Bot um deine Chat-ID zu erhalten.
          </p>
          <form onSubmit={handleSaveTelegram} className="flex gap-2">
            <input
              type="text"
              placeholder="z. B. 123456789"
              value={chatId}
              onChange={(e) => setChatId(e.target.value)}
              className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
            />
            <button
              type="submit"
              disabled={savingTelegram}
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {savedTelegram ? "Gespeichert!" : savingTelegram ? "Speichert…" : "Speichern"}
            </button>
          </form>
          {user?.telegram_chat_id && (
            <p className="text-xs text-muted-foreground">
              Chat-ID:{" "}
              <span className="font-mono text-foreground">{user.telegram_chat_id}</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
