// Main app shell + router.

const { useState: useStateApp, useEffect: useEffectApp } = React;

function App() {
  const [jobs, setJobs] = useStateApp(window.MOCK_JOBS);
  const [route, setRoute] = useStateApp({ page: "jobs" }); // start on jobs

  const navigate = (r) => {
    setRoute(r);
    window.scrollTo({ top: 0 });
  };

  const updateJob = (id, patch) => {
    setJobs(prev => prev.map(j => j.id === id ? { ...j, ...patch } : j));
  };
  const deleteJob = (id) => {
    setJobs(prev => prev.filter(j => j.id !== id));
    if (route.page === "jobs-detail" && route.id === id) navigate({ page: "jobs" });
  };

  const currentJob = route.page === "jobs-detail" ? jobs.find(j => j.id === route.id) : null;

  // Breadcrumbs
  const crumbs = (() => {
    switch (route.page) {
      case "dashboard":     return [{ label: "Dashboard", here: true }];
      case "jobs":          return [{ label: "Jobs", here: true }];
      case "jobs-detail":   return [
        { label: "Jobs", onClick: () => navigate({ page: "jobs" }) },
        { label: currentJob?.title || "Job", here: true },
      ];
      case "lebenslaeufe":  return [{ label: "Lebensläufe", here: true }];
      case "zeugnisse":     return [{ label: "Zeugnisse", here: true }];
      case "bewerbungen":   return [{ label: "Bewerbungen", here: true }];
      case "einstellungen": return [{ label: "Einstellungen", here: true }];
      default:              return [{ label: "—", here: true }];
    }
  })();

  let body;
  switch (route.page) {
    case "jobs":
      body = (
        <JobsPage
          jobs={jobs}
          onOpenJob={(id) => navigate({ page: "jobs-detail", id })}
          onDeleteJob={deleteJob}
          onUpdateJob={updateJob}
        />
      );
      break;
    case "jobs-detail":
      body = currentJob
        ? <DetailPage job={currentJob} onBack={() => navigate({ page: "jobs" })} onUpdate={updateJob}/>
        : <NotFound onBack={() => navigate({ page: "jobs" })}/>;
      break;
    case "einstellungen":
      body = <SettingsPage/>;
      break;
    case "dashboard":
      body = <ComingSoon title="Dashboard" desc="Übersicht über deinen Bewerbungs-Funnel — kommt bald."/>;
      break;
    case "lebenslaeufe":
      body = <ComingSoon title="Lebensläufe" desc="Verwalte deine CV-Varianten und ATS-optimierten PDFs."/>;
      break;
    case "zeugnisse":
      body = <ComingSoon title="Zeugnisse" desc="Zeugnisse und Zertifikate zentral ablegen."/>;
      break;
    case "bewerbungen":
      body = <ComingSoon title="Bewerbungen" desc="Generierte Anschreiben und versandte Bewerbungen."/>;
      break;
    default:
      body = <NotFound onBack={() => navigate({ page: "jobs" })}/>;
  }

  return (
    <div className="app">
      <Sidebar route={route} onNavigate={navigate}/>
      <div className="main">
        <header className="topbar">
          <div className="crumb">
            {crumbs.map((c, i) => (
              <React.Fragment key={i}>
                {i > 0 && <Icon name="chevRight"/>}
                {c.onClick ? <a onClick={c.onClick}>{c.label}</a> : <span className={c.here ? "here" : ""}>{c.label}</span>}
              </React.Fragment>
            ))}
          </div>
          <div className="topbar-right">
            <button className="iconbtn" title="Suche"><Icon name="search"/></button>
            <button className="iconbtn" title="Benachrichtigungen"><Icon name="bell"/></button>
            <button className="iconbtn" title="Hilfe"><Icon name="help"/></button>
            <div style={{ width: 1, height: 18, background: "var(--border)", margin: "0 4px" }}></div>
            <div className="avatar" style={{ width: 28, height: 28, fontSize: 11.5 }}>JK</div>
          </div>
        </header>
        {body}
      </div>
    </div>
  );
}

function ComingSoon({ title, desc }) {
  return (
    <div className="content">
      <div className="page-head">
        <div>
          <h1>{title}</h1>
          <p className="sub">{desc}</p>
        </div>
      </div>
      <div className="card" style={{ padding: 0 }}>
        <div className="empty" style={{ padding: "96px 24px" }}>
          <div className="empty-icon"><Icon name="sparkles"/></div>
          <h3>Bereich in Arbeit</h3>
          <p>Diese Ansicht ist Teil des Designs, aber noch nicht implementiert.</p>
        </div>
      </div>
    </div>
  );
}

function NotFound({ onBack }) {
  return (
    <div className="content">
      <div className="empty" style={{ padding: "96px 24px" }}>
        <div className="empty-icon"><Icon name="briefcase"/></div>
        <h3>Job nicht gefunden</h3>
        <p>Diese Stelle existiert nicht mehr.</p>
        <button className="btn btn-primary" onClick={onBack} style={{ marginTop: 8 }}>Zurück zu Jobs</button>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App/>);
