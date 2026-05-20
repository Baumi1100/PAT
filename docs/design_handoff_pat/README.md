# Handoff: PAT — Personal Application Tracker

## Overview

PAT ist eine SaaS-Webanwendung zur Verwaltung eigener Stellenbewerbungen — auf Deutsch, im Dark-Theme, optisch an Linear/Vercel angelehnt.

Das Paket enthält drei vollständig gestaltete Seiten plus die globale App-Shell:

1. **Jobs-Liste** — Tabelle aller erfassten Stellen mit Status, Priorität, KI-Match-Score
2. **Job-Detail** — Zwei-Spalten-Ansicht (Tracking-Daten links inline-editierbar, Stellendetails rechts schreibgeschützt) + ausklappbarer Rohtext
3. **Einstellungen** — Konto-Info, persönliches KI-Profil, Telegram-Integration

Dazu eine **Sidebar-Navigation** mit Dashboard / Jobs / Lebensläufe / Zeugnisse / Bewerbungen / Einstellungen sowie eine **Topbar** mit Breadcrumbs.

---

## About the Design Files

Die Dateien in diesem Bundle sind **Design-Referenzen, umgesetzt in HTML/CSS/JSX-via-Babel**. Sie sind ein klickbarer Prototyp, der das gewünschte Aussehen und Verhalten zeigt — **nicht** Produktions-Code zum 1:1-Kopieren.

**Deine Aufgabe:** Setze diese Designs im Ziel-Stack (Next.js 15 + Tailwind + shadcn/ui) mit dessen etablierten Patterns um. Nutze:

- **shadcn/ui-Komponenten** wo immer möglich (Table, Badge, Button, Input, Textarea, Card, Popover, Collapsible, DropdownMenu, Avatar, Tooltip, Toast)
- **Tailwind** für Styling — die exakten Hex-Werte unten als CSS-Variablen in `globals.css` / `tailwind.config.ts` hinterlegen
- **App Router** + Server Components wo sinnvoll; Client Components für Inline-Edits, Popovers, lokale States
- Echte Datenhaltung (Postgres + Prisma/Drizzle, oder was im Projekt etabliert ist) statt der Mock-Arrays

Die HTML-Prototypen dienen als **Pixel-Referenz** — Farben, Spacing, Typo, Hover-States sollten 1:1 übernommen werden.

---

## Fidelity

**High-fidelity (hifi).** Alle Farben, Schriftgrößen, Spacings, Border-Radien und Interaktionen sind final. Der Prototyp ist pixel-genau umzusetzen.

---

## Tech Stack

| Bereich | Wahl |
|---|---|
| Framework | Next.js 15 (App Router) |
| Styling | Tailwind CSS |
| Komponenten | shadcn/ui |
| Icons | lucide-react (die Prototyp-Icons sind lucide-style nachgezeichnet) |
| Fonts | `Plus Jakarta Sans` (UI), `JetBrains Mono` (Zahlen, IDs, Codes) — via `next/font/google` |
| Sprache | Deutsch (alle UI-Strings) |

---

## Design Tokens

### Farben

```css
/* In tailwind.config.ts oder globals.css als CSS-Variablen */
--background:        #0a0a0a   /* App-Hintergrund */
--background-elev:   #0e0e0e   /* Input-Hintergrund */
--card:              #111111   /* Karten */
--card-2:            #141414   /* Hover-Karten, sekundäre Flächen */
--border:            #222222   /* Standard-Border */
--border-2:          #2a2a2a   /* Stärkere Border, Hover */
--foreground:        #f5f5f7   /* Primärer Text */
--muted-foreground:  #9a9aa3   /* Sekundärer Text */
--dim:               #62626b   /* Tertiärer Text, Platzhalter */

--primary:           #6366f1   /* Indigo — Akzent */
--primary-hover:     #5457e8
--primary-2:         #818cf8   /* Helleres Indigo (Text auf Indigo-Bg) */
--primary-soft:      rgba(99,102,241,0.12)   /* Active-Bg in Sidebar */
--primary-border:    rgba(99,102,241,0.35)

/* Status-Farben (für Badges) */
--green:  #22c55e   /* Angebot, Erfolg, Score ≥75 */
--yellow: #eab308   /* Gespräch, Warnung, Score ≥50 */
--red:    #ef4444   /* Abgelehnt, Fehler, Score <50 */
--cyan:   #38bdf8   /* Interessant */
--violet: #a78bfa   /* Beworben */
--slate:  #64748b   /* Archiviert */
```

### Typografie

