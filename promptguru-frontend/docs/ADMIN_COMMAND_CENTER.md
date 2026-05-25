# PromptGuru Admin Command Center

> **Purpose:** Reproduce the admin dashboard look, feel, and architecture in this project or any future stack.  
> **Source files:** `src/app/admin/page.tsx`, `src/lib/adminApi.ts`, `src/lib/adminSocket.ts`  
> **Shared brand tokens:** See [`PROMPTGURU_DESIGN_SYSTEM.md`](./PROMPTGURU_DESIGN_SYSTEM.md) for colors, glass cards, dot grid, and glow values.

---

## 1. What this UI is

The admin page is a **dark glassmorphism command center** — not a third-party admin template. It combines:

| Layer | Role |
|-------|------|
| **Tailwind CSS** | All visual styling (glass panels, grid, typography) |
| **Framer Motion** | Entry animations, live feed, slide-over user panel |
| **Recharts** | Area, bar, line, and pie charts |
| **Lucide React** | Section icons (Shield, Users, Swords, Eye, etc.) |
| **Socket.IO client** | Real-time event stream + typing radar |
| **REST admin API** | KPIs, charts, users, prompts, battles |

### Visual identity (one-liner for AI / Figma)

```
Dark command center dashboard, black canvas, purple/violet ambient blur orbs,
dot grid overlay, frosted glass cards (white/4–5% + backdrop-blur),
uppercase micro-labels, large tabular KPI numbers, color-coded live events,
Recharts with dark tooltips, slide-over detail panel from the right.
```

### Style keywords

```
glassmorphism · command center · real-time telemetry · purple neon SaaS
· cosmic dark workspace · live ops dashboard · KPI cards with accent glow
```

---

## 2. Tech stack (exact packages)

Install these in a new Next.js / React project:

```bash
npm install framer-motion recharts lucide-react clsx tailwind-merge
npm install @radix-ui/react-slot class-variance-authority   # optional: shadcn-style Button
npm install socket.io-client                                 # only if you need live feed
```

| Package | Version (this repo) | Admin usage |
|---------|---------------------|-------------|
| `next` | 15.4.x | App Router, `'use client'` page |
| `react` | 19.x | State, effects |
| `tailwindcss` | 4.x | All styling |
| `framer-motion` | 12.x | `motion.div`, `AnimatePresence`, spring slide-over |
| `recharts` | 3.x | Charts inside `ResponsiveContainer` |
| `lucide-react` | 0.525.x | Icons |
| `socket.io-client` | 4.x | `subscribeAdminLive()` |
| `@radix-ui/react-slot` + `class-variance-authority` | — | `Button` component (overridden with Tailwind classes) |

**Not used:** MUI, Ant Design, Tremor, shadcn DataTable, admin boilerplate kits. The look comes from **hand-written Tailwind**, not a theme skin.

---

## 3. File map

```
promptguru-frontend/
├── src/app/admin/page.tsx          # Full UI — layout, charts, tables, user panel
├── src/lib/adminApi.ts             # Typed REST client + TypeScript types
├── src/lib/adminSocket.ts          # Socket.IO subscribe/unsubscribe
├── src/components/button.tsx       # shadcn-style Button (minimal)
└── docs/
    ├── PROMPTGURU_DESIGN_SYSTEM.md # Shared brand / glass / glow tokens
    └── ADMIN_COMMAND_CENTER.md     # This file

promptguru-backend/
├── routes/adminRoutes.js           # /api/admin/* routes
├── controllers/adminController.js  # KPIs, users, prompts, charts
├── middleware/adminMiddleware.js   # requireAdmin guard
├── sockets/adminSocket.js          # admin:subscribe, admin:live_event
└── utils/adminEvents.js            # In-memory event ring buffer + broadcast
```

---

## 4. Page layout architecture

