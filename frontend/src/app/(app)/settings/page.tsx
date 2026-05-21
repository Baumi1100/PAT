"use client";
import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { User, MessageCircle, Sparkles, Check, Loader2, Zap } from "lucide-react";
import { authApi } from "@/lib/api";
import { tokenStorage } from "@/lib/auth";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

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

const cardStyle = {
  background: "#111111",
  border: "1px solid #222222",
  borderRadius: 12,
  overflow: "hidden",
  marginBottom: 18,
};

const cardHeadStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
  padding: "14px 18px",
  borderBottom: "1px solid #222222",
};

const kvStyle = {
  display: "grid",
  gridTemplateColumns: "140px 1fr",
  gap: 14,
  alignItems: "center",
  padding: "11px 0",
  borderBottom: "1px dashed #222222",
  fontSize: 13.5,
};

export default function SettingsPage() {
  const [user, setUser] = useState<FullUser | null>(null);

  // Telegram
  const [chatId, setChatId] = useState("");
  const [connected, setConnected] = useState(false);
  const [savingTelegram, setSavingTelegram] = useState(false);

  // Profile
  const [profileText, setProfileText] = useState("");
  const [profileDraft, setProfileDraft] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [savedProfile, setSavedProfile] = useState(false);
  const profileTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    authApi
      .me()
      .then((r) => {
        const u = r.data as FullUser;
        setUser(u);
        const id = u.telegram_chat_id ?? "";
        setChatId(id);
        setConnected(!!id);
        setProfileText(u.profile_text ?? "");
        setProfileDraft(u.profile_text ?? "");
      })
      .catch(() => {});
  }, []);

  async function handleSaveTelegram(e: React.FormEvent) {
    e.preventDefault();
    setSavingTelegram(true);
    try {
      const u = await patchMe({ telegram_chat_id: chatId.trim() || null });
      setUser(u);
      setConnected(!!chatId.trim());
    } catch {
      alert("Speichern fehlgeschlagen");
    } finally {
      setSavingTelegram(false);
    }
  }

  async function handleSaveProfile() {
    setSavingProfile(true);
    try {
      const u = await patchMe({ profile_text: profileDraft.trim() || null });
      setUser(u);
      setProfileText(profileDraft);
      setSavedProfile(true);
      if (profileTimer.current) clearTimeout(profileTimer.current);
      profileTimer.current = setTimeout(() => setSavedProfile(false), 2000);
    } catch {
      alert("Speichern fehlgeschlagen");
    } finally {
      setSavingProfile(false);
    }
  }

  function handleDiscard() {
    setProfileDraft(profileText);
  }

  const memberSince = user
    ? new Date(user.created_at).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" })
    : null;

  return (
    <div style={{ maxWidth: 820 }}>
      {/* Page header */}
      <div className="mb-7">
        <h1
          className="font-bold text-foreground"
          style={{ fontSize: 26, letterSpacing: "-0.02em", lineHeight: 1.2, marginBottom: 4 }}
        >
          Einstellungen
        </h1>
        <p className="text-muted-foreground" style={{ fontSize: 14 }}>
          Verwalte dein Konto, dein KI-Profil und Integrationen.
        </p>
      </div>

      {/* Konto */}
      <div style={cardStyle}>
        <div style={cardHeadStyle}>
          <div className="flex items-center gap-2 font-semibold text-foreground" style={{ fontSize: 14 }}>
            <User className="text-muted-foreground" style={{ width: 14, height: 14 }} />
            Konto
          </div>
          <span className="text-dim" style={{ fontSize: 11.5 }}>Schreibgeschützt</span>
        </div>
        <div style={{ padding: "8px 18px 18px" }}>
          {user ? (
            <div style={{ display: "flex", flexDirection: "column" }}>
              {[
                { label: "Name", value: user.full_name },
                {
                  label: "E-Mail",
                  value: user.email,
                  mono: true,
                },
                {
                  label: "Plan",
                  custom: (
                    <span
                      className="inline-flex items-center gap-[6px] px-[10px] py-[3px] rounded-full font-semibold"
                      style={{
                        fontSize: 12,
                        color: "#818cf8",
                        background: "rgba(99,102,241,0.12)",
                        border: "1px solid rgba(99,102,241,0.35)",
                      }}
                    >
                      <Zap style={{ width: 11, height: 11 }} />
                      Pro
                    </span>
                  ),
                },
                { label: "Mitglied seit", value: memberSince ?? "—", mono: true },
              ].map(({ label, value, mono, custom }, idx, arr) => (
                <div key={label} style={{ ...kvStyle, borderBottom: idx === arr.length - 1 ? "none" : "1px dashed #222222" }}>
                  <div className="text-muted-foreground" style={{ fontSize: 12.5, fontWeight: 500 }}>{label}</div>
                  {custom ?? (
                    <div
                      className={mono ? "font-mono" : ""}
                      style={{ fontSize: mono ? 13 : 13.5, fontWeight: 500, color: "#f5f5f7" }}
                    >
                      {value}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2 pt-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-4 rounded animate-pulse" style={{ background: "#141414", width: i === 0 ? "50%" : "70%" }} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Persönliches Profil */}
      <div style={cardStyle}>
        <div style={cardHeadStyle}>
          <div className="flex items-center gap-2 font-semibold text-foreground" style={{ fontSize: 14 }}>
            <Sparkles className="text-muted-foreground" style={{ width: 14, height: 14 }} />
            Persönliches Profil
          </div>
          <span className="font-mono text-dim" style={{ fontSize: 11.5 }}>
            {profileDraft.length.toLocaleString("de-DE")} Zeichen
          </span>
        </div>
        <div style={{ padding: "8px 18px 18px" }}>
          <p className="text-muted-foreground" style={{ fontSize: 13, lineHeight: 1.6, margin: "4px 0 12px" }}>
            Diese Beschreibung wird als Grundlage für KI-Analysen verwendet — sie ergibt den Match-Score
            und unterstützt das Schreiben von Bewerbungen. Beschreibe dich, was du suchst und was du nicht willst.
          </p>
          <textarea
            value={profileDraft}
            onChange={(e) => setProfileDraft(e.target.value)}
            placeholder="Wer bist du? Was suchst du? Was sind deine Skills?"
            className="w-full text-foreground outline-none resize-none"
            style={{
              background: "#0e0e0e",
              border: "1px solid #222222",
              borderRadius: 7,
              padding: "8px 11px",
              fontSize: 13.5,
              lineHeight: 1.65,
              minHeight: 220,
              transition: "border-color 0.12s",
              color: "#f5f5f7",
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "#6366f1")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "#222222")}
          />
          <div className="flex items-center justify-between mt-[14px]">
            <div style={{ fontSize: 12, color: "#62626b", lineHeight: 1.55 }}>
              Tipp: Auch Branchen-Tabus erwähnen — z.B.{" "}
              <code
                style={{
                  background: "#0e0e0e",
                  border: "1px solid #222222",
                  borderRadius: 4,
                  padding: "1px 5px",
                  fontFamily: "var(--font-mono), monospace",
                  fontSize: 11,
                  color: "#9a9aa3",
                }}
              >
                kein Ad-Tech
              </code>
              ,{" "}
              <code
                style={{
                  background: "#0e0e0e",
                  border: "1px solid #222222",
                  borderRadius: 4,
                  padding: "1px 5px",
                  fontFamily: "var(--font-mono), monospace",
                  fontSize: 11,
                  color: "#9a9aa3",
                }}
              >
                kein On-Call
              </code>
              .
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {savedProfile && (
                <span
                  className="inline-flex items-center gap-[5px]"
                  style={{ fontSize: 12.5, color: "#86efac" }}
                >
                  <Check style={{ width: 13, height: 13 }} />
                  Gespeichert
                </span>
              )}
              <button
                onClick={handleDiscard}
                className="inline-flex items-center gap-[7px] px-3 py-[7px] rounded-md text-[13px] font-semibold border border-border bg-card hover:bg-card-hover hover:border-border-strong transition-colors"
              >
                Verwerfen
              </button>
              <button
                onClick={handleSaveProfile}
                disabled={savingProfile}
                className="inline-flex items-center gap-[7px] px-3 py-[7px] rounded-md text-[13px] font-semibold text-white transition-colors disabled:opacity-60"
                style={{ background: "#6366f1" }}
                onMouseEnter={(e) => !savingProfile && ((e.currentTarget as HTMLButtonElement).style.background = "#5457e8")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "#6366f1")}
              >
                {savingProfile && <Loader2 style={{ width: 13, height: 13 }} className="animate-spin" />}
                Profil speichern
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Telegram */}
      <div style={{ ...cardStyle, marginBottom: 0 }}>
        <div style={cardHeadStyle}>
          <div className="flex items-center gap-2 font-semibold text-foreground" style={{ fontSize: 14 }}>
            <MessageCircle className="text-muted-foreground" style={{ width: 14, height: 14 }} />
            Telegram
          </div>
          {connected && (
            <span
              className="inline-flex items-center gap-[6px] font-semibold"
              style={{
                padding: "3px 9px",
                borderRadius: 999,
                fontSize: 11.5,
                background: "rgba(34,197,94,0.10)",
                border: "1px solid rgba(34,197,94,0.28)",
                color: "#86efac",
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "#22c55e",
                  boxShadow: "0 0 0 3px rgba(34,197,94,0.18)",
                }}
              />
              Verbunden
            </span>
          )}
        </div>
        <div style={{ padding: "8px 18px 18px" }}>
          <p className="text-muted-foreground" style={{ fontSize: 13, lineHeight: 1.6, margin: "4px 0 14px" }}>
            Sende neue Stellen aus dem Browser direkt an PAT — über unseren Telegram-Bot{" "}
            <code
              style={{
                background: "#0e0e0e",
                border: "1px solid #222222",
                borderRadius: 4,
                padding: "1px 6px",
                fontFamily: "var(--font-mono), monospace",
                fontSize: 12,
                color: "#9a9aa3",
              }}
            >
              @pat_tracker_bot
            </code>
            .
          </p>
          <label
            className="block font-semibold text-muted-foreground"
            style={{ fontSize: 12, marginBottom: 6, letterSpacing: "0.005em" }}
          >
            Chat-ID
          </label>
          <form onSubmit={handleSaveTelegram} className="flex gap-2">
            <input
              type="text"
              placeholder="z.B. 482910733"
              value={chatId}
              onChange={(e) => { setChatId(e.target.value); setConnected(false); }}
              className="font-mono text-foreground outline-none"
              style={{
                background: "#0e0e0e",
                border: "1px solid #222222",
                borderRadius: 7,
                padding: "8px 11px",
                fontSize: 13,
                maxWidth: 260,
                transition: "border-color 0.12s",
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#6366f1")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "#222222")}
            />
            <button
              type="submit"
              disabled={savingTelegram}
              className="inline-flex items-center gap-[7px] px-3 py-[7px] rounded-md text-[13px] font-semibold border border-border bg-card hover:bg-card-hover transition-colors disabled:opacity-60"
            >
              {savingTelegram && <Loader2 style={{ width: 13, height: 13 }} className="animate-spin" />}
              {connected ? "Trennen" : "Verbinden"}
            </button>
          </form>
          <p style={{ fontSize: 12, color: "#62626b", lineHeight: 1.55, marginTop: 8 }}>
            Schreibe{" "}
            <code
              style={{
                background: "#0e0e0e",
                border: "1px solid #222222",
                borderRadius: 4,
                padding: "1px 5px",
                fontFamily: "var(--font-mono), monospace",
                fontSize: 11,
                color: "#9a9aa3",
              }}
            >
              /start
            </code>{" "}
            an{" "}
            <code
              style={{
                background: "#0e0e0e",
                border: "1px solid #222222",
                borderRadius: 4,
                padding: "1px 5px",
                fontFamily: "var(--font-mono), monospace",
                fontSize: 11,
                color: "#9a9aa3",
              }}
            >
              @pat_tracker_bot
            </code>{" "}
            — der Bot antwortet mit deiner Chat-ID.
          </p>
        </div>
      </div>
    </div>
  );
}
