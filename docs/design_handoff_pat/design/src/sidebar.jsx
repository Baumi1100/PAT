// Left sidebar nav.

const NAV = [
  { key: "dashboard",    label: "Dashboard",      icon: "dashboard" },
  { key: "jobs",         label: "Jobs",           icon: "briefcase",  badge: "8" },
  { key: "lebenslaeufe", label: "Lebensläufe",    icon: "resume",     badge: "3" },
  { key: "zeugnisse",    label: "Zeugnisse",      icon: "certificate" },
  { key: "bewerbungen",  label: "Bewerbungen",    icon: "send",       badge: "5" },
];

const NAV_FOOTER = [
  { key: "einstellungen", label: "Einstellungen", icon: "settings" },
];

window.Sidebar = function Sidebar({ route, onNavigate }) {
  const activeKey = route.page === "jobs-detail" ? "jobs" : route.page;
  return (
    <aside className="sidebar">
      <div className="sb-brand" onClick={() => onNavigate({ page: "dashboard" })} style={{ cursor: "pointer" }}>
        <div className="sb-logo">P</div>
        <div className="sb-brand-text">
          <strong>PAT</strong>
          <span>Application Tracker</span>
        </div>
      </div>

      <div className="sb-section">
        <div className="sb-section-label">Übersicht</div>
        <nav className="sb-nav">
          {NAV.map(item => (
            <div
              key={item.key}
              className={`sb-item ${activeKey === item.key ? "active" : ""}`}
              onClick={() => onNavigate({ page: item.key })}
            >
              <Icon name={item.icon}/>
              <span>{item.label}</span>
              {item.badge && <span className="badge">{item.badge}</span>}
            </div>
          ))}
        </nav>
      </div>

      <div className="sb-section">
        <div className="sb-section-label">System</div>
        <nav className="sb-nav">
          {NAV_FOOTER.map(item => (
            <div
              key={item.key}
              className={`sb-item ${activeKey === item.key ? "active" : ""}`}
              onClick={() => onNavigate({ page: item.key })}
            >
              <Icon name={item.icon}/>
              <span>{item.label}</span>
            </div>
          ))}
        </nav>
      </div>

      <div className="sb-footer">
        <div className="sb-user">
          <div className="avatar">JK</div>
          <div className="sb-user-info">
            <strong>Jonas Köhler</strong>
            <span>jonas@kohler.dev</span>
          </div>
          <span className="chev"><Icon name="chevDown"/></span>
        </div>
      </div>
    </aside>
  );
};
