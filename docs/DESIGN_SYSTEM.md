# DESIGN_SYSTEM

## Brand tokens (centralized)
Defined in `src/app/globals.css`:
- Midnight Navy `#021730`
- Royal Blue `#2563EB`
- Bright Blue `#3B82F6`
- Gold `#FFCC66`
- Teal `#0F766E`
- White `#FFFFFF`
- Background `#F5F7FB`
- Primary text `#111827`
- Secondary text `#64748B`
- Border `#E2E8F0`
- Success `#16A34A`, Warning `#D97706`, Error `#DC2626`

## Typography
- Inter via `next/font/google`
- Clear hierarchy for page titles, section headings, metadata, and control labels

## Shared primitives
- Button variants: `primary`, `secondary`, `ghost`, `danger`
- Input, Textarea, Select
- Card with consistent border/shadow/radius
- Badge with semantic tones

## Shared UX components
- PageHeader
- SearchInput
- EmptyState

## Interaction and accessibility standards
- Focus-visible outlines
- Keyboard-accessible carousel controls
- Responsive shell with desktop sidebar and mobile drawer + bottom nav
- Semantic labels on forms
- No autoplaying media with sound
- Explicit demo labels for non-production workflows

## Visual quality adjustments from audit
- Carousel now supports image-backed slides, improved contrast overlay, and swipe support
- Mobile navigation now includes discoverable “More” access pattern
- Placeholder media made local and stable to avoid broken imagery
