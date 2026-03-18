# FlowForge Design System — "The Forge"

## Aesthetic Direction
Industrial precision meets digital craftsmanship. The "forge" metaphor: dark cooled-steel surfaces with warm amber/copper ember accents.

## Typography
- **Display** (headings, branding): Syne — geometric, bold, industrial. Class: `font-display`
- **Body** (UI text): Outfit — clean, modern geometric sans. Class: `font-sans` (default)
- **Code/Data**: JetBrains Mono. Class: `font-mono`
- NEVER use Space Grotesk, Inter, Roboto, or Arial

## Color Palette
- Surfaces: `--surface-0` (#09090b), `--surface-1` (#0f0f12), `--surface-2` (#18181b), `--surface-3` (#27272a)
- Borders: `--border` (#2e2e33), `--border-subtle` (#23232a)
- Forge accent: `--forge` (#f97316), `--forge-dim` (#ea580c), `--ember` (#fbbf24)
- Text: `--text-primary` (#fafafa), `--text-secondary` (#a1a1aa), `--text-muted` (#71717a)
- Use Tailwind `zinc-*` scale (NOT `slate-*`)

## Key CSS Classes
- `.btn-forge` — gradient button (orange → red) with glow shadow
- `.forge-glow` / `.forge-glow-strong` — ember glow box-shadows
- `.surface-raised` / `.surface-inset` — panel styles
- `.noise-bg` — subtle noise texture overlay (on body)
- `.stagger-children` — cascading fade-up animation for lists/grids

## Animations
- `animate-ember-pulse` — pulsing opacity for status dots
- `animate-fade-up` — entrance animation for elements
- `animate-glow` — alternating glow for the chat bubble

## Label/Heading Convention
Labels use: `text-[10px] font-display font-bold tracking-wider uppercase text-zinc-500`
