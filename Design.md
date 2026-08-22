# QTexPro Design System & UI Guidelines

This document serves as the official design specification for the QTexPro platform. Any new applications, modules, or UI components built for the QTexPro ecosystem MUST strictly adhere to these design guidelines to maintain visual consistency, premium aesthetics, and responsive layout structures.

---

## 1. Color Palette

The QTexPro aesthetic relies on a premium blend of deep maritime blues, warm creams/coffees, and muted earthy tones for data representation. Avoid using default Tailwind colors (e.g., standard `blue-500` or `red-500`) in favor of these specific hex codes.

### Core Brand Colors (tailwind.config.js)

- **Brand Dark**: `#0A2947` (Deep Navy)
- **Brand Cream**: `#F3E4C9` (Soft Cream)
- **Brand Sage**: `#D3D4C0` (Muted Green/Grey)
- **Brand Brown**: `#8B5E3C` (Rich Earth)
- **Brand Peach**: `#FFE5BF` (Highlight Peach)

### Backgrounds & Surfaces

- **App Background**: `bg-slate-50` (Very light grey for the main app canvas)
- **Card Surface**: `bg-white` (Pure white for primary data cards)
- **Hover/Interactive Surface**: `bg-[#FEFCF9]` or `bg-[#FAFAF8]` (Warm off-white for table rows and buttons)
- **Sidebar Background**: `bg-[#06202B]` (Very dark blue/teal for sidebar canvas)

### Text & Typography Colors

- **Primary Text (Headings & Values)**: `text-[#221912]` (Dark Espresso)
- **Secondary Text (Subtitles & Labels)**: `text-[#8C7E6E]` (Muted Taupe/Brown)
- **Tertiary Text (General UI)**: `text-[#475569]` (Slate-600)

### Borders & Dividers

- **Primary Borders**: `border-[#E6DDCE]` (Soft beige for card outlines)
- **Secondary/Divider Borders**: `border-[#F0EAE0]` (Lighter beige for table dividers)
- **Hover Borders**: `border-[#C5B9A8]` (Darker beige for interactive elements)

### Status Indicators

- **Success / Pass**: Text `text-[#77876F]` with Background `bg-[#F3F5F2]`
- **Error / Fail**: Text `text-[#C0462B]` with Background `bg-[#FDF2F0]`
- **Warning / Pending**: Text `text-[#8C7E6E]` with Background `bg-[#F6F1E8]`
- **Active Selection Accent**: `bg-[#B48259]` / `text-[#B48259]` (Copper/Gold)

---

## 2. Typography & Spacing

QTexPro relies heavily on precise text sizing and spacing rather than generic Tailwind spacing classes to achieve a data-dense yet clean layout.

- **Primary Headings**: `text-[17px] font-bold text-[#221912]`
- **Card Titles**: `text-[14px] font-bold text-[#221912]`
- **Subtitles**: `text-[12px] font-medium text-[#8C7E6E]`
- **Table/Data Rows**: `text-[12.5px] font-medium` or `font-semibold`
- **Micro Labels**: `text-[10px] font-bold uppercase tracking-widest text-[#B48259]`

---

## 3. Core Components

When instructing an AI to build components, provide these exact Tailwind class strings to ensure they match the existing components.

### 3.1 Section Cards (Main Dashboard Containers)

Cards should feel elevated but subtle, with a specific box-shadow and rounded corners.

```tsx
<div className="rounded-2xl border border-[#E6DDCE] bg-white shadow-[0_1px_3px_rgba(34,25,18,0.05)]">
  {/* Card Header */}
  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#F0EAE0] px-5 py-4">
    <div>
      <h2 className="text-[14px] font-bold text-[#221912]">Card Title</h2>
      <p className="mt-0.5 text-[12px] font-medium text-[#8C7E6E]">
        Card Subtitle
      </p>
    </div>
    {/* Actions go here */}
  </div>
  {/* Card Body */}
  <div className="p-5">{/* Content */}</div>
</div>
```

### 3.2 Slicers & Dropdown Buttons

Standard UI buttons used for filtering and actions.

```tsx
<button className="flex h-9 items-center gap-2 rounded-xl border border-[#E6DDCE] bg-white px-3.5 text-[12.5px] font-semibold text-[#475569] transition-colors hover:border-[#C5B9A8] hover:bg-[#FEFCF9]">
  Button Text
</button>

// Active State
<button className="flex h-9 items-center gap-2 rounded-xl border border-[#B48259] bg-[#B48259]/10 px-3.5 text-[12.5px] font-semibold text-[#B48259] transition-colors">
  Active Button
</button>
```

### 3.3 Status Badges

Used for indicating Pass/Fail, Severity, or progress.

```tsx
// Pass Badge
<span className="rounded-full bg-[#F3F5F2] px-2.5 py-0.5 text-[10.5px] font-bold text-[#77876F]">
  PASS
</span>

// Fail Badge
<span className="rounded-full bg-[#FDF2F0] px-2.5 py-0.5 text-[10.5px] font-bold text-[#C0462B]">
  FAIL
</span>
```

### 3.4 Modals (Drill-downs & Overlays)

Modals use a backdrop blur and heavier shadows.

```tsx
{
  /* Backdrop */
}
<div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
  {/* Modal Container */}
  <div className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
    {/* Header */}
    <div className="flex items-center justify-between border-b border-[#E6DDCE] px-6 py-5">
      {/* Title */}
    </div>
    {/* Scrollable Body */}
    <div className="divide-y divide-[#F0EAE0] overflow-y-auto">
      {/* List items */}
    </div>
  </div>
</div>;
```

---

## 4. Responsive Layout Grids

Always use breakpoint-driven grids rather than forcing columns. This prevents the UI from breaking on tablets or small laptops.

- **4-Column Data (KPIs)**:
  `className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5"`
- **3-Column Data (Charts)**:
  `className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"`
- **2-Column Data (Side-by-side tables)**:
  `className="grid grid-cols-1 lg:grid-cols-2 gap-6"`

- **Flex Wrapping**: For headers or filter bars containing multiple buttons, always use `flex-wrap` and `gap-3` or `gap-4`:
  `className="flex flex-wrap items-center gap-4"`

---

## 5. UI Micro-interactions (Animations)

The system uses subtle interactions to make the UI feel alive:

- Standard CSS transition on buttons: `transition-colors duration-200`
- Custom Scrollbar: Apply `custom-scrollbar` class to overflowing containers.
- Float animation (defined in `index.css`): `animate-[float_6s_ease-in-out_infinite]` for decorative elements.