```
┌─────────────────────────────────────────────────────────────────┐
│ Navbar                                                          │
├─────────────────────────────────────────────────────────────────┤
│  [Ambient orbs + dot grid — z-0, pointer-events-none]           │
│                                                                 │
│  Header: badge "Command Center" · title · live pill · Refresh   │
│                                                                 │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐               │
│  │ KPI     │ │ KPI     │ │ KPI     │ │ KPI     │  4-col grid   │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘               │
│                                                                 │
│  ┌──────────────────────────────┬──────────────────────────┐   │
│  │  xl:col-span-8 (main)      │  xl:col-span-4 (sidebar) │   │
│  │  · 7-day activity (Area)   │  · Live prompt radar     │   │
│  │  · Score bar + Avg line    │  · Event stream          │   │
│  │  · Users table + search    │  · User sources (Pie)    │   │
│  │                            │  · Top players list      │   │
│  └──────────────────────────────┴──────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────┐ ┌─────────────────────────┐       │
│  │ Active battle rooms     │ │ Recent analyzed prompts │       │
│  └─────────────────────────┘ └─────────────────────────┘       │
│                                                                 │
│  [UserDetailPanel — fixed slide-over from right, z-50]          │
└─────────────────────────────────────────────────────────────────┘
```

### Grid classes

| Section | Tailwind |
|---------|----------|
| Page max width | `max-w-[1400px] mx-auto px-4 pt-28 pb-16` |
| KPI row | `grid gap-4 sm:grid-cols-2 xl:grid-cols-4` |
| Main + sidebar | `grid gap-6 xl:grid-cols-12` → `xl:col-span-8` + `xl:col-span-4` |
| Bottom row | `grid gap-6 lg:grid-cols-2` |

---

## 5. Background shell (copy this first)

Every admin view sits on this stack:

```tsx
<main className="min-h-screen bg-black text-white relative overflow-x-hidden">
  <Navbar />

  {/* Layer 0 — ambient atmosphere */}
  <div className="pointer-events-none absolute inset-0 z-0">
    <div className="absolute left-1/4 top-0 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-purple-700/20 blur-[160px]" />
    <div className="absolute bottom-0 right-0 h-[400px] w-[400px] rounded-full bg-violet-600/15 blur-[140px]" />
    <div className="h-full w-full bg-[radial-gradient(#ffffff0f_1px,transparent_1px)] [background-size:20px_20px]" />
  </div>

  {/* Layer 1 — content */}
  <div className="relative z-10 mx-auto max-w-[1400px] px-4 pb-16 pt-28 sm:px-6">
    {/* dashboard sections */}
  </div>
</main>
```

---

## 6. Reusable UI patterns

### 6.1 Glass section card

Used for charts, tables, and lists:

```tsx
className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-md"
```

### 6.2 KPI card

Signature admin metric tile — accent color drives glow + icon tint:

```tsx
<motion.div
  initial={{ opacity: 0, y: 12 }}
  animate={{ opacity: 1, y: 0 }}
  className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-md"
  style={{ boxShadow: `0 0 40px ${accent}22` }}
>
  {/* Corner blur blob */}
  <div
    className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full blur-2xl"
    style={{ background: accent, opacity: 0.25 }}
  />
  <p className="text-[11px] font-medium uppercase tracking-widest text-gray-500">{label}</p>
  <p className="mt-1 text-3xl font-bold tabular-nums text-white">{value}</p>
  <p className="mt-1 text-xs text-gray-400">{sub}</p>
</motion.div>
```

**KPI accent colors used:**

| Metric | Hex accent |
|--------|------------|
| Total users | `#a855f7` (purple-500) |
| Prompts analyzed | `#8b5cf6` (violet-500) |
| Active battles | `#ec4899` (pink-500) |
| Live typing | `#22d3ee` (cyan-400) |

### 6.3 Header badge + gradient title

```tsx
<motion.div className="mb-2 inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-1 text-xs text-purple-300">
  <Shield className="h-3.5 w-3.5" />
  Command Center
</motion.div>
<h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
  PromptGuru{' '}
  <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
    Admin
  </span>
</h1>
```

### 6.4 Live connection pill