| Element | Font | Size | Weight | Letter-Spacing | Line-Height |
|---|---|---|---|---|---|
| Page H1 | Plus Jakarta Sans | 26px | 700 | -0.02em | 1.2 |
| Detail-Titel | Plus Jakarta Sans | 22px | 700 | -0.02em | 1.25 |
| Card-Titel | Plus Jakarta Sans | 14px | 600 | -0.005em | 1.3 |
| Tabellen-Zeilen | Plus Jakarta Sans | 13.5px | 400/500 | -0.005em | 1.45 |
| Tabellen-Header | Plus Jakarta Sans | 11.5px | 600 | 0.06em UPPERCASE | 1.4 |
| Body / Beschreibung | Plus Jakarta Sans | 13px | 400 | 0 | 1.6 |
| Labels (Feld-Beschriftung) | Plus Jakarta Sans | 12.5px | 500/600 | 0 | 1.4 |
| Eyebrow (Detail) | Plus Jakarta Sans | 11.5px | 600 | 0.08em UPPERCASE | 1.3 |
| Badge | Plus Jakarta Sans | 12px | 600 | -0.003em | 1.4 |
| Mono (Zahlen, IDs, Datum, Gehalt, Score) | JetBrains Mono | 12–13px | 500/600 | tabular-nums | 1.4 |

### Spacing

Tailwind-Skala. Wichtigste Werte aus dem Prototyp:

- Card-Padding: `p-4 px-[18px]` (Header) / `p-[18px]` (Body)
- Page-Padding: `px-9 py-8`
- Content max-width: **1280px** (Jobs, Detail), **820px** (Einstellungen)
- Sidebar-Breite: **236px**
- Topbar-Höhe: **56px**
- Standard-Gap zwischen Cards: **20px**
- Gap in Detail-Grid (2-Spalten): **20px**

### Border Radius

| Element | Radius |
|---|---|
| Cards, Table-Wrapper | 12px |
| Buttons, Inputs, Badges (Pillen ausgenommen) | 7px |
| Kleine Icon-Buttons | 6–8px |
| Status-Badges (Pillen) | 999px (rounded-full) |
| Avatar | 50% (rund) |

### Shadows

- App nutzt **kaum Shadows** — Tiefenstaffelung über Border + Background-Lightness
- Popover/Dropdown: `0 18px 48px -16px rgba(0,0,0,0.6)`
- Sidebar-Logo: `0 0 0 1px rgba(99,102,241,0.35), 0 6px 18px -8px rgba(99,102,241,0.7)`

---

## App Shell

### Sidebar (`width: 236px`, `bg: #080808`, `border-right: 1px solid #222`)

Sticky auf voller Höhe (`h-screen sticky top-0`).

**Aufbau (top → bottom):**

1. **Brand-Block** (Padding `18px 20px 14px`)
   - 28×28 px Indigo-Logo (`linear-gradient(135deg, #6366f1, #4f46e5)`), Border-Radius 8, weißes „P" in 13px/800
   - Daneben: **PAT** (14px/700) + „Application Tracker" (11px, `--dim`)

