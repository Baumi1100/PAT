// Mock data for the prototype. Realistic German job titles, companies, and notes.

window.STATUS_OPTS = [
  { key: "interessant", label: "Interessant", cls: "b-interessant" },
  { key: "beworben",    label: "Beworben",    cls: "b-beworben" },
  { key: "gespraech",   label: "Gespräch",    cls: "b-gespraech" },
  { key: "angebot",     label: "Angebot",     cls: "b-angebot" },
  { key: "abgelehnt",   label: "Abgelehnt",   cls: "b-abgelehnt" },
  { key: "archiviert",  label: "Archiviert",  cls: "b-archiviert" },
];

window.PRIO_OPTS = [
  { key: "hoch",    label: "Hoch",    cls: "prio-hoch" },
  { key: "mittel",  label: "Mittel",  cls: "prio-mittel" },
  { key: "niedrig", label: "Niedrig", cls: "prio-niedrig" },
];

window.MOCK_JOBS = [
  {
    id: "j-001",
    title: "Senior Frontend Engineer",
    company: "Lumen Mobility GmbH",
    location: "Berlin",
    remote: "Hybrid (2 Tage Büro)",
    platform: "LinkedIn",
    employment: "Vollzeit",
    seniority: "Senior",
    salary: "85.000 – 105.000 €",
    status: "gespraech",
    priority: "hoch",
    analysis: { state: "done", score: 87 },
    appliedAt: "2026-05-04",
    contact: "Anna Brückner",
    contactEmail: "anna.brueckner@lumen-mobility.de",
    url: "https://linkedin.com/jobs/4231",
    notes: "Erstes Gespräch mit Anna war sehr positiv. Tech-Stack passt (React, TS, Next). Zweites Gespräch am 22.05. mit Engineering Lead. Auf System-Design-Frage zu Echtzeit-Updates vorbereiten — sie nutzen wohl WebSockets + Redux Toolkit Query.",
    rawText: `Senior Frontend Engineer (m/w/d) — Lumen Mobility GmbH

Über uns
Wir bauen die Software-Plattform für die nächste Generation urbaner Mobilität. Mit über 40 Städten als Kunden in DACH verarbeitet unsere Plattform täglich Millionen von Bewegungsdaten in Echtzeit.

Deine Aufgaben
• Weiterentwicklung unseres Dashboards (React 18, Next.js 14, TypeScript)
• Architektur-Entscheidungen im Frontend-Team (5 Personen)
• Mentoring von Mid-Level Engineers
• Enge Zusammenarbeit mit Produkt & Design

Dein Profil
• 5+ Jahre Erfahrung mit React / TypeScript
• Sicher im Umgang mit Performance-Tooling
• Erfahrung mit Echtzeit-Daten (WebSockets, Server-Sent Events)
• Sehr gute Deutsch- und Englischkenntnisse

Wir bieten
• 85.000 – 105.000 € Jahresgehalt + virtuelle Anteile
• Hybrid: 2 Tage Büro Berlin-Mitte, 3 Tage Remote
• 30 Urlaubstage + flexible Arbeitszeiten`,
  },
  {
    id: "j-002",
    title: "Staff Product Designer",
    company: "Helio Health AG",
    location: "München",
    remote: "Full Remote",
    platform: "Otta",
    employment: "Vollzeit",
    seniority: "Staff / Lead",
    salary: "95.000 – 120.000 €",
    status: "beworben",
    priority: "hoch",
    analysis: { state: "done", score: 78 },
    appliedAt: "2026-05-11",
    contact: "—",
    contactEmail: "",
    url: "https://otta.com/jobs/helio-9281",
    notes: "Sehr starke Mission (digitale Patientenakten). Portfolio-Link & Case Study zur Onboarding-Redesign mitgeschickt.",
    rawText: "Job posting raw text not yet imported.",
  },
  {
    id: "j-003",
    title: "Backend Engineer (Go / Postgres)",
    company: "Fynra Payments",
    location: "Hamburg",
    remote: "Remote (DE)",
    platform: "Stepstone",
    employment: "Vollzeit",
    seniority: "Mid-Senior",
    salary: "70.000 – 90.000 €",
    status: "interessant",
    priority: "mittel",
    analysis: { state: "analyzing" },
    appliedAt: "",
    contact: "",
    contactEmail: "",
    url: "https://stepstone.de/stellenangebote--Fynra-44102",
    notes: "",
    rawText: "Job posting raw text not yet imported.",
  },
  {
    id: "j-004",
    title: "Engineering Manager — Platform",
    company: "Versant Logistics SE",
    location: "Köln",
    remote: "Hybrid (3 Tage Büro)",
    platform: "Firmen-Website",
    employment: "Vollzeit",
    seniority: "Manager",
    salary: "110.000 – 135.000 €",
    status: "angebot",
    priority: "hoch",
    analysis: { state: "done", score: 91 },
    appliedAt: "2026-04-18",
    contact: "Markus Heller",
    contactEmail: "markus.heller@versant.com",
    url: "https://versant.com/karriere/em-platform",
    notes: "Angebot ist da: 128k Basis + 12k Bonus. Vesting: 4y, 1y cliff. Verhandlung bis 26.05. — Gegenangebot Helio abwarten.",
    rawText: "Job posting raw text not yet imported.",
  },
  {
    id: "j-005",
    title: "Data Engineer — Analytics",
    company: "Nordstern Energie",
    location: "Leipzig",
    remote: "Hybrid (1 Tag Büro)",
    platform: "LinkedIn",
    employment: "Vollzeit",
    seniority: "Mid",
    salary: "65.000 – 80.000 €",
    status: "abgelehnt",
    priority: "niedrig",
    analysis: { state: "done", score: 42 },
    appliedAt: "2026-04-02",
    contact: "Recruiting-Team",
    contactEmail: "",
    url: "https://linkedin.com/jobs/4118",
    notes: "Absage nach erstem Gespräch — Schwerpunkt war zu sehr auf Snowflake / dbt, eigene Erfahrung dort ist begrenzt.",
    rawText: "Job posting raw text not yet imported.",
  },
  {
    id: "j-006",
    title: "Full-Stack Engineer",
    company: "Atelier Korben",
    location: "Berlin",
    remote: "Remote (EU)",
    platform: "WeWorkRemotely",
    employment: "Vollzeit",
    seniority: "Mid-Senior",
    salary: "75.000 – 90.000 €",
    status: "gespraech",
    priority: "mittel",
    analysis: { state: "done", score: 71 },
    appliedAt: "2026-05-07",
    contact: "Lena Vossberg",
    contactEmail: "lena@atelier-korben.studio",
    url: "https://weworkremotely.com/jobs/korben",
    notes: "Take-home (4h) erledigt — Feedback steht aus. Stack: Remix + Drizzle + Postgres.",
    rawText: "Job posting raw text not yet imported.",
  },
  {
    id: "j-007",
    title: "Principal Engineer (Infra)",
    company: "Quarz Cloud GmbH",
    location: "Karlsruhe",
    remote: "Full Remote",
    platform: "LinkedIn",
    employment: "Vollzeit",
    seniority: "Principal",
    salary: "120.000 – 150.000 €",
    status: "interessant",
    priority: "mittel",
    analysis: { state: "pending" },
    appliedAt: "",
    contact: "",
    contactEmail: "",
    url: "https://linkedin.com/jobs/4488",
    notes: "",
    rawText: "Job posting raw text not yet imported.",
  },
  {
    id: "j-008",
    title: "iOS Engineer",
    company: "Möbius Audio",
    location: "Berlin",
    remote: "Onsite",
    platform: "Firmen-Website",
    employment: "Vollzeit",
    seniority: "Mid",
    salary: "70.000 – 85.000 €",
    status: "beworben",
    priority: "niedrig",
    analysis: { state: "done", score: 56 },
    appliedAt: "2026-05-09",
    contact: "Sven Pohlmann",
    contactEmail: "sven@moebius-audio.de",
    url: "https://moebius-audio.de/jobs/ios",
    notes: "Onsite-only ist ein Dealbreaker — eher Backup.",
    rawText: "Job posting raw text not yet imported.",
  },
];

window.helpers = {
  fmtDate(iso) {
    if (!iso) return "";
    const [y, m, d] = iso.split("-");
    return `${d}.${m}.${y}`;
  },
  scoreClass(s) {
    if (s >= 75) return "score-high";
    if (s >= 50) return "score-mid";
    return "score-low";
  },
  getStatus(k) { return window.STATUS_OPTS.find(o => o.key === k) || window.STATUS_OPTS[0]; },
  getPrio(k)   { return window.PRIO_OPTS.find(o => o.key === k)   || window.PRIO_OPTS[1]; },
};