```tsx
<span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs ${
  connected
    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
    : 'border-gray-600 bg-white/5 text-gray-400'
}`}>
  <Radio className={`h-3 w-3 ${connected ? 'animate-pulse' : ''}`} />
  {connected ? 'Live feed connected' : 'Connecting…'}
</span>
```

### 6.5 Recharts dark theme

**Chart palette:** `['#a855f7', '#8b5cf6', '#ec4899', '#6366f1']`

**Tooltip (use on every chart):**

```tsx
const chartTooltipStyle = {
  contentStyle: {
    background: 'rgba(9,9,11,0.92)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 12,
    fontSize: 12,
  },
  labelStyle: { color: '#d1d5db' },
}
```

**Grid / axes:**

```tsx
<CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
<XAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
<YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
```

**Charts on admin page:**

| Chart | Type | Data key(s) |
|-------|------|-------------|
| 7-day activity | `AreaChart` | `prompts`, `signups`, `battles` |
| Score distribution | `BarChart` | `count` per bucket |
| Avg score trend | `LineChart` | `avgScore` |
| User sources | `PieChart` (donut) | Google vs Email |

Always wrap in:

```tsx
<div className="h-72 w-full">
  <ResponsiveContainer width="100%" height="100%">
    {/* chart */}
  </ResponsiveContainer>
</div>
```

### 6.6 Live event stream cards

Events are color-coded by type:

| Event type | Border / background |
|------------|---------------------|
| `typing` | `border-cyan-500/30 bg-cyan-500/5` |
| `analyzed` | `border-purple-500/30 bg-purple-500/5` |
| `battle` | `border-pink-500/30 bg-pink-500/5` |

New events prepend with Framer Motion:

```tsx
<AnimatePresence initial={false}>
  {events.map((ev) => (
    <motion.div
      key={ev.id}
      initial={{ opacity: 0, x: 8 }}
      animate={{ opacity: 1, x: 0 }}
      className={`rounded-xl border px-3 py-2.5 ${eventColor(ev)}`}
    />
  ))}
</AnimatePresence>
```

Keep at most **120** events in state: `[ev, ...prev].slice(0, 120)`.

### 6.7 Users table (clickable rows)

```tsx
<tr
  className="cursor-pointer border-b border-white/5 hover:bg-purple-500/[0.06] transition-colors"
  onClick={() => openUserDetail(user.id)}
>
```

Search input:

```tsx
className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-purple-500/50"
```

Table header micro-labels:

```tsx
className="text-[11px] uppercase tracking-wide text-gray-500"
```

### 6.8 Score badges (prompts)

```tsx
function scoreBadge(score: number | null) {
  if (score == null) return 'bg-gray-700/40 text-gray-400'
  if (score >= 8.5) return 'bg-emerald-500/20 text-emerald-300'
  if (score >= 7) return 'bg-purple-500/20 text-purple-300'
  if (score >= 5) return 'bg-amber-500/20 text-amber-300'
  return 'bg-red-500/20 text-red-300'
}
```

### 6.9 User detail slide-over panel

Pattern: overlay + spring aside from the right.

```tsx
<AnimatePresence>
  {selectedUserId && (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.aside
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 320 }}
        className="fixed inset-y-0 right-0 z-50 flex w-full max-w-xl flex-col border-l border-white/10 bg-zinc-950/95 shadow-2xl backdrop-blur-xl"
      >
        {/* scrollable content */}
      </motion.aside>
    </>
  )}
