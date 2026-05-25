# PromptGuru Design System

> **Source of truth:** Dashboard (`src/app/dashboard/page.tsx`), Landing (`src/app/page.tsx`), Auth (`login`, `register`), `globals.css`, `Navbar.tsx`, `tailwind.config.ts`  
> **Use this file** in Figma, v0, Cursor, or any stack to reproduce the same premium dark-purple glass UI.

---

## 1. Brand

| Attribute | Value |
|-----------|--------|
| **Product name** | PromptGuru |
| **Tagline** | Master Prompting. Instantly. |
| **Domain voice** | Confident, AI-native, educational — “analyze, improve, master” |
| **Visual mood** | Dark cosmic workspace — black canvas, soft purple ambient glow, glass panels, subtle dot grid |
| **Primary action color** | Purple (not pink-first; pink appears only in neon button gradient accent) |
| **Emoji in UI** | Light use: ✨ 💡 📋 🚀 — functional labels, not decoration overload |

### Brand keywords (for AI / design briefs)

```
dark mode, glassmorphism, purple neon glow, ambient blur orb,
dot grid background, Inter font, premium SaaS, prompt engineering,
framer-motion subtle drift, backdrop-blur, white/10 borders
```

---

## 2. Color Palette

### 2.1 Core surfaces

| Role | Hex / value | Tailwind | Usage |
|------|-------------|----------|--------|
| **Canvas** | `#000000` | `bg-black` | Page background |
| **Primary text** | `#ffffff` | `text-white` | Headings, labels |
| **Body muted** | `#9ca3af` | `text-gray-400` | Subtitles, hints |
| **Secondary muted** | `#d1d5db` | `text-gray-300` | Lists, sidebar history |
| **Sidebar / list hover** | — | `hover:text-white` | Interactive list items |
| **Glass panel** | white @ 5% | `bg-white/5` | Cards, sidebar, modals |
| **Glass input** | white @ 10% | `bg-white/10` | Text inputs on dashboard |
| **Glass border** | white @ 10–20% | `border-white/10`, `border-white/20` | Cards, navbar, inputs |
| **Divider** | white @ 10% | `border-white/10` | Section splits |
| **Modal overlay** | black @ 70% | `bg-black/70` | Mobile history dialog |
| **Modal surface** | zinc-900 | `bg-zinc-900 border-zinc-700` | Mobile dialog only |

### 2.2 Purple brand scale (primary)

| Role | Tailwind | Approx hex | Usage |
|------|----------|------------|--------|
| **CTA default** | `bg-purple-600` | `#9333ea` | Analyze, Login, primary buttons |
| **CTA hover** | `hover:bg-purple-700` | `#7e22ce` | Button hover |
| **Accent label** | `text-purple-400` | `#c084fc` | “AI Feedback”, links, Try |
| **Badge / score** | `bg-purple-700` | `#7e22ce` | Score pill |
| **Secondary CTA** | `bg-purple-800` | `#6b21a8` | “Try New Prompt” |
| **Ambient orb** | `bg-purple-700/30` + `blur-[180px]` | — | Dashboard/login orb |
| **Tailwind purple-500** | `purple-500` | `#a855f7` | Gradient end (home CTA) |
| **Tailwind purple-700** | `purple-700` | `#7e22ce` | Gradient start |

### 2.3 Glow colors (exact RGBA — copy these)

These two purples drive **all** premium glow. Do not substitute random violets.

