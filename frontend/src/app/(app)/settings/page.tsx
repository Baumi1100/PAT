"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import { User, MessageCircle, CheckCircle2 } from "lucide-react";
import { authApi } from "@/lib/api";
import { tokenStorage } from "@/lib/auth";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface UserWithTelegram {
  id: string;
  email: string;
  full_name: string;
  is_active: boolean;
  telegram_chat_id: string | null;
  created_at: string;
}

export default function SettingsPage() {
  const [user, setUser] = useState<UserWithTelegram | null>(null);
  const [chatId, setChatId] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    authApi.me().then((r) => {
      const u = r.data as UserWithTelegram;
      setUser(u);
      setChatId(u.telegram_chat_id ?? "");
    }).catch(() => {});
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const token = tokenStorage.getAccess();
      const r = await axios.patch<UserWithTelegram>(
        `${BASE_URL}/api/v1/users/me`,
        { telegram_chat_id: chatId.trim() || null },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUser(r.data);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      alert("Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your account and integrations</p>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center gap-3">
          <User className="w-4 h-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold">Account</h2>
        </div>
        {user ? (
          <dl className="divide-y divide-border">
            {[
              { label: "Name", value: user.full_name },
              { label: "Email", value: user.email },
              { label: "Member since", value: new Date(user.created_at).toLocaleDateString("de-DE", { day: "2-digit", month: "long", year: "numeric" }) },
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

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center gap-3">
          <MessageCircle className="w-4 h-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold">Telegram</h2>
          {user?.telegram_chat_id && (
            <span className="ml-auto inline-flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Connected
            </span>
          )}
        </div>
        <div className="px-5 py-4 space-y-4">
          <p className="text-sm text-muted-foreground">
            Send <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">/myid</code> to your PAT Telegram bot to get your Chat ID, then enter it here.
          </p>
          <form onSubmit={handleSave} className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. 123456789"
              value={chatId}
              onChange={(e) => setChatId(e.target.value)}
              className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
            />
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors cursor-pointer"
            >
              {saved ? "Saved!" : saving ? "Saving…" : "Save"}
            </button>
          </form>
          {user?.telegram_chat_id && (
            <p className="text-xs text-muted-foreground">
              Linked to Chat ID: <span className="font-mono text-foreground">{user.telegram_chat_id}</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
