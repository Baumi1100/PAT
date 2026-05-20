// Job detail page — two-column tracking + details, plus collapsible raw text.

const { useState: useStateDetail } = React;

window.DetailPage = function DetailPage({ job, onBack, onUpdate }) {
  const [rawOpen, setRawOpen] = useStateDetail(false);
  const [analyzing, setAnalyzing] = useStateDetail(false);

  if (!job) return null;

  const patch = (k, v) => onUpdate(job.id, { [k]: v });

  const runAnalysis = () => {
    setAnalyzing(true);
    onUpdate(job.id, { analysis: { state: "analyzing" } });
    setTimeout(() => {
      const score = 60 + Math.floor(Math.random() * 35);
      onUpdate(job.id, { analysis: { state: "done", score } });
      setAnalyzing(false);
    }, 1800);
  };

  const a = job.analysis;
  const hasScore = a && a.state === "done";
  const isAnalyzing = a && a.state === "analyzing";

  return (
    <div className="content">
      {/* Header card */}
      <div className="detail-header">
        <div className="detail-header-left">
          <div className="detail-eyebrow">
            <span>Job</span>
            <span style={{ color: "var(--text-dim)" }}>·</span>
            <span className="platform-chip">{job.platform}</span>
          </div>
          <h1 className="detail-title">{job.title}</h1>
          <div className="detail-meta">
            <span className="item"><Icon name="building"/> {job.company}</span>
            <span className="item"><Icon name="map"/> {job.location}</span>
            <a href={job.url} target="_blank" rel="noopener">Stellenanzeige <Icon name="external"/></a>
          </div>
        </div>
        <div className="detail-actions">
          <button className="btn btn-ghost"><Icon name="copy"/></button>
          <button className="btn btn-danger btn-sm"><Icon name="trash"/> Löschen</button>
          <button
            className="btn btn-primary"
            onClick={runAnalysis}
            disabled={isAnalyzing}
          >
            <Icon name={isAnalyzing ? "sparkles" : "sparkles"}/>
            {isAnalyzing ? "Analysiert…" : (hasScore ? "Neu analysieren" : "Jetzt analysieren")}
          </button>
        </div>
      </div>

      {/* Two-column grid */}
      <div className="detail-grid">
        {/* Tracking card */}
        <div className="card">
          <div className="card-head">
            <div className="card-title"><Icon name="flag"/> Tracking</div>
            <span style={{ fontSize: 11.5, color: "var(--text-dim)" }} className="mono">
              {job.appliedAt ? `Aktualisiert ${window.helpers.fmtDate(job.appliedAt)}` : "Noch nicht beworben"}
            </span>
          </div>
          <div className="card-body">
            <div className="field">
              <div className="field-label"><Icon name="flag"/> Status</div>
              <div className="field-value">
                <InlineStatus value={job.status} onChange={(v) => patch("status", v)}/>
              </div>
            </div>
            <div className="field">
              <div className="field-label"><Icon name="star"/> Priorität</div>
              <div className="field-value">
                <InlinePriority value={job.priority} onChange={(v) => patch("priority", v)}/>
              </div>
            </div>
            <div className="field">
              <div className="field-label"><Icon name="calendar"/> Bewerbungsdatum</div>
              <div className="field-value">
                <InlineText
                  value={job.appliedAt ? window.helpers.fmtDate(job.appliedAt) : ""}
                  onChange={(v) => {
                    // accept DD.MM.YYYY → ISO
                    const m = v.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
                    if (m) patch("appliedAt", `${m[3]}-${m[2]}-${m[1]}`);
                    else patch("appliedAt", v ? job.appliedAt : "");
                  }}
                  placeholder="TT.MM.JJJJ"
                />
              </div>
            </div>
            <div className="field">
              <div className="field-label"><Icon name="user"/> Kontaktperson</div>
              <div className="field-value">
                <InlineText
                  value={job.contact}
                  onChange={(v) => patch("contact", v)}
                  placeholder="Name hinzufügen"
                />
              </div>
            </div>
            <div className="field" style={{ gridTemplateColumns: "140px 1fr", alignItems: "start" }}>
              <div className="field-label" style={{ paddingTop: 10 }}><Icon name="note"/> Notizen</div>
              <div className="field-value" style={{ display: "block" }}>
                <InlineText
                  value={job.notes}
                  onChange={(v) => patch("notes", v)}
                  placeholder="Eigene Notizen hinzufügen — Gespräche, Eindrücke, To-dos…"
                  multiline
                />
              </div>
            </div>
          </div>
        </div>

        {/* Details card */}
        <div>
          <div className="card">
            <div className="card-head">
              <div className="card-title"><Icon name="briefcase"/> Stellendetails</div>
              <span style={{ fontSize: 11.5, color: "var(--text-dim)" }}>Schreibgeschützt</span>
            </div>
            <div className="card-body">
              <div className="kv-list">
                <div className="kv">
                  <div className="kv-key"><Icon name="globe"/> Plattform</div>
                  <div className="kv-val">{job.platform}</div>
                </div>
                <div className="kv">
                  <div className="kv-key"><Icon name="euro"/> Gehalt</div>
                  <div className="kv-val mono">{job.salary}</div>
                </div>
                <div className="kv">
                  <div className="kv-key"><Icon name="home"/> Remote</div>
                  <div className="kv-val">{job.remote}</div>
                </div>
                <div className="kv">
                  <div className="kv-key"><Icon name="briefcase"/> Anstellungsart</div>
                  <div className="kv-val">{job.employment}</div>
                </div>
                <div className="kv">
                  <div className="kv-key"><Icon name="shield"/> Seniority</div>
                  <div className="kv-val">{job.seniority}</div>
                </div>
              </div>

              {(hasScore || isAnalyzing) && (
                <div className="match-block">
                  {hasScore ? (
                    <>
                      <div className="match-circle" style={{ "--p": a.score, background: `conic-gradient(${a.score >= 75 ? "#22c55e" : a.score >= 50 ? "#eab308" : "#ef4444"} ${a.score}%, rgba(255,255,255,0.06) 0)` }}>
                        <span style={{ color: a.score >= 75 ? "#86efac" : a.score >= 50 ? "#fcd34d" : "#fca5a5" }}>{a.score}%</span>
                      </div>
                      <div className="match-info">
                        <h4>KI-Match: {a.score >= 75 ? "Sehr gute Übereinstimmung" : a.score >= 50 ? "Solider Match" : "Geringe Übereinstimmung"}</h4>
                        <p>Basierend auf deinem persönlichen Profil und den Anforderungen der Stelle. {hasScore && a.score < 75 ? "Schwachstellen: Begrenzte Erfahrung mit erwähnten Spezial-Tools." : "Die wichtigsten Anforderungen werden abgedeckt."}</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="match-circle" style={{ background: "conic-gradient(#6366f1 30%, rgba(255,255,255,0.06) 0)", animation: "spin 1.6s linear infinite" }}>
                        <span style={{ color: "var(--accent-2)" }}>…</span>
                      </div>
                      <div className="match-info">
                        <h4>Analyse läuft</h4>
                        <p>Stellenanzeige wird mit deinem persönlichen Profil abgeglichen…</p>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Raw text collapsible */}
      <div className={`collapse ${rawOpen ? "open" : ""}`}>
        <div className="collapse-head" onClick={() => setRawOpen(o => !o)}>
          <h3><Icon name="note"/> Rohtext der Stellenanzeige</h3>
          <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 11.5, color: "var(--text-dim)" }} className="mono">
              {job.rawText ? `${job.rawText.length.toLocaleString("de-DE")} Zeichen` : "Nicht importiert"}
            </span>
            <span className="chev"><Icon name="chevDown"/></span>
          </span>
        </div>
        {rawOpen && (
          <div className="collapse-body">
            <div className="raw">{job.rawText || "Noch nicht importiert."}</div>
          </div>
        )}
      </div>
    </div>
  );
};
