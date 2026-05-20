// frontend/src/app/(auth)/login/page.tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { authApi } from "@/lib/api";
import { tokenStorage } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const resp = await authApi.login(email, password);
      tokenStorage.set(resp.data.access_token, resp.data.refresh_token);
      router.push("/dashboard");
    } catch {
      setError("E-Mail oder Passwort ungültig.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#080808",
        padding: "0 16px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Subtle radial glow — position: absolute so it's scoped to this page */}
      <div
        style={{
          position: "absolute",
          top: "30%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 700,
          height: 500,
          borderRadius: "50%",
          background: "radial-gradient(ellipse, rgba(99,102,241,0.08) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <div style={{ width: "100%", maxWidth: 380, position: "relative" }}>
        {/* Logo + heading */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 44,
              height: 44,
              borderRadius: 12,
              background: "linear-gradient(135deg, #6366f1, #4f46e5)",
              marginBottom: 16,
              boxShadow: "0 0 0 1px rgba(99,102,241,0.35), 0 8px 24px -8px rgba(99,102,241,0.60)",
            }}
          >
            <span style={{ fontSize: 15, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em" }}>P</span>
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#f5f5f7", margin: "0 0 6px", letterSpacing: "-0.02em" }}>
            Willkommen zurück
          </h1>
          <p style={{ fontSize: 14, color: "#9a9aa3", margin: 0 }}>
            Melde dich bei deinem PAT-Konto an.
          </p>
        </div>

        {/* Card */}
        <div
          style={{
            background: "#0e0e0e",
            border: "1px solid #1e1e1e",
            borderRadius: 12,
            padding: "28px 28px 24px",
          }}
        >
          <form onSubmit={handleSubmit}>
            {/* Email */}
            <div style={{ marginBottom: 16 }}>
              <label
                style={{
                  display: "block",
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#9a9aa3",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  marginBottom: 7,
                }}
              >
                E-Mail
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
                placeholder="du@beispiel.de"
                required
                style={{
                  width: "100%",
                  padding: "10px 13px",
                  borderRadius: 8,
                  border: `1px solid ${emailFocused ? "rgba(99,102,241,0.50)" : "#222"}`,
                  background: emailFocused ? "rgba(99,102,241,0.04)" : "#111",
                  color: "#f5f5f7",
                  fontSize: 14,
                  outline: "none",
                  transition: "border-color 0.15s, background 0.15s",
                  boxSizing: "border-box",
                  boxShadow: emailFocused ? "0 0 0 3px rgba(99,102,241,0.10)" : "none",
                }}
              />
            </div>

            {/* Password */}
            <div style={{ marginBottom: 20 }}>
              <label
                style={{
                  display: "block",
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#9a9aa3",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  marginBottom: 7,
                }}
              >
                Passwort
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                  placeholder="••••••••"
                  required
                  style={{
                    width: "100%",
                    padding: "10px 40px 10px 13px",
                    borderRadius: 8,
                    border: `1px solid ${passwordFocused ? "rgba(99,102,241,0.50)" : "#222"}`,
                    background: passwordFocused ? "rgba(99,102,241,0.04)" : "#111",
                    color: "#f5f5f7",
                    fontSize: 14,
                    outline: "none",
                    transition: "border-color 0.15s, background 0.15s",
                    boxSizing: "border-box",
                    boxShadow: passwordFocused ? "0 0 0 3px rgba(99,102,241,0.10)" : "none",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  style={{
                    position: "absolute",
                    right: 10,
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    color: "#62626b",
                    cursor: "pointer",
                    padding: 4,
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  {showPassword
                    ? <EyeOff style={{ width: 15, height: 15 }} />
                    : <Eye style={{ width: 15, height: 15 }} />
                  }
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "10px 13px",
                  borderRadius: 8,
                  border: "1px solid rgba(239,68,68,0.25)",
                  background: "rgba(239,68,68,0.06)",
                  marginBottom: 16,
                }}
              >
                <span style={{ fontSize: 13, color: "#fca5a5" }}>{error}</span>
              </div>
            )}

            {/* Submit */}
            <SubmitButton loading={loading} />
          </form>
        </div>

        {/* Footer hint */}
        <p style={{ textAlign: "center", fontSize: 12.5, color: "#62626b", marginTop: 20 }}>
          PAT — Personal Application Tracker
        </p>
      </div>

      <style>{`
        input::placeholder { color: #3a3a3a; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

function SubmitButton({ loading }: { loading: boolean }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      type="submit"
      disabled={loading}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: "100%",
        padding: "11px 0",
        borderRadius: 8,
        border: "1px solid rgba(99,102,241,0.50)",
        background: hovered && !loading
          ? "rgba(99,102,241,0.95)"
          : "rgba(99,102,241,0.85)",
        color: "#fff",
        fontSize: 14,
        fontWeight: 600,
        cursor: loading ? "default" : "pointer",
        opacity: loading ? 0.7 : 1,
        transition: "background 0.15s, opacity 0.15s",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        letterSpacing: "-0.01em",
      }}
    >
      {loading && <Loader2 style={{ width: 15, height: 15, animation: "spin 1s linear infinite" }} />}
      {loading ? "Anmelden…" : "Anmelden"}
    </button>
  );
}
