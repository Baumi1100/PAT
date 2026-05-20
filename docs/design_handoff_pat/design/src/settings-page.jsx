// Settings page — Konto, Persönliches Profil, Telegram.

const { useState: useStateSettings } = React;

const DEFAULT_PROFILE = `Ich bin Senior Frontend Engineer mit 7 Jahren Berufserfahrung, davon zuletzt 4 Jahre bei einem B2B-SaaS in Berlin (Mobility-Sektor). 

Mein Tech-Stack: React, TypeScript, Next.js, Node.js, Postgres. Ich habe größere Migrationen geleitet (Class-Components → Hooks, Webpack → Vite) und ein Frontend-Team von 3 Personen mentored.

Suche: Senior- bis Staff-Rolle bei einem Produkt-Unternehmen mit gesundem Engineering-Standard (Code Review, Tests, ruhige On-Call). Bevorzugt remote oder hybrid in Berlin. Erwartungsbereich 90k+.

Branchen-Interessen: Klimatech, B2B-Tools, öffentlicher Sektor. Lieber kein Ad-Tech, Crypto, Gambling.`;

window.SettingsPage = function SettingsPage() {
  const [profile, setProfile] = useStateSettings(DEFAULT_PROFILE);
  const [telegramId, setTelegramId] = useStateSettings("482910733");
  const [connected, setConnected] = useStateSettings(true);
  const [saved, setSaved] = useStateSettings(false);

  const save = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="content" style={{ maxWidth: 820 }}>
      <div className="page-head">
        <div>
          <h1>Einstellungen</h1>
          <p className="sub">Verwalte dein Konto, dein KI-Profil und Integrationen.</p>
        </div>
      </div>

      {/* Konto */}
      <div className="card" style={{ marginBottom: 18 }}>
        <div className="card-head">
          <div className="card-title"><Icon name="user"/> Konto</div>
          <span style={{ fontSize: 11.5, color: "var(--text-dim)" }}>Schreibgeschützt</span>
        </div>
        <div className="card-body">
          <div className="kv-list">
            <div className="kv">
              <div className="kv-key">Name</div>
              <div className="kv-val">Jonas Köhler</div>
            </div>
            <div className="kv">
              <div className="kv-key">E-Mail</div>
              <div className="kv-val mono" style={{ fontSize: 13 }}>jonas@kohler.dev</div>
            </div>
            <div className="kv">
              <div className="kv-key">Plan</div>
              <div className="kv-val">
                <span className="badge-pill" style={{ color: "var(--accent-2)", background: "var(--accent-soft)", borderColor: "var(--accent-border)" }}>
                  <Icon name="zap" size={11}/> Pro
                </span>
              </div>
            </div>
            <div className="kv">
              <div className="kv-key">Mitglied seit</div>
              <div className="kv-val mono" style={{ fontSize: 13, color: "var(--text-muted)" }}>14.02.2025</div>
            </div>
          </div>
        </div>
      </div>

      {/* Persönliches Profil */}
      <div className="card" style={{ marginBottom: 18 }}>
        <div className="card-head">
          <div className="card-title"><Icon name="sparkles"/> Persönliches Profil</div>
          <span style={{ fontSize: 11.5, color: "var(--text-dim)" }} className="mono">
            {profile.length.toLocaleString("de-DE")} Zeichen
          </span>
        </div>
        <div className="card-body">
          <p style={{ fontSize: 13, color: "var(--text-muted)", margin: "4px 0 12px", lineHeight: 1.6 }}>
            Diese Beschreibung wird als Grundlage für KI-Analysen verwendet — sie ergibt den Match-Score
            und unterstützt das Schreiben von Bewerbungen. Beschreibe dich, was du suchst und was du nicht willst.
          </p>
          <textarea
            className="textarea"
            value={profile}
            onChange={(e) => setProfile(e.target.value)}
            style={{ minHeight: 220, fontSize: 13.5, lineHeight: 1.65 }}
            placeholder="Wer bist du? Was suchst du? Was sind deine Skills?"
          />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 14 }}>
            <div className="help">
              Tipp: Auch Branchen-Tabus erwähnen — z.B. <code>kein Ad-Tech</code>, <code>kein On-Call</code>.
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              {saved && (
                <span style={{ color: "#86efac", fontSize: 12.5, display: "inline-flex", alignItems: "center", gap: 5 }}>
                  <Icon name="check" size={13}/> Gespeichert
                </span>
              )}
              <button className="btn">Verwerfen</button>
              <button className="btn btn-primary" onClick={save}>Profil speichern</button>
            </div>
          </div>
        </div>
      </div>

      {/* Telegram */}
      <div className="card">
        <div className="card-head">
          <div className="card-title"><Icon name="telegram"/> Telegram</div>
          {connected && (
            <span className="connected-badge">
              <span className="dot"></span>
              Verbunden
            </span>
          )}
        </div>
        <div className="card-body">
          <p style={{ fontSize: 13, color: "var(--text-muted)", margin: "4px 0 14px", lineHeight: 1.6 }}>
            Sende neue Stellen aus dem Browser direkt an PAT — über unseren Telegram-Bot
            {" "}<code style={{ background: "var(--bg-elev)", border: "1px solid var(--border)", borderRadius: 4, padding: "1px 6px", fontFamily: "JetBrains Mono, monospace", fontSize: 12, color: "var(--text-muted)" }}>@pat_tracker_bot</code>.
          </p>
          <label className="label">Chat-ID</label>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              className="input mono"
              value={telegramId}
              onChange={(e) => { setTelegramId(e.target.value); setConnected(false); }}
              placeholder="z.B. 482910733"
              style={{ maxWidth: 260, fontSize: 13 }}
            />
            <button className="btn">
              {connected ? "Trennen" : "Verbinden"}
            </button>
          </div>
          <div className="help">
            Schreibe <code>/start</code> an <code>@pat_tracker_bot</code> — der Bot antwortet mit deiner Chat-ID.
          </div>
        </div>
      </div>
    </div>
  );
};