2. **Section „Übersicht"** (Section-Label: 10.5px, uppercase, letter-spacing 0.08em, `--dim`)
   - Dashboard (icon: `layout-dashboard`)
   - Jobs (icon: `briefcase`, badge „8")
   - Lebensläufe (icon: `file-text`, badge „3")
   - Zeugnisse (icon: `award`)
   - Bewerbungen (icon: `send`, badge „5")

3. **Section „System"**
   - Einstellungen (icon: `settings`)

4. **Footer** (mt-auto, border-top)
   - Avatar (30×30, Indigo→Violet-Gradient, Initialen weiß 12px/700)
   - Name **Jonas Köhler** (13px/600) + E-Mail (11.5px, `--dim`)
   - Chevron-Down rechts

**Nav-Item-Styling:**
- Default: `padding: 8px 10px`, `border-radius: 7px`, color `--muted-foreground` (`#9a9aa3`), font-size 13.5px, weight 500
- Hover: `bg: --card (#111111)`, color `--foreground`
- **Active**: `bg: rgba(99,102,241,0.12)`, color `#818cf8`, Icon ebenfalls `#818cf8`
- Icon links: 15×15 px, gap 11px
- Badge rechts: 10.5px JetBrains Mono, `bg: --card`, `border: 1px solid --border`, padding `1px 6px`, radius 5

### Topbar (`height: 56px`, sticky)

- `padding: 0 28px`, `border-bottom: 1px solid #222`, `bg: rgba(10,10,10,0.85) + backdrop-blur(8px)`
- **Links**: Breadcrumb — Pfeile zwischen Segmenten, aktuelle Seite in `--foreground`, davor in `--muted-foreground` und klickbar
- **Rechts**: 3 Icon-Buttons (Search, Bell, Help) à 32×32, dann 1×18 px Divider, dann 28×28 Avatar

---

## Screen 1: Jobs-Liste

**Route:** `/jobs`

### Layout

```
┌─────────────────────────────────────────────────────┐
│ Page-Header: "Jobs <count>" + Sub + Action-Buttons  │
├─────────────────────────────────────────────────────┤
│ Filter-Segment (Alle / Interessant / Beworben / …)  │
├─────────────────────────────────────────────────────┤
│ ┌─ Card ────────────────────────────────────────┐   │
│ │ Toolbar: Search-Input + Filter-Btn + Menu-Btn │   │
│ ├───────────────────────────────────────────────┤   │
│ │ Table                                         │   │
│ │   Position | Status | Prio | Analyse | Datum  │   │
│ │   …                                           │   │
│ └───────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

### Page-Header
- H1 „**Jobs**" mit kleinem grauen `<span>` daneben für Anzahl (z.B. `8`, mono, 13px, `--dim`)
- Sub-Text: „Alle erfassten Stellen — verfolge Status, Priorität und KI-Match." (14px, `--muted-foreground`)
- Rechts: zwei Buttons
  - „Importieren" (secondary, mit `upload`-Icon)
  - „Job hinzufügen" (primary indigo, mit `plus`-Icon)

### Filter-Segment

Eine inline Segmented-Control (eine Karte mit mehreren Buttons):
- Card-Wrapper: `bg: #111`, `border: 1px solid #222`, `border-radius: 8px`, `padding: 3px`
- Buttons: `padding: 5px 11px`, font 12.5px/500
- Aktiv: `bg: #0e0e0e`, `inset shadow 0 0 0 1px #2a2a2a`, color `--foreground`
- Inaktiv: transparent, color `--muted-foreground`, Hover → `--foreground`
- Count-Suffix in Mono 10.5px, `--dim`
- Werte: `Alle`, `Interessant`, `Beworben`, `Gespräch`, `Angebot`, `Abgelehnt` (Archiviert ausgeblendet)

### Tabellen-Toolbar (innerhalb Card-Head)
- `padding: 12px 14px`, `border-bottom: 1px solid #222`
- Such-Input nimmt verfügbaren Platz, Placeholder „Suchen nach Titel, Firma, Ort…", rechts ein `<kbd>⌘K</kbd>` (Mono 10px)
- Daneben: `Filter`-Button (sm) + Kontextmenü-Button (`more`-Icon)

### Tabelle

**Spalten (Breite in %):**

| # | Header | Breite | Inhalt |
|---|---|---|---|
| 1 | Position | 42% | Title (14px/600, Hover → `--primary-2`) + Meta-Zeile (12.5px/`--muted-foreground`: `building` Icon + Firma · `map` Icon + Ort · Plattform in Mono `--dim`) |
| 2 | Status | 14% | `<StatusBadge>` |
| 3 | Priorität | 12% | `<PriorityBadge>` |
| 4 | Analyse | 12% | `<ScoreBadge>` |
| 5 | Beworben | 12% | Datum in Mono 12.5px `--muted-foreground`, oder `—` in `--dim` falls leer |
| 6 | — | 8% (right) | Row-Actions (nur on hover) |

**Tabellen-Verhalten:**
- Kein Zebra-Striping
- Headers: 11.5px/600 UPPERCASE letter-spacing 0.06em color `--dim`, `bg: #0c0c0c`, `padding: 10px 16px`, `border-bottom: 1px solid #222`
- Zeilen: `padding: 14px 16px`, `border-bottom: 1px solid #222`
- Row-Hover: `bg: rgba(99,102,241,0.04)`
- Row-Actions: `opacity: 0`, on row-hover → `opacity: 1`, transition 120ms
  - Icon-Buttons (32×32, radius 8): „Öffnen" (`arrow-right`), „Stellenanzeige öffnen" (`external-link`), „Löschen" (`trash`, color `#fca5a5`, Hover-Bg rotstichig)

### Empty State (wenn Filter nichts liefert)
- Zentriert in der Tabelle, padding 64px 16px
- 48×48 Icon-Container (`bg: #141414`, `border: 1px solid #222`, radius 12) mit `briefcase`-Icon (`--dim`)
- H3 „Keine Jobs gefunden" (14px/600, `--foreground`)
- P „Passe deine Filter an oder füge eine neue Stelle hinzu." (13px, `--muted-foreground`, max-width 320px, center)

---

## Screen 2: Job-Detail

**Route:** `/jobs/[id]`

### Layout

```
┌─────────────────────────────────────────────────────┐
│ Detail-Header-Card                                  │
│   ┌──────────────────────────────┬───────────────┐  │
│   │ Eyebrow "Job · LinkedIn"     │ [Copy] [Del]  │  │
│   │ H1 "Senior Frontend Engin…"  │ [Analyse]     │  │
│   │ Firma · Ort · external link  │               │  │
│   └──────────────────────────────┴───────────────┘  │
├─────────────────────────────────────────────────────┤
│ ┌─ Tracking ──────────┐ ┌─ Stellendetails ────────┐ │
│ │ Status (inline)     │ │ Plattform               │ │
│ │ Priorität (inline)  │ │ Gehalt (mono)           │ │
│ │ Bewerbungsdatum     │ │ Remote                  │ │
│ │ Kontaktperson       │ │ Anstellungsart          │ │
│ │ Notizen (textarea)  │ │ Seniority               │ │
│ │                     │ │ ┌─ Match-Block ──────┐  │ │
│ │                     │ │ │ ⊕  KI-Match-Info   │  │ │
│ │                     │ │ └────────────────────┘  │ │
│ └─────────────────────┘ └─────────────────────────┘ │
├─────────────────────────────────────────────────────┤
│ Collapsible: "Rohtext der Stellenanzeige"  v        │
└─────────────────────────────────────────────────────┘
```

Grid: `grid-cols-2 gap-5`.

### Detail-Header
- Card: `padding: 22px 24px`, `mb-5`
- Eyebrow (oben): `Job · <Plattform-Chip>` — Chip ist ein Mono-Tag (10.5px), `bg: #141414`, `border: 1px solid #222`, radius 5, `padding: 2px 8px`
- H1 Titel: 22px/700, tracking `-0.02em`
- Meta-Zeile darunter: `building` + Firma, `map` + Ort, „Stellenanzeige" (a-Tag, color `--primary-2`, mit `external-link`-Icon)
- Actions rechts (oben in Card, top-aligned):
  - Ghost-Icon-Button (Copy)
  - Danger-sm-Button „Löschen" (mit `trash`-Icon, text `#fca5a5`)
  - **Primary-Button „Jetzt analysieren"** mit `sparkles`-Icon → wechselt zu „Analysiert…" während Loading; danach „Neu analysieren"

### Card „Tracking" (linke Spalte)

- Card-Head: Icon `flag` + Titel **Tracking**; rechts kleines Mono-Hint („Aktualisiert 04.05.2026" oder „Noch nicht beworben"), 11.5px `--dim`
- Card-Body: 5 Felder, jeweils `grid-cols-[140px_1fr] gap-3.5`, vertikales Padding 13px, gestrichelter Bottom-Border zwischen Feldern (`border-bottom: 1px dashed #222`)
- Field-Label (links): 12.5px/500, `--muted-foreground`, mit kleinem Icon (12×12, `--dim`) davor
- Field-Value (rechts): siehe Inline-Edit-Pattern unten

**Felder:**

| Label | Icon | Editor |
|---|---|---|
| Status | `flag` | Popover mit allen 6 Status-Optionen (StatusBadge + Check-Häkchen rechts) |
| Priorität | `star` | Popover mit Hoch / Mittel / Niedrig (PriorityBadge) |
| Bewerbungsdatum | `calendar` | Text-Input, Format `TT.MM.JJJJ`, intern ISO |
| Kontaktperson | `user` | Text-Input, Placeholder „Name hinzufügen" |
| Notizen | `note` | Textarea (multiline), min-height 96px; Placeholder „Eigene Notizen hinzufügen — Gespräche, Eindrücke, To-dos…" |

### Card „Stellendetails" (rechte Spalte)

- Card-Head: Icon `briefcase` + Titel **Stellendetails**; rechts „Schreibgeschützt" (11.5px, `--dim`)
- Liste von Key-Value-Paaren in `grid-cols-[140px_1fr]`, Padding 11px vertikal, gestrichelter Bottom-Border
- Keys (12.5px/500 `--muted-foreground`) mit Icon-Präfix (12×12 `--dim`)
- Values (13.5px/500 `--foreground`); Gehalt in **JetBrains Mono**

**Felder:** Plattform (icon `globe`) · Gehalt (`euro`, mono) · Remote (`home`) · Anstellungsart (`briefcase`) · Seniority (`shield`)

### Match-Block (unter den KV-Paaren, nur wenn `analysis.state !== 'pending'`)

- `bg: linear-gradient(180deg, rgba(99,102,241,0.06), transparent)`
- `border: 1px solid rgba(99,102,241,0.2)`, radius 10
- `padding: 14px 16px`, flex layout, gap 14
- **Match-Circle**: 54×54, `conic-gradient(<color> <score>%, rgba(255,255,255,0.06) 0)` als Hintergrund — Score-Farbe nach Schwelle (grün/gelb/rot). Innerer Kreis-Ring per `::after` 5px Inset mit `bg: --card`. Mittig Score-Text in Mono 14px/700.
- Rechts: H4 (13.5px/600) + Beschreibung (12.5px, `--muted-foreground`, line-height 1.5)
- Während Analyse: Spinner-Animation, Text „Analyse läuft" / „Stellenanzeige wird mit deinem persönlichen Profil abgeglichen…"

### Collapsible „Rohtext der Stellenanzeige"

- Outer Card, `bg: #111`, `border: 1px solid #222`, radius 12
- **Head** (`padding: 14px 18px`, klickbar, Hover → `bg: #141414`):
  - Links: `note`-Icon + H3 „Rohtext der Stellenanzeige"
  - Rechts: Mono-Hint mit Zeichen-Count („3.420 Zeichen") + `chev-down`-Icon (rotiert um 180° wenn offen)
- **Body** (collapsed by default, animiertes Expand):
  - `border-top: 1px solid #222`, `padding: 0 18px 18px`
  - Code-Container innen: `bg: #080808`, `border: 1px solid #222`, radius 8, padding 14, font JetBrains Mono 12px, line-height 1.65, color `#bcbcc4`, `white-space: pre-wrap`, `max-height: 380px`, vertical scroll

---

## Screen 3: Einstellungen

**Route:** `/settings` — Content max-width **820px**, Cards untereinander mit `mb-[18px]`.

### Page-Header
- H1 „Einstellungen"
- Sub „Verwalte dein Konto, dein KI-Profil und Integrationen."

### Card 1: „Konto"
- Card-Head: Icon `user` + Titel + rechts „Schreibgeschützt" (11.5px `--dim`)
- KV-Liste (gleiches Pattern wie Stellendetails):
  - **Name** → „Jonas Köhler"
  - **E-Mail** → Mono 13px → „jonas@kohler.dev"
  - **Plan** → Badge-Pill mit `zap`-Icon, Indigo-styling („Pro")
  - **Mitglied seit** → Mono 13px `--muted-foreground` → „14.02.2025"

### Card 2: „Persönliches Profil"
- Card-Head: Icon `sparkles` + Titel + rechts Char-Count in Mono 11.5px `--dim`
- Body:
  - Einleitungstext (13px `--muted-foreground`, line-height 1.6): erklärt, dass das Profil als Grundlage für KI-Analysen dient
  - **Textarea** (min-height 220px, font 13.5px, line-height 1.65) — Placeholder „Wer bist du? Was suchst du? Was sind deine Skills?"
  - Footer-Zeile: links Hint-Text mit `<code>`-Beispielen („kein Ad-Tech", „kein On-Call"), rechts Buttons „Verwerfen" + Primary „Profil speichern"
  - Nach Speichern: 2s-Toast „✓ Gespeichert" (color `#86efac`) zwischen Hint und Buttons

### Card 3: „Telegram"
- Card-Head: Icon `telegram` (custom paper-plane) + Titel + rechts **Connected-Badge**:
  - `bg: rgba(34,197,94,0.10)`, `border: 1px solid rgba(34,197,94,0.28)`, color `#86efac`
  - 6×6 grüner Dot mit `box-shadow: 0 0 0 3px rgba(34,197,94,0.18)` als Halo
  - Text „Verbunden", 11.5px/600
- Body:
  - Erläuterungstext mit `@pat_tracker_bot` als inline `<code>` (`bg: --background-elev`, `border: 1px solid --border`, radius 4, padding `1px 6px`, font Mono 12px)
  - Label „Chat-ID"
  - Input (max-width 260, mono 13px) + Button „Trennen" / „Verbinden"
  - Hint unter Input: Anleitung mit `<code>/start</code>` und `<code>@pat_tracker_bot</code>`

---

## Komponenten-Detail

### StatusBadge

Sechs Varianten, alle gleicher Aufbau: `inline-flex`, `gap: 6px`, `padding: 3px 10px`, `rounded-full`, font 12px/600, `border: 1px solid <color-30%>`, davor 5×5 px Dot (`bg: currentColor`).

| Status | Text | Color | Background | Border |
|---|---|---|---|---|
| `interessant` | Interessant | `#7dd3fc` | `rgba(56,189,248,0.10)` | `rgba(56,189,248,0.28)` |
| `beworben` | Beworben | `#c4b5fd` | `rgba(167,139,250,0.10)` | `rgba(167,139,250,0.28)` |
| `gespraech` | Gespräch | `#fcd34d` | `rgba(234,179,8,0.10)` | `rgba(234,179,8,0.30)` |
| `angebot` | Angebot | `#86efac` | `rgba(34,197,94,0.10)` | `rgba(34,197,94,0.30)` |
| `abgelehnt` | Abgelehnt | `#fca5a5` | `rgba(239,68,68,0.10)` | `rgba(239,68,68,0.30)` |
| `archiviert` | Archiviert | `#94a3b8` | `rgba(148,163,184,0.08)` | `rgba(148,163,184,0.22)` |

### PriorityBadge

Inline-Flex mit `star`-Icon (13×13) + Label, font 12.5px/600.

| Priority | Color | Icon |
|---|---|---|
| `hoch` | `#fbbf24` | gefüllt (fill currentColor) |
| `mittel` | `#a3a3ad` | outline |
| `niedrig` | `#62626b` | outline |

### ScoreBadge / AnalysisBadge

Drei States:

1. **`pending`** → graues Pill mit Text „Ausstehend" (12px `--muted-foreground`, `bg: --card`, `border: --border`)
2. **`analyzing`** → indigoes Pill mit 10×10 px Spinner + Text „Analysiert…" (color `#818cf8`, `bg: rgba(99,102,241,0.12)`, `border: rgba(99,102,241,0.35)`)
3. **`done`** → Mono-Pill mit Score:
   - **≥ 75%** → grün (`#86efac`, bg/border grün-30%)
   - **≥ 50%** → gelb (`#fcd34d`, bg/border gelb-30%)
   - **< 50%** → rot (`#fca5a5`, bg/border rot-30%)
   - Format: `87%`, font JetBrains Mono 12.5px/600

### Inline-Edit-Pattern

Drei Varianten:

**A) Inline-Text (Single Line)**
- Display-State: `inline-flex`, padding `4px 8px`, margin `-4px -8px`, radius 6, color `--foreground`, font 13.5px
  - Bei Hover: `bg: --card-2`, `border: 1px solid --border`
  - Pencil-Icon (12×12, `--dim`) rechts, `opacity: 0` default → `opacity: 1` on hover
  - Empty-State: Text in `--dim` italic („Klicken zum Bearbeiten")
- Edit-State: Input + zwei 26×26 Buttons (Check & X)
  - Check-Button: hover → grünlich (`#86efac`, bg-grün-soft)
  - X-Button: hover → rötlich (`#fca5a5`, bg-rot-soft)
- Keyboard: `Enter` → confirm, `Escape` → cancel

**B) Inline-Multiline (Notizen)**
- Display: Textarea-look Container (`bg: --background-elev`, `border: 1px solid --border`, radius 8, padding `10px 12px`, color `--muted-foreground`, white-space pre-wrap)
- Hover: border `--border-2`, bg `#0d0d0d`, Pencil-Icon (12×12) absolut top-right `opacity 0 → 1`
- Edit: echte Textarea (min-height 120px), darunter Check/X-Buttons

**C) Inline-Popover (Status & Priorität)**
- Display: Badge wird klickbar — wrapper hat `position: relative`
- Klick öffnet Popover unterhalb (`top: calc(100% + 6px)`, `left: 0`)
- Popover: `bg: --card`, `border: 1px solid --border-2`, radius 9, padding 5, `box-shadow: 0 18px 48px -16px rgba(0,0,0,0.6)`
- Optionen: jede ist ein flex-row `gap: 8px`, `padding: 7px 9px`, radius 6 — zeigt Badge + Check-Icon rechts (`opacity: 1` wenn aktiv, sonst `0`)
- Outside-Click und Escape schließen das Popover

→ **shadcn/ui Mapping**: Nutze `<Popover>` aus shadcn, mit eigenem Trigger und Inhalt.

### Buttons

**Primary** (`bg: #6366f1`, hover `#5457e8`, text white): 7px 12px, radius 7, font 13px/600, gap 7, Icon 14×14
**Secondary** (`bg: #111`, border `#222`, text `--foreground`): hover bg `#141414`, border `#2a2a2a`
**Ghost** (transparent, border transparent, text `--muted-foreground`): hover bg `--card`, text `--foreground`
**Danger** (text `#fca5a5`): hover bg `rgba(239,68,68,0.08)`, border `rgba(239,68,68,0.3)`, text `#fecaca`
**Sm-Variant**: padding 5px 9px, font 12px, radius 6, Icon 12×12

**Icon-Button** (32×32 oder 26×26, radius 8 oder 6, transparent border, color `--muted-foreground`): hover bg `--card`, border `--border`, text `--foreground`

### Cards

- `bg: #111`, `border: 1px solid #222`, radius 12, overflow hidden
- Card-Head: `padding: 14px 18px`, `border-bottom: 1px solid #222`, flex space-between
  - Linke Seite: Icon (14×14, `--muted-foreground`) + Titel (14px/600)
  - Rechte Seite: Hint-Text oder Badge (11.5px, `--dim`)
- Card-Body: `padding: 8px 18px 18px`

---

## Interaktionen & Verhalten

### Globale Navigation
- Sidebar-Klick → Route-Wechsel, scrollt nach oben
- Breadcrumb-Segmente sind klickbar (zurück zur übergeordneten Seite)

### Jobs-Liste
- **Klick auf Job-Titel** oder **Pfeil-Icon in Row-Actions** → Navigation zu `/jobs/[id]`
- **External-Icon** → öffnet `job.url` in neuem Tab
- **Trash-Icon** → `window.confirm(`„${title}" wirklich löschen?`)` → bei OK: Job aus Liste entfernen, ggf. Toast „Job gelöscht"
- **Search-Input** → filtert client-seitig auf Titel/Firma/Ort (case-insensitive substring)
- **Filter-Segment** → filtert nach Status (außer „Alle")
- Filter und Search kombinieren (AND)
- Empty State erscheint wenn `filtered.length === 0`

### Job-Detail
- **„Jetzt analysieren"** → setzt `analysis.state = "analyzing"` → nach ~1.8s zufälliger Score 60–94 + state `done`. In Produktion: Backend-Call mit Job-Rohtext + persönlichem Profil → LLM → Score + Insights.
- **Status-Popover** → klickt Option → Status sofort aktualisieren, Popover schließen (optimistic update)
- **Priorität-Popover** → analog
- **Inline-Text-Felder** → Enter speichert, Escape verwirft, Check/X-Buttons explizit
- **Bewerbungsdatum**: akzeptiert Eingabe als `TT.MM.JJJJ`, speichert intern als ISO `YYYY-MM-DD`. Empfehlung: shadcn `<DatePicker>` (Popover + Calendar)
- **Rohtext-Collapse**: Klick auf Head togglet `open`, Chevron rotiert 180°

### Einstellungen
- **Profil speichern** → speichert, zeigt 2s den Inline-Check „Gespeichert"
- **Telegram-Chat-ID**-Änderung setzt `connected = false`, „Verbinden"-Button erscheint
- **Verbinden**-Button → in Produktion: Backend pollt Telegram-Updates für `/start`-Nachricht von dieser Chat-ID

### Animations
- Pencil/Action-Reveal: `transition: opacity 120ms ease`
- Card / Button-Hovers: `transition: background 120ms, border-color 120ms, color 120ms`
- Chevron-Rotation im Collapsible: `transition: transform 150ms ease`
- Spinner: 700ms linear infinite
- Match-Circle während Analyse: 1.6s linear infinite

---

## State Management

In einer echten Next.js + shadcn-Umsetzung:

```ts
// Empfohlene Datenmodelle (Prisma-Schema-Stil)

Job {
  id          String
  title       String
  company     String
  location    String
  remote      String        // "Hybrid (2 Tage Büro)" | "Full Remote" | …
  platform    String        // "LinkedIn" | "Stepstone" | …
  employment  String        // "Vollzeit" | "Teilzeit" | …
  seniority   String
  salary      String?       // freiform, z.B. "85.000 – 105.000 €"
  status      JobStatus     @default(INTERESSANT)
  priority    JobPriority   @default(MITTEL)
  appliedAt   DateTime?
  contact     String?
  contactEmail String?
  url         String?
  notes       String?       @db.Text
  rawText     String?       @db.Text
  analysis    Analysis?
  userId      String
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt
}

enum JobStatus      { INTERESSANT BEWORBEN GESPRAECH ANGEBOT ABGELEHNT ARCHIVIERT }
enum JobPriority    { HOCH MITTEL NIEDRIG }

Analysis {
  id        String
  jobId     String   @unique
  state     String   // "pending" | "analyzing" | "done"
  score     Int?
  summary   String?  @db.Text
  createdAt DateTime @default(now())
}

UserProfile {
  id          String
  userId      String   @unique
  description String   @db.Text
  telegramChatId String?
  telegramConnected Boolean @default(false)
  updatedAt   DateTime @updatedAt
}
```

**Client-State** für die UI:
- Auf Jobs-Liste: `query` (search), `filter` (status), evtl. `sort`
- Auf Detail: edit-states pro Feld (welches gerade editiert wird), `analyzing`-Flag, `rawOpen`-Flag
- In Settings: `profile`-Draft, `saved`-Flash, `telegramId`-Draft, `connected`-Flag

**Server-Actions** (Next.js App Router):
- `updateJob(id, patch)`
- `deleteJob(id)`
- `createJob(data)`
- `analyzeJob(id)` — kicked off, returns immediately; client polls oder hört auf Server-Sent-Events
- `updateProfile(text)`
- `connectTelegram(chatId)` / `disconnectTelegram()`

---

## Assets & Icons

**Icons**: Alle Icons sind **lucide-style** (stroke `1.75`, round caps/joins, 24×24 viewBox). In der Implementation: `lucide-react` mit folgenden Namen — gegebenenfalls 1:1 ersetzbar:

| Prototyp-Name | lucide-react |
|---|---|
| `dashboard` | `LayoutDashboard` |
| `briefcase` | `Briefcase` |
| `resume` | `FileText` |
| `certificate` | `Award` |
| `send` | `Send` |
| `settings` | `Settings` |
| `search` | `Search` |
| `filter` | `ListFilter` |
| `plus` | `Plus` |
| `chevDown` / `chevRight` / `chevLeft` | `ChevronDown` / `ChevronRight` / `ChevronLeft` |
| `check` | `Check` |
| `x` | `X` |
| `pencil` | `Pencil` |
| `trash` | `Trash2` |
| `more` | `MoreHorizontal` |
| `external` | `ExternalLink` |
| `link` | `Link` |
| `star` | `Star` |
| `flag` | `Flag` |
| `map` | `MapPin` |
| `building` | `Building2` |
| `euro` | `Euro` |
| `globe` | `Globe` |
| `calendar` | `Calendar` |
| `user` | `User` |
| `note` | `FileText` (oder `StickyNote`) |
| `home` | `Home` |
| `inbox` | `Inbox` |
| `bell` | `Bell` |
| `help` | `HelpCircle` |
| `sparkles` | `Sparkles` |
| `zap` | `Zap` |
| `copy` | `Copy` |
| `upload` | `Upload` |
| `database` | `Database` |
| `paperclip` | `Paperclip` |
| `telegram` | (custom — kein lucide-Pendant; nutze `Send` oder eigene SVG) |
| `shield` | `Shield` |
| `arrowRight` | `ArrowRight` |

**Avatar-Bild**: Im Prototyp ein CSS-Gradient mit Initialen. In Produktion: User-Profilbild aus Auth-Provider, mit Fallback-Initialen-Gradient.

---

## Mock-Daten

8 Beispiel-Jobs sind in `design/src/data.jsx` enthalten — alle Felder, Status-Varianten und Score-Schwellen sind abgedeckt. Diese sind nur als Referenz da, **nicht** als Seed-Daten gedacht — die Firmen-/Personen-Namen sind erfunden.

---

## Dateien in diesem Paket

```
design_handoff_pat/
├── README.md                  ← diese Datei
└── design/
    ├── index.html             ← Einstiegspunkt (alle Seiten in einer SPA mit Mock-Router)
    ├── styles.css             ← alle CSS-Variablen + Component-Styles
    └── src/
        ├── icons.jsx          ← Lucide-style Icon-Set
        ├── data.jsx           ← Mock-Daten + Helpers (fmtDate, scoreClass, etc.)
        ├── primitives.jsx     ← StatusBadge, PriorityCell, AnalysisCell, InlineText, InlineStatus, InlinePriority, Popover
        ├── sidebar.jsx        ← Sidebar-Nav
        ├── jobs-page.jsx      ← Jobs-Listenansicht
        ├── detail-page.jsx    ← Job-Detail mit Tracking / Details / Collapsible
        ├── settings-page.jsx  ← Konto / Profil / Telegram
        └── app.jsx            ← App-Shell + Topbar + Router
```

**Empfohlener Implementation-Reihenfolge:**

1. **Tokens & Theme** zuerst — `tailwind.config.ts` mit Custom Colors + `globals.css` mit CSS-Variablen. Plus-Jakarta-Sans und JetBrains-Mono via `next/font/google`.
2. **App-Shell** — Sidebar-Layout + Topbar als persistent Layout (`app/(app)/layout.tsx`)
3. **Status- & Priority-Badges, ScoreBadge** als Standalone-Components
4. **Inline-Edit-Primitive** (Text, Multiline, Popover-Variant) — wiederverwendbar
5. **Jobs-Liste** mit shadcn `<Table>`, `<Input>` für Search, `<Tabs>` oder Toggle-Group für Filter
6. **Job-Detail** mit shadcn `<Collapsible>` für Rohtext, `<Popover>` für Status/Prio, `<Card>`
7. **Einstellungen** — drei `<Card>`-Blöcke, `<Textarea>`, `<Toast>` für Speicher-Feedback
8. **Mock-Datenebene** durch echte Server-Actions + DB ersetzen
9. **KI-Analyse-Endpunkt** mit LLM (OpenAI / Anthropic) — als Input: persönliches Profil + `rawText`; als Output: Score + Begründung
10. **Telegram-Webhook** für `@pat_tracker_bot` → Job-Import via geteilten Link

---

## Hinweise

- Alle UI-Strings sind **Deutsch** (du-Form, sachlich, kurz). Bei i18n-Bedarf: nutze `next-intl` mit `de` als Default-Locale.
- Datumsformatierung: `DD.MM.YYYY` für Display, ISO `YYYY-MM-DD` intern. Nutze `date-fns` mit `de`-Locale oder `Intl.DateTimeFormat("de-DE")`.
- Zahlen mit tausender-Punkten: `n.toLocaleString("de-DE")` (siehe Rohtext-Char-Count).
- Gehalts-Strings sind freiform — kein zwingender Parse, aber im Detail in Mono-Schrift anzeigen.
- Match-Score-Berechnung im Prototyp ist ein Mock. In Produktion: LLM-Prompt mit klar definiertem JSON-Output-Schema (`{ score: number 0-100, summary: string, strengths: string[], gaps: string[] }`).
