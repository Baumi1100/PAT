// Shared UI primitives: badges, inline-edit, popovers, buttons.

const { useState, useRef, useEffect, useLayoutEffect } = React;

window.StatusBadge = function StatusBadge({ value }) {
  const s = window.helpers.getStatus(value);
  return (
    <span className={`badge-pill ${s.cls}`}>
      <span className="dot"></span>
      {s.label}
    </span>
  );
};

window.PriorityCell = function PriorityCell({ value }) {
  const p = window.helpers.getPrio(value);
  const filled = value === "hoch";
  return (
    <span className={`prio ${p.cls}`}>
      <Icon name={filled ? "star" : "starOutline"} strokeWidth={filled ? 1 : 1.75} style={filled ? { fill: "currentColor" } : {}} />
      {p.label}
    </span>
  );
};

window.AnalysisCell = function AnalysisCell({ analysis }) {
  if (!analysis || analysis.state === "pending") {
    return <span className="score score-pending">Ausstehend</span>;
  }
  if (analysis.state === "analyzing") {
    return (
      <span className="score score-analyzing">
        <span className="spinner"></span>
        Analysiert…
      </span>
    );
  }
  const s = analysis.score;
  return <span className={`score ${window.helpers.scoreClass(s)}`}>{s}%</span>;
};

// ------- Inline edit -------

window.InlineText = function InlineText({ value, onChange, placeholder = "Klicken zum Bearbeiten", multiline = false }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef(null);

  useEffect(() => { setDraft(value); }, [value]);
  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      if (inputRef.current.select) inputRef.current.select();
    }
  }, [editing]);

  const confirm = () => { onChange(draft); setEditing(false); };
  const cancel  = () => { setDraft(value); setEditing(false); };

  if (editing) {
    if (multiline) {
      return (
        <div style={{ width: "100%" }}>
          <textarea
            ref={inputRef}
            className="textarea"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            style={{ minHeight: 120 }}
          />
          <div className="inline-edit-actions" style={{ marginTop: 8 }}>
            <button className="inline-edit-btn confirm" onClick={confirm} title="Speichern"><Icon name="check"/></button>
            <button className="inline-edit-btn cancel" onClick={cancel} title="Abbrechen"><Icon name="x"/></button>
          </div>
        </div>
      );
    }
    return (
      <div className="inline-edit">
        <input
          ref={inputRef}
          className="input"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") confirm(); if (e.key === "Escape") cancel(); }}
        />
        <div className="inline-edit-actions">
          <button className="inline-edit-btn confirm" onClick={confirm} title="Speichern"><Icon name="check"/></button>
          <button className="inline-edit-btn cancel" onClick={cancel} title="Abbrechen"><Icon name="x"/></button>
        </div>
      </div>
    );
  }

  if (multiline) {
    const empty = !value || !value.trim();
    return (
      <div className={`notes-display ${empty ? "empty-val" : ""}`} onClick={() => setEditing(true)}>
        {empty ? placeholder : value}
        <span className="pencil"><Icon name="pencil"/></span>
      </div>
    );
  }

  const empty = !value || !value.toString().trim();
  return (
    <span className={`inline-display ${empty ? "empty-val" : ""}`} onClick={() => setEditing(true)}>
      {empty ? placeholder : value}
      <span className="pencil"><Icon name="pencil"/></span>
    </span>
  );
};

// ------- Popover (status / prio picker) -------

window.Popover = function Popover({ open, onClose, anchorRef, children }) {
  const popRef = useRef(null);
  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => {
      if (popRef.current && popRef.current.contains(e.target)) return;
      if (anchorRef.current && anchorRef.current.contains(e.target)) return;
      onClose();
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  if (!open) return null;
  return (
    <div ref={popRef} className="status-popover" style={{ top: "calc(100% + 6px)", left: 0 }}>
      {children}
    </div>
  );
};

window.InlineStatus = function InlineStatus({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const anchor = useRef(null);
  return (
    <span style={{ position: "relative", display: "inline-block" }}>
      <span ref={anchor} className="inline-display" onClick={() => setOpen(o => !o)} style={{ padding: "3px 6px" }}>
        <StatusBadge value={value}/>
        <span className="pencil" style={{ opacity: open ? 1 : undefined }}><Icon name="pencil"/></span>
      </span>
      <Popover open={open} onClose={() => setOpen(false)} anchorRef={anchor}>
        {window.STATUS_OPTS.map(o => (
          <button
            key={o.key}
            className={`status-opt ${value === o.key ? "active" : ""}`}
            onClick={() => { onChange(o.key); setOpen(false); }}
          >
            <StatusBadge value={o.key}/>
            <span className="check"><Icon name="check"/></span>
          </button>
        ))}
      </Popover>
    </span>
  );
};

window.InlinePriority = function InlinePriority({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const anchor = useRef(null);
  return (
    <span style={{ position: "relative", display: "inline-block" }}>
      <span ref={anchor} className="inline-display" onClick={() => setOpen(o => !o)} style={{ padding: "3px 6px" }}>
        <PriorityCell value={value}/>
        <span className="pencil"><Icon name="pencil"/></span>
      </span>
      <Popover open={open} onClose={() => setOpen(false)} anchorRef={anchor}>
        {window.PRIO_OPTS.map(o => (
          <button
            key={o.key}
            className={`status-opt ${value === o.key ? "active" : ""}`}
            onClick={() => { onChange(o.key); setOpen(false); }}
          >
            <PriorityCell value={o.key}/>
            <span className="check"><Icon name="check"/></span>
          </button>
        ))}
      </Popover>
    </span>
  );
};