</AnimatePresence>
```

---

## 7. Data flow & state

### Auth gate

1. Read JWT from `localStorage.getItem('token')`
2. Call `fetchSessionUser(token)` → check `user.isAdmin`
3. If not admin → show access-denied glass card (red accent)
4. If admin → `loadAll(token)` + `subscribeAdminLive(token, ...)`

### Initial load (`loadAll`)

Parallel fetch via `Promise.all`:

| Function | Endpoint | Sets state |
|----------|----------|------------|
| `fetchAdminOverview` | `GET /api/admin/overview` | KPIs + bootstrap live events |
| `fetchAdminActivity` | `GET /api/admin/activity` | 7-day chart series |
| `fetchAdminDistribution` | `GET /api/admin/distribution` | Score buckets + pie data |
| `fetchAdminUsers` | `GET /api/admin/users?page&q` | Users table |
| `fetchAdminPrompts` | `GET /api/admin/prompts` | Recent prompts |
| `fetchAdminBattles` | `GET /api/admin/battles/active` | Active rooms |
| `fetchAdminLeaderboard` | `GET /api/admin/leaderboard` | Top players |

User search / pagination re-triggers `loadAll(token, true)` (silent refresh, no full-page spinner).

### User drill-down

| Action | Behavior |
|--------|----------|
| Click user row | `openUserDetail(userId)` |
| Click recent prompt card | Same, if `prompt.user.id` exists |
| Panel open | `fetchAdminUserDetail(token, userId, page)` |
| Role change in panel | `patchUserRole` + refresh list + update local panel state |

---

## 8. Backend API reference

Base URL: `{API_BASE}/api/admin`  
Auth: `Authorization: Bearer <JWT>`  
All routes use `requireAdmin` middleware.

| Method | Path | Returns |
|--------|------|---------|
| `GET` | `/overview` | KPIs + recent live events |
| `GET` | `/activity` | 7-day signups / prompts / battles / avgScore |
| `GET` | `/distribution` | Score histogram buckets + user source split |
| `GET` | `/users?page&limit&q` | Paginated user list + prompt counts |
| `GET` | `/users/:userId?page&limit` | User profile, stats, paginated prompts |
| `PATCH` | `/users/:userId/role` | `{ role: "user" \| "admin" }` |
| `GET` | `/prompts?page&limit` | Recent analyzed prompts |
| `GET` | `/battles/active` | Waiting / active battle rooms |
| `GET` | `/leaderboard` | Top 10 global leaderboard |

**Telemetry (non-admin users):** `POST /api/telemetry/prompt-draft` — feeds the live typing radar.

---

## 9. Real-time layer (Socket.IO)

### Client (`adminSocket.ts`)

```tsx
subscribeAdminLive(token, onEvent, onBootstrap, onError)
```

| Socket event | Direction | Payload |
|--------------|-----------|---------|
| `admin:subscribe` | client → server | (auth via `socket.auth.token`) |
| `admin:subscribed` | server → client | `{ recentEvents: LiveEvent[] }` |
| `admin:live_event` | server → client | `LiveEvent` |
| `admin:unsubscribe` | client → server | on cleanup |
| `admin:error` | server → client | `{ message }` |

### LiveEvent shape

```ts
type LiveEvent = {
  id: string
  at: string
  type: 'typing' | 'analyzed' | 'battle'
  user?: { id?: string; name?: string; email?: string }
  text?: string
  score?: number
  roomCode?: string
  action?: string
  isCorrect?: boolean
  winner?: string
  // ...
}
```

**Optional for replication:** Skip Socket.IO and use polling or static mock events — the **visual** (colored cards, timestamps) still works.

---

## 10. Lucide icons by section

| Section | Icon |
|---------|------|
| Command Center badge | `Shield` |
| Total users KPI | `Users` |
| Prompts KPI | `Zap` |
| Battles KPI | `Swords` |
| Live typing KPI | `Eye` |
| Activity chart | `Activity` |
| Score distribution | `BarChart3` |
| Live feed | `Radio` |
| Top players | `Crown` |
| User panel | `User` |
| User email | `Mail` |
| Table row affordance | `ChevronRight` |
| Close panel | `X` |
| Refresh | `RefreshCw` |

---

## 11. Step-by-step: replicate in a new project

### Phase 1 — Shell (15 min)

1. `npx create-next-app` + Tailwind
2. Copy **§5 Background shell** into your admin layout
3. Add header from **§6.3** and one KPI row from **§6.2**
4. Confirm black + purple glow + dot grid looks right

### Phase 2 — Charts (30 min)

1. `npm install recharts`
2. Add one `AreaChart` with **§6.5** tooltip/axis styles
3. Use mock data: `{ label, prompts, signups, battles, avgScore }[]`
4. Add bar + line charts in a 2-col grid

### Phase 3 — Tables & lists (30 min)

1. Glass section + search input + paginated table (**§6.7**)
2. Bottom row: two glass panels (list cards with `border-white/5 bg-black/20`)

### Phase 4 — Motion (20 min)

1. `npm install framer-motion`
2. KPI `initial/animate`, event stream `AnimatePresence`
3. Optional slide-over panel (**§6.9**)

### Phase 5 — Live data (optional)

1. Wire REST endpoints matching **§8**
2. Add `socket.io-client` + **§9** if you need real-time

### Phase 6 — Polish

1. Copy shared tokens from `PROMPTGURU_DESIGN_SYSTEM.md` (glow RGBA, Inter font)
2. Tune accent hex values per product (keep structure, swap brand color)
3. Add `tabular-nums` on all numeric displays

---

## 12. AI / v0 prompt (paste as-is)

```
Build a dark admin command center dashboard in Next.js + Tailwind + Framer Motion + Recharts.

