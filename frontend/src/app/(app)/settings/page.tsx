"use client";
import { useEffect, useState } from "react";
import axios from "axios";
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
      setTimeout(() => setSaved(false), 2000);
    } catch {
      alert("Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 max-w-lg">
      <h1 className="text-3xl font-bold">Settings</h1>

      <div className="p-6 rounded-xl border border-border bg-card space-y-4">
        <h2 className="text-lg font-semibold">Account</h2>
        {user ? (
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Name</dt>
              <dd>{user.full_name}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Email</dt>
              <dd>{user.email}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Member since</dt>
              <dd>{new Date(user.created_at).toLocaleDateString()}</dd>
            </div>
          </dl>
        ) : (
          <p className="text-muted-foreground text-sm">Loading...</p>
        )}
      </div>

      <div className="p-6 rounded-xl border border-border bg-card space-y-4">
        <h2 className="text-lg font-semibold">Telegram</h2>
        <p className="text-sm text-muted-foreground">
          Sende <code className="bg-muted px-1 rounded">/myid</code> an deinen Bot um deine Chat-ID zu erhalten, dann hier eintragen.
        </p>
        <form onSubmit={handleSave} className="flex gap-2">
          <input
            type="text"
            placeholder="z.B. 123456789"
            value={chatId}
            onChange={(e) => setChatId(e.target.value)}
            className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50"
          >
            {saved ? "Gespeichert ✓" : saving ? "Speichern…" : "Speichern"}
          </button>
        </form>
        {user?.telegram_chat_id && (
          <p className="text-xs text-green-400">✓ Verknüpft mit Chat-ID {user.telegram_chat_id}</p>
        )}
      </div>
    </div>
  );
}
