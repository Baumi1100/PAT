// Jobs list page — table of applications.

const { useState: useStateJobs, useMemo } = React;

window.JobsPage = function JobsPage({ jobs, onOpenJob, onDeleteJob, onUpdateJob }) {
  const [query, setQuery] = useStateJobs("");
  const [filter, setFilter] = useStateJobs("alle");

  const counts = useMemo(() => {
    const c = { alle: jobs.length };
    for (const s of window.STATUS_OPTS) c[s.key] = jobs.filter(j => j.status === s.key).length;
    return c;
  }, [jobs]);

  const filtered = jobs.filter(j => {
    if (filter !== "alle" && j.status !== filter) return false;
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (j.title + " " + j.company + " " + j.location).toLowerCase().includes(q);
  });

  return (
    <div className="content">
      <div className="page-head">
        <div>
          <h1>Jobs <span className="count mono">{jobs.length}</span></h1>
          <p className="sub">Alle erfassten Stellen — verfolge Status, Priorität und KI-Match.</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn"><Icon name="upload"/> Importieren</button>
          <button className="btn btn-primary"><Icon name="plus"/> Job hinzufügen</button>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, gap: 12, flexWrap: "wrap" }}>
        <div className="seg">
          <button className={filter === "alle" ? "on" : ""} onClick={() => setFilter("alle")}>Alle <span className="count">{counts.alle}</span></button>
          {window.STATUS_OPTS.filter(s => s.key !== "archiviert").map(s => (
            <button key={s.key} className={filter === s.key ? "on" : ""} onClick={() => setFilter(s.key)}>
              {s.label} <span className="count">{counts[s.key]}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="table-wrap">
        <div className="tb-toolbar">
          <div className="search">
            <Icon name="search"/>
            <input
              placeholder="Suchen nach Titel, Firma, Ort…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <kbd>⌘K</kbd>
          </div>
          <button className="btn btn-sm"><Icon name="filter"/> Filter</button>
          <button className="btn btn-sm"><Icon name="more"/></button>
        </div>

        {filtered.length === 0 ? (
          <div className="empty">
            <div className="empty-icon"><Icon name="briefcase"/></div>
            <h3>Keine Jobs gefunden</h3>
            <p>Passe deine Filter an oder füge eine neue Stelle hinzu.</p>
          </div>
        ) : (
          <table className="tb">
            <thead>
              <tr>
                <th style={{ width: "42%" }}>Position</th>
                <th style={{ width: "14%" }}>Status</th>
                <th style={{ width: "12%" }}>Priorität</th>
                <th style={{ width: "12%" }}>Analyse</th>
                <th style={{ width: "12%" }}>Beworben</th>
                <th style={{ width: "8%", textAlign: "right" }}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(j => (
                <tr key={j.id}>
                  <td>
                    <div className="cell-pos">
                      <span className="title" onClick={() => onOpenJob(j.id)}>{j.title}</span>
                      <span className="meta">
                        <span><Icon name="building"/> {j.company}</span>
                        <span className="dot-sep"></span>
                        <span><Icon name="map"/> {j.location}</span>
                        <span className="dot-sep"></span>
                        <span style={{ color: "var(--text-dim)" }} className="mono">{j.platform}</span>
                      </span>
                    </div>
                  </td>
                  <td><StatusBadge value={j.status}/></td>
                  <td><PriorityCell value={j.priority}/></td>
                  <td><AnalysisCell analysis={j.analysis}/></td>
                  <td className="mono" style={{ color: "var(--text-muted)", fontSize: 12.5 }}>
                    {j.appliedAt ? window.helpers.fmtDate(j.appliedAt) : <span style={{ color: "var(--text-dim)" }}>—</span>}
                  </td>
                  <td>
                    <div className="row-actions">
                      <button
                        className="iconbtn"
                        title="Öffnen"
                        onClick={() => onOpenJob(j.id)}
                      ><Icon name="arrowRight"/></button>
                      <button
                        className="iconbtn"
                        title="Stellenanzeige öffnen"
                        onClick={() => window.open(j.url, "_blank")}
                      ><Icon name="external"/></button>
                      <button
                        className="iconbtn"
                        title="Löschen"
                        style={{ color: "#fca5a5" }}
                        onClick={() => {
                          if (confirm(`„${j.title}" wirklich löschen?`)) onDeleteJob(j.id);
                        }}
                      ><Icon name="trash"/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
