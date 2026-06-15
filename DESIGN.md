# Design System

> All components must follow this system exactly. No custom colors outside this palette.

---

## Color Palette

```css
/* Primary — Green */
--green-900: #0d3d22;
--green-800: #145a32;
--green-700: #1a6b3c;   /* Primary brand color */
--green-600: #1e8449;
--green-500: #27ae60;
--green-400: #2ecc71;
--green-100: #d5f5e3;
--green-50:  #eafaf1;

/* Neutrals */
--gray-900: #111827;    /* Primary text */
--gray-700: #374151;    /* Secondary text */
--gray-500: #6b7280;    /* Muted text / labels */
--gray-300: #d1d5db;    /* Borders */
--gray-100: #f3f4f6;    /* Backgrounds */
--gray-50:  #f9fafb;    /* Card backgrounds */
--white:    #ffffff;

/* Semantic */
--red:      #ef4444;    /* Loss / Danger / SELL */
--orange:   #f97316;    /* Warning */
--blue:     #3b82f6;    /* Info / Active/Live */
--yellow:   #eab308;    /* Pending */
```

---

## Typography

Font: **Inter** (Google Fonts)

| Use | Size | Weight | Class |
|---|---|---|---|
| Page title | 26px | 800 | `text-2xl font-extrabold tracking-tight` |
| Card title | 15px | 700 | `text-sm font-bold` |
| Body | 14px | 400 | `text-sm` |
| Label / muted | 12px | 500 | `text-xs font-medium text-gray-500` |
| Section header | 10px | 600 | `text-[10px] font-semibold uppercase tracking-widest` |
| Stat number | 30px | 800 | `text-3xl font-extrabold tracking-tight` |
| Badge | 10.5px | 700 | `text-[10.5px] font-bold` |

---

## Spacing System

Use Tailwind's default spacing scale. Key values:
- Page padding: `p-7` (28px)
- Card padding: `p-5` (20px)
- Card gap: `gap-4` (16px)
- Sidebar width: `w-60` (240px)
- Topbar height: `h-16` (64px)

---

## Border Radius

| Element | Radius |
|---|---|
| Cards | `rounded-2xl` (16px) |
| Buttons | `rounded-xl` (12px) |
| Badges | `rounded-full` |
| Inputs | `rounded-xl` (12px) |
| Nav items | `rounded-xl` (10px) |
| Small elements | `rounded-lg` (8px) |

---

## Component Patterns

### Stat Card (Featured — dark green)
```
bg: linear-gradient(135deg, green-800, green-600)
text: white
border: none
```

### Stat Card (Regular)
```
bg: white
border: 1px solid gray-100
hover: shadow-md (4px 20px rgba(0,0,0,0.06))
```

### Buttons
```
Primary:  bg-green-700 text-white hover:bg-green-800 rounded-xl px-4 py-2.5 font-semibold
Outline:  bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl
Danger:   bg-red-50 text-red-600 border border-red-200 hover:bg-red-100
```

### Badges
```
WIN:     bg-green-50  text-green-700
LOSS:    bg-red-50    text-red-600
LIVE:    bg-blue-50   text-blue-600
PENDING: bg-yellow-50 text-yellow-700
BUY:     bg-green-50  text-green-700
SELL:    bg-red-50    text-red-600
ACTIVE:  bg-green-50  text-green-700
EXPIRED: bg-gray-100  text-gray-500
```

### Sidebar Active Nav Item
```
bg: green-50
text: green-700
font-weight: 600
left border: 4px solid green-700 (positioned absolutely, -10px from card edge)
```

### Signal Direction Indicator
```
BUY:  green arrow up, bg-green-50
SELL: red arrow down, bg-red-50
```

### Live Dot (pulsing)
```css
@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50%       { opacity: 0.5; transform: scale(1.3); }
}
.live-dot {
  width: 8px; height: 8px;
  background: #4caf50;
  border-radius: 50%;
  animation: pulse 1.5s infinite;
}
```

---

## shadcn/ui Components to Install

Run these after `npx shadcn@latest init`:

```bash
npx shadcn@latest add button
npx shadcn@latest add input
npx shadcn@latest add label
npx shadcn@latest add card
npx shadcn@latest add badge
npx shadcn@latest add dialog
npx shadcn@latest add dropdown-menu
npx shadcn@latest add select
npx shadcn@latest add tabs
npx shadcn@latest add table
npx shadcn@latest add form
npx shadcn@latest add textarea
npx shadcn@latest add separator
npx shadcn@latest add avatar
npx shadcn@latest add progress
npx shadcn@latest add skeleton
npx shadcn@latest add toast
npx shadcn@latest add alert
npx shadcn@latest add alert-dialog
npx shadcn@latest add sheet
npx shadcn@latest add popover
npx shadcn@latest add tooltip
npx shadcn@latest add switch
npx shadcn@latest add radio-group
npx shadcn@latest add checkbox
```

shadcn init config:
```
Style: Default
Base color: Slate (we override with our green)
CSS variables: Yes
```

After init, update `src/app/globals.css` to inject our green palette into CSS variables.

---

## Layout Dimensions

```
Sidebar:      240px fixed left
Topbar:       64px fixed top
Content area: calc(100vw - 240px), padding 28px all sides
Main grid:    4-col stat cards | 2-col middle | 3-col bottom
```

---

## Responsive Breakpoints (Tailwind defaults)

| Breakpoint | Width | Behavior |
|---|---|---|
| sm | 640px | Stack stat cards 2-col |
| md | 768px | Sidebar collapses to icons |
| lg | 1024px | Full layout |
| xl | 1280px | Comfortable desktop |
| 2xl | 1536px | Wide desktop, max-width content |

**Mobile-first**: sidebar becomes a bottom sheet on mobile. Admin area is desktop-only (min-width: 1024px).

---

## Icons

Use **Lucide React** (`lucide-react`) throughout. No other icon library.

Key icons used:
```
LayoutDashboard, TrendingUp, Wallet, ArrowDownToLine,
ArrowUpFromLine, ArrowLeftRight, Receipt, Star,
Users, Settings, HelpCircle, LogOut, Bell, Mail,
Shield, ChevronRight, Plus, MoreHorizontal,
CheckCircle2, XCircle, Clock, AlertCircle,
ArrowUpRight, Megaphone, BarChart3, FileText
```

---

## Chart Library

Use **Recharts** for all charts.

Charts needed:
| Chart | Type | Location |
|---|---|---|
| Signal performance (wins/losses per day) | BarChart | User Dashboard |
| Win rate breakdown | PieChart (donut) | User Dashboard |
| Revenue over time | AreaChart | Admin Analytics |
| User growth | LineChart | Admin Analytics |
| Signal win rate history | BarChart | Admin Analytics |
| Commission earnings per month | BarChart | User Commissions |

Chart colors: always use green-600 for positive, red-400 for negative, gray-200 for neutral.