| Name | RGBA | Tailwind equivalent |
|------|------|---------------------|
| **Glow primary** | `rgba(168, 85, 247, *)` | `purple-500` (#a855f7) |
| **Glow secondary** | `rgba(139, 92, 246, *)` | `violet-500` (#8b5cf6) |
| **Neon accent (buttons)** | `#ec4899` → `#8b5cf6` | pink-500 → violet-500 gradient |

**Opacity tiers used in production:**

| Tier | Primary α | Secondary α | Use |
|------|-----------|---------------|-----|
| Subtle card shadow | 0.26 | — | Feature cards |
| Medium card / hero backdrop | 0.39–0.455 | 0.39 | Hero glow layer |
| Strong hero card | 0.52 | — | Hero `box-shadow` |
| Ambient page orb (home) | 0.26 | 0.195 | Large radial gradient |
| Inner drift orbs | 0.13–0.195 | 0.104 | Animated corner blobs |
| CSS `.neon-card:hover` | 0.6 | — | `box-shadow` spread |
| CSS `.neon-table` | 0.2 | — | Tables |
| CSS outline hover | — | pink/violet multi-shadow | See §5.3 |

### 2.4 Semantic colors

| Role | Tailwind | Usage |
|------|----------|--------|
| **Error text** | `text-red-500` | Inline errors |
| **Error alert** | `text-red-400` | Char limit warning (>90 chars) |
| **Error toast** | `bg-red-600` | Login notifications |
| **Success toast** | `bg-green-600` | Login success |
| **Logout** | `bg-red-600 hover:bg-red-700` | Navbar logout |
| **Footer** | `text-gray-600` | Copyright |

### 2.5 Dot grid (signature background)

```css
/* Tailwind arbitrary — used on dashboard, login, home footer layer */
background-image: radial-gradient(#ffffff0f 1px, transparent 1px);
background-size: 20px 20px;
```

```html
<div class="absolute inset-0 z-0 pointer-events-none">
  <div class="w-full h-full bg-[radial-gradient(#ffffff0f_1px,transparent_1px)] [background-size:20px_20px]" />
</div>
```

Dot color `#ffffff` at **~6% opacity** (`0f` in 8-digit hex).

### 2.6 shadcn / CSS variables (secondary system)

Layout loads **Geist** CSS variables; **dashboard visually uses Inter** from `globals.css`. For shadcn components, `.dark` tokens apply — but marketing/dashboard pages override with `bg-black text-white`.

---

## 3. Typography

### 3.1 Font families

| Context | Family | How loaded |
|---------|--------|------------|
| **Dashboard & marketing body** | **Inter** 400, 600, 700 | Google Fonts in `globals.css` |
| **App shell (Next layout)** | **Geist Sans** + **Geist Mono** | `next/font/google` — CSS vars `--font-geist-sans`, `--font-geist-mono` |
| **Tailwind `font-sans`** | Inter | `tailwind.config.ts` |

**Rule for matching dashboard exactly:** set `font-family: 'Inter', sans-serif` on `body` and use `antialiased`.

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');

body {
  font-family: 'Inter', sans-serif;
  -webkit-font-smoothing: antialiased;
  background: #000000;
  color: #ffffff;
}
```

### 3.2 Type scale (dashboard)

| Element | Classes | Size feel |
|---------|---------|-----------|
| **Page H1** | `text-2xl md:text-4xl font-bold text-center` | Hero title |
| **Subtitle** | `text-sm text-gray-400` | Under H1 |
| **Section H3** | `text-base font-semibold text-purple-400` | “AI Feedback” |
| **Section H4** | `text-sm font-semibold text-white` | Suggested prompts / tips |
| **Sidebar title** | `text-lg font-semibold` | “History” |
| **Body / lists** | `text-xs text-gray-300` | Feedback lists |
| **Navbar brand** | `text-lg font-bold tracking-wide` | PromptGuru |
| **Nav links** | `text-sm text-gray-300 hover:text-white transition` | — |
| **Score badge** | `text-xs px-2 py-0.5 rounded-full` | Pill on card |
| **Char counter** | `text-xs` gray-400 → red-400 when >90 | Input corner |

### 3.3 Landing-only scale (reference)

| Element | Classes |
|---------|---------|
| Hero H1 | `text-4xl md:text-5xl font-bold` |
| Section H2 | `text-3xl font-bold` |
| Feature H3 | `text-lg font-semibold` |
| Feature body | `text-sm text-gray-400` |

---

## 4. Glow & Depth System

### 4.1 Layer stack (z-index)

```
z-0  — animated purple orb + dot grid (pointer-events-none)
z-10 — main content, sidebar, forms
z-20 — mobile FAB (“View History”)
z-50 — navbar, modals
```

### 4.2 Dashboard ambient orb (exact)

```jsx
<motion.div
  className="absolute z-0 w-[600px] h-[600px] bg-purple-700/30 blur-[180px] rounded-full"
  animate={{
    x: [0, 30, -30, 0],
    y: [0, -20, 20, 0],
    scale: [1, 1.05, 1, 0.98, 1],
  }}
  transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
  style={{
    top: '50%',
    left: '50%',
    translateX: '-50%',
    translateY: '-50%',
  }}
/>
```

### 4.3 Home page hero orb (stronger / larger)

```jsx
<motion.div
  className="absolute z-0 w-[800px] h-[800px] rounded-full"
  style={{
    top: '50%',
    left: '50%',
    translateX: '-50%',
    translateY: '-50%',
    background:
      'radial-gradient(circle at center, rgba(168, 85, 247, 0.26) 0%, rgba(139, 92, 246, 0.195) 50%, transparent 70%)',
    filter: 'blur(250px)',
  }}
  /* animate: x [0,60,-60,0], y [0,-40,40,0], scale [1,1.1,1,0.95,1], duration 25s */
/>
```

### 4.4 Glass card (dashboard feedback panel)

```html
<div class="
  bg-white/5
  border border-white/10
  backdrop-blur-md
  rounded-xl
  shadow-md
  p-4 sm:p-6
">
```

**Optional purple shadow (home/feature parity):**

```css
box-shadow: 0 0 25px -5px rgba(168, 85, 247, 0.26);
```

**Hero-tier shadow:**

```css
box-shadow: 0 0 50px -10px rgba(168, 85, 247, 0.52);
```

### 4.5 Glass card gradient border (landing)

```html
class="backdrop-blur-lg bg-gradient-to-br from-white/5 to-white/2 border border-white/20 rounded-2xl"
```

### 4.6 Inner animated glow blobs (landing cards)

Place **inside** `relative overflow-hidden` card, `pointer-events-none`:

```jsx
<motion.div
  className="absolute -bottom-10 -right-10 w-40 h-40 rounded-full -z-10"
  style={{
    background: 'radial-gradient(circle, rgba(139, 92, 246, 0.13) 0%, transparent 70%)',
    filter: 'blur(18px)',
  }}
  animate={{ opacity: [0.26, 0.52, 0.26] }}
  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
/>
```

### 4.7 Global CSS neon utilities (`globals.css`)

Copy into any project:

```css
.neon-card:hover {
  box-shadow: 0 0 40px -10px rgba(168, 85, 247, 0.6) !important;
}

.neon-feature-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 0 40px -10px rgba(168, 85, 247, 0.4) !important;
}

.neon-button {
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
}

.neon-button::before {
  content: '';
  position: absolute;
  inset: -2px;
  background: linear-gradient(45deg, #ec4899, #8b5cf6, #ec4899);
  background-size: 200%;
  z-index: -1;
  border-radius: inherit;
  opacity: 0;
  transition: 0.3s;
}

.neon-button:hover::before {
  opacity: 0.7;
  animation: neonGlow 2s linear infinite;
}

.neon-button-outline:hover {
  box-shadow:
    0 0 10px rgba(219, 39, 119, 0.5),
    0 0 20px rgba(139, 92, 246, 0.3);
}

@keyframes neonGlow {
  0% { background-position: 0% 50%; }
  100% { background-position: 200% 50%; }
}
```

---

## 5. Components

### 5.1 Page shell (dashboard)

```html
<main class="h-screen bg-black text-white relative overflow-hidden">
  <!-- Navbar -->
  <!-- Orb z-0 -->
  <!-- Dot grid z-0 -->
  <div class="relative z-10 flex h-full">
    <!-- sidebar + main -->
  </div>
</main>
```

### 5.2 Floating navbar (pill)

```html
<nav class="
  fixed top-4 left-1/2 -translate-x-1/2 z-50
  backdrop-blur-md bg-white/5 border border-white/10
  rounded-full px-6 py-3
  flex items-center justify-between
  w-[90%] max-w-6xl shadow-sm
">
```

**Motion:** `opacity 0→1`, `y -20→0`, `duration 0.5s`

### 5.3 Primary button

```html
<button class="
  bg-purple-600 hover:bg-purple-700
  text-white px-6 py-2 rounded-md
  text-sm font-medium transition-all
  disabled:opacity-50
">
  Analyze
</button>
```

**Landing gradient CTA:**

```html
<span class="absolute inset-0 bg-[linear-gradient(90deg,#7e22ce,#a855f7)] opacity-100 group-hover:opacity-90 transition-all duration-300"></span>
```

### 5.4 Outline button

```html
<button class="border border-white/20 text-white hover:bg-white/10 rounded-lg px-5 py-2">
```

### 5.5 Text input (dashboard)

```html
<input class="
  w-full bg-white/10 border border-white/20 rounded
  px-4 py-3 text-white
  placeholder:text-gray-400
  outline-none backdrop-blur-sm
" />
```

### 5.6 Auth card (login/register)

```html
<div class="
  relative z-10 bg-white/5 backdrop-blur-md
  border border-white/10 rounded-2xl p-8
  w-full max-w-md shadow-lg
">
```

Auth inputs: `bg-black border border-white/20 rounded-md p-2`

### 5.7 Sidebar (desktop history)

```html
<aside class="
  w-64 hidden md:block
  bg-white/5 border-r border-white/10
  p-4 pt-28 overflow-y-auto backdrop-blur-md
">
```

### 5.8 Score badge

```html
<span class="bg-purple-700 text-white text-xs px-2 py-0.5 rounded-full">
  Score: 8/10
</span>
```

### 5.9 Mobile FAB

```html
<button class="
  bg-purple-600 hover:bg-purple-700 text-white
  px-6 py-3 rounded-full shadow-lg
  fixed bottom-4 right-4 z-20
">
  View History
</button>
```

### 5.10 Modal (mobile history)

```html
<!-- overlay -->
<div class="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
  <!-- panel -->
  <div class="bg-zinc-900 border border-zinc-700 text-white rounded-lg shadow-xl w-full max-w-md max-h-[80vh] overflow-y-auto">
```

**Spring motion:** `stiffness: 300`, `damping: 30`, `y: 50→0`

---

## 6. Motion (Framer Motion)

| Pattern | Values |
|---------|--------|
| **Page title enter** | `opacity 0→1`, `y -20→0`, `duration 0.5` |
| **Feedback card enter** | `opacity 0→1`, `y 20→0`, `scale 0.95→1`, `duration 0.5`, `delay 0.3` |
| **Ambient orb loop** | `duration 20` (dashboard) / `25` (home), `repeat: Infinity`, `ease: easeInOut` |
| **Hero backdrop fade** | `opacity 0→0.78`, `delay 0.4`, `duration 1.5` |
| **Card inner pulse** | `opacity [0.26, 0.52, 0.26]`, `duration 4+i` |
| **Modal** | spring `stiffness 300`, `damping 30` |

**Dependency:** `framer-motion` ^12.x

---

## 7. UX Patterns

### 7.1 Dashboard flow

1. User lands on full-height black canvas with soft purple center glow + dot grid.
2. **Navbar** stays fixed; content scrolls beneath with top padding (`pt-24` mobile, `pt-32` desktop).
3. **Desktop:** left **History** sidebar (50-char preview); **Mobile:** FAB opens modal.
4. Center: H1 → subtitle → input + **Analyze** (Enter submits).
5. **Char limit:** 100 chars; counter turns **red** at >90.
6. On success: “You asked” line + **glass feedback card** animates in; auto-scroll to results.
7. Actions: copy 📋, **Try** (fills input), **Edit Prompt**, **Try New Prompt**.
8. Errors: red inline text (rate limit, network).

### 7.2 Spacing rhythm

| Token | Value |
|-------|--------|
| Page horizontal padding | `px-4 sm:px-6` |
| Main vertical padding | `py-10` |
| Below navbar | `pt-24 md:pt-32` |
| Title → subtitle | `mt-2 mb-8` |
| Input block max width | `max-w-xl` |
| Feedback card max width | `max-w-2xl` |
| Section gaps in lists | `space-y-1` / `space-y-2` / `space-y-4` |

### 7.3 Accessibility notes

- Inputs use visible borders (`border-white/20`), not borderless-only.
- Focus: shadcn buttons use `focus-visible:ring-ring/50` — on custom inputs add `focus:ring-2 focus:ring-purple-500` if building new forms.
- Contrast: purple-400 on black passes for large text; keep body at gray-300+ for long copy.

### 7.4 Responsive breakpoints

| Breakpoint | Behavior |
|------------|----------|
| `< md` | Hide sidebar; show FAB + modal |
| `≥ md` | Sidebar `w-64`; row layout for input + button (`sm:flex-row`) |

---

## 8. Full Page Template (Dashboard parity)

Paste into a React + Tailwind + Framer Motion app:

```tsx
export function PromptGuruDashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="h-screen bg-black text-white relative overflow-hidden font-sans antialiased">
      {/* Ambient orb */}
      <motion.div
        className="absolute z-0 w-[600px] h-[600px] bg-purple-700/30 blur-[180px] rounded-full"
        animate={{ x: [0, 30, -30, 0], y: [0, -20, 20, 0], scale: [1, 1.05, 1, 0.98, 1] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
        style={{ top: '50%', left: '50%', translateX: '-50%', translateY: '-50%' }}
      />
      {/* Dot grid */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="w-full h-full bg-[radial-gradient(#ffffff0f_1px,transparent_1px)] [background-size:20px_20px]" />
      </div>
      <div className="relative z-10">{children}</div>
    </main>
  )
}
```

---

## 9. AI Reproduction Prompt (copy anywhere)

```
Design a PromptGuru-style UI:

- Background: pure black #000 with a 20px dot grid (white dots at 6% opacity).
- Center: large soft purple ambient orb (600px, purple-700 at 30% opacity, blur 180px) slowly drifting via animation.
- Typography: Inter 400/600/700, white headings, gray-400 subtitles, gray-300 body.
- Components: glass panels — bg white 5%, border white 10%, backdrop-blur-md, rounded-xl.
- Primary buttons: purple-600 #9333ea, hover purple-700; white text.
- Accents: purple-400 for labels and links; score badges purple-700 pill.
- Glow: box-shadows and radial gradients using rgba(168,85,247,0.26-0.52) and rgba(139,92,246,0.13-0.39).
- Navbar: floating pill, top center, glass white/5, border white/10, rounded-full.
- Motion: subtle framer-motion fades (0.5s) and infinite orb drift (20s easeInOut).
- Mood: premium dark SaaS for AI prompt engineering — not flat, not neon cyberpunk; soft purple bloom.
```

---

## 10. Dependencies Checklist

| Package | Purpose |
|---------|---------|
| `tailwindcss` ^4 | Utility styling |
| `framer-motion` ^12 | Orbs, cards, navbar, modals |
| `next/font` Geist | Optional app shell |
| Google Fonts Inter | Dashboard/marketing type |
| `@radix-ui/react-slot` + `cva` | shadcn Button primitive |

---

## 11. Shared shell component

Use `PromptGuruShell` for any page that should match dashboard / leaderboard:

```tsx
import PromptGuruShell from '@/components/PromptGuruShell'

export default function MyPage() {
  return (
    <PromptGuruShell>
      <Navbar />
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pt-24 md:pt-32">…</section>
    </PromptGuruShell>
  )
}
```

Used by: `battle/page.tsx`, `battle/[roomCode]/page.tsx`, and mirrored manually on `leaderboard/page.tsx`.

---

## 12. File Reference Map

| Asset | Path |
|-------|------|
| Reusable page shell | `src/components/PromptGuruShell.tsx` |
| Dashboard UI | `src/app/dashboard/page.tsx` |
| Landing (full glow spec) | `src/app/page.tsx` |
| Global neon CSS | `src/app/globals.css` |
| Navbar | `src/components/Navbar.tsx` |
| Button primitive | `src/components/button.tsx` |
| Tailwind extend | `tailwind.config.ts` |

---

*Last synced from codebase: May 2026*