Visual:
- bg-black full-page canvas
- Two large purple/violet blur orbs (blur-[160px], opacity 15–20%)
- Dot grid overlay: radial-gradient(#ffffff0f 1px, transparent 1px) 20px
- Glass cards: rounded-2xl border-white/10 bg-white/[0.03] backdrop-blur-md

Layout:
- Top: 4 KPI cards in a grid (uppercase micro-label, text-3xl bold number, colored icon box)
- Main 8/12 cols: area chart (7-day activity), bar chart + line chart side by side, searchable users table
- Sidebar 4/12 cols: cyan "live typing" panel, color-coded event stream, donut pie chart, ranked list
- Bottom: two equal columns for active sessions + recent items

Charts:
- Recharts with dark tooltip rgba(9,9,11,0.92), grid stroke white/6%, axis ticks #6b7280
- Colors: #a855f7, #8b5cf6, #ec4899, #6366f1

Interactions:
- Click table row → slide-over panel from right (spring animation, max-w-xl, bg-zinc-950/95)
- Live connection pill: emerald when connected, pulsing Radio icon
- Event cards: cyan border for typing, purple for analyzed, pink for battles

Typography:
- Labels: text-[11px] uppercase tracking-widest text-gray-500
- Values: text-3xl font-bold tabular-nums text-white
- Muted: text-gray-400 text-sm

Do NOT use MUI or Ant Design. Hand-tailwind only.
```

---

## 13. Checklist before shipping

- [ ] Black canvas + dot grid + ambient orbs on every admin route
- [ ] All section cards use `border-white/10` + `backdrop-blur-md`
- [ ] KPI cards have per-metric accent glow (`boxShadow: 0 0 40px ${accent}22`)
- [ ] Charts use shared `chartTooltipStyle` and `PIE_COLORS`
- [ ] Numbers use `tabular-nums`
- [ ] Table rows have hover state + clear click affordance (`ChevronRight`)
- [ ] Slide-over panel: overlay click closes, spring transition, scrollable body
- [ ] Admin gate: redirect if no token; block UI if not admin
- [ ] Live feed capped at ~120 events to avoid memory bloat
- [ ] Mobile: tables in `overflow-x-auto`, slide-over is full width (`w-full max-w-xl`)

---

## 14. Related docs

| Doc | When to use |
|-----|-------------|
| [`PROMPTGURU_DESIGN_SYSTEM.md`](./PROMPTGURU_DESIGN_SYSTEM.md) | Brand colors, glass recipes, neon CSS, typography, landing/dashboard parity |
| `src/app/admin/page.tsx` | Full working reference implementation |
| `src/lib/adminApi.ts` | TypeScript types + REST client patterns |

---

*Last aligned with admin page features: KPIs, charts, users table, user drill-down panel, live socket feed, battles, leaderboard, recent prompts.*
