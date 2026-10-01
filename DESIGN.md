---
name: Ridgeway CRM
description: A calm, precise workspace for a kitchen, bathroom and bedroom fitting business — and the customer touchpoints that come out of it.
colors:
  brass-fitting: "#D98A2E"
  limewash: "#F2EDE3"
  porcelain: "#FFFDF9"
  wrought-iron: "#17181A"
  walnut-ink: "#1C1B18"
  grout-grey: "#85806F"
  oat-hairline: "#E7E0D1"
  deep-slate: "#10151C"
  status-new: "#6E88A6"
  status-booked: "#5D96A0"
  status-quoted: "#4CA399"
  status-lost: "#626C7A"
  terracotta-alert: "#C0524A"
  putty: "#D9D3C7"
  warm-taupe: "#B3AB9B"
typography:
  display:
    fontFamily: "Outfit, system-ui, sans-serif"
    fontSize: "36px"
    fontWeight: 700
    lineHeight: 1
    fontFeature: "tnum"
  headline:
    fontFamily: "Outfit, system-ui, sans-serif"
    fontSize: "24px"
    fontWeight: 700
    lineHeight: "32px"
  title:
    fontFamily: "Outfit, system-ui, sans-serif"
    fontSize: "18px"
    fontWeight: 700
    lineHeight: "28px"
  body:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: "20px"
  label:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: "16px"
rounded:
  none: "0px"
  customer-sm: "6px"
  customer-md: "8px"
  customer-lg: "12px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  2xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.brass-fitting}"
    textColor: "{colors.deep-slate}"
    typography: "{typography.body}"
    rounded: "{rounded.none}"
    padding: "8px 16px"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.walnut-ink}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "6px 12px"
  card:
    backgroundColor: "{colors.porcelain}"
    rounded: "{rounded.none}"
    padding: "24px"
  input:
    backgroundColor: "{colors.limewash}"
    textColor: "{colors.walnut-ink}"
    typography: "{typography.body}"
    rounded: "{rounded.none}"
    padding: "8px 12px"
  nav-item:
    backgroundColor: "{colors.wrought-iron}"
    typography: "{typography.body}"
    rounded: "{rounded.none}"
    padding: "8px 12px"
  customer-input:
    backgroundColor: "#FFFFFF"
    textColor: "{colors.walnut-ink}"
    rounded: "{rounded.customer-md}"
    padding: "11px 14px"
    height: "48px"
  customer-button-primary:
    backgroundColor: "{colors.brass-fitting}"
    textColor: "{colors.deep-slate}"
    rounded: "{rounded.customer-md}"
    height: "52px"
    width: "100%"
  email-button-primary:
    backgroundColor: "{colors.brass-fitting}"
    textColor: "{colors.wrought-iron}"
    rounded: "{rounded.customer-sm}"
    padding: "14px 24px"
---

# Design System: Ridgeway CRM

## Overview

**Creative North Star: "The Showroom Counter"**

This is the desk where a client signs off their new kitchen: calm, orderly, quietly crafted. Everything on it is there for a reason, laid out square, and finished well enough that nobody notices the finish, only the confidence. The system borrows the materials of the showroom itself: a limewash wall behind, a porcelain surface in front, wrought-iron fixtures, and a single brass fitting that catches the eye.

The staff app is an Operate surface first. Density is moderate, numbers lead, and colour is rationed so it keeps its meaning: the brass accent appears only where something needs doing or can be done. Depth comes from tone and hairline joins, never from shadow. The feel is quiet and precise — restrained, exactly aligned, with colour only where it carries information.

Customer-facing surfaces (the embeddable booking widget, emails, public pages) speak the same material language with gentler hands: rounded corners, larger touch targets, and an amber focus ring, because customers are on their phones and not doing this every day. The old dark "navy canvas" palette on the public booking and quote pages is retired.

**Key Characteristics:**
- Warm neutral ground (limewash) with porcelain cards and wrought-iron navigation
- One accent, brass, used sparingly and always meaningfully
- Flat: hairline borders and tonal steps, no shadows, no gradients
- Square corners in the staff app; gentle 6–12px rounding only on customer-facing surfaces
- Outfit Bold for titles and hero numbers, Inter for everything you read or act on

## Colors

A warm, near-monochrome material palette — plaster, porcelain, walnut and iron — with a single brass accent and a small set of muted pipeline colours.

### Primary
- **Brass Fitting** (`brass-fitting`): the only accent. Primary buttons, the active sidebar item's left edge and tint, overdue/unread markers, selected slots, focus rings on customer surfaces, and the email brand bar. The dashboard's large "needs follow-up" numeral is the one sanctioned use as text (see The Brass Rule). Also doubles as the "Won" status colour — winning a job is the brass moment.

### Neutral
- **Limewash** (`limewash`): the page ground behind everything in the staff app, and the recessed fill of staff inputs.
- **Porcelain** (`porcelain`): cards, tables, panels and dropdowns — every surface that sits on the limewash.
- **Wrought Iron** (`wrought-iron`): the sidebar — the only dark surface in the system — and the text on brass email buttons.
- **Walnut Ink** (`walnut-ink`): primary text, headings, numbers and active tab underlines.
- **Grout Grey** (`grout-grey`): secondary text — subtitles, field labels, table headers, timestamps, hints.
- **Oat Hairline** (`oat-hairline`): every border and divider; at ~30% opacity it is also the row hover wash.
- **Deep Slate** (`deep-slate`): text on brass in the app and widget. Brass always carries dark text, never white: white on brass is 2.75:1 and fails WCAG AA, while Deep Slate reaches 6.65:1 and Wrought Iron (used in emails) 6.45:1.

### Pipeline status
Muted, desaturated markers that never compete with brass:
- **Slate Blue** (`status-new`): New.
- **Tile Teal** (`status-booked`): Quote booked; also the install marker on the dashboard schedule.
- **Sage Glaze** (`status-quoted`): Quoted.
- **Brass Fitting**: Won.
- **Pewter** (`status-lost`): Lost.

### Utility
- **Terracotta Alert** (`terracotta-alert`): validation errors and failed actions only. Not a brand colour.
- **Putty** (`putty`) / **Warm Taupe** (`warm-taupe`): customer-facing input borders at rest / on hover (embed widget).

### Named Rules
**The Brass Rule.** Brass means "act here". If an element isn't the primary action, an unread/overdue signal, or the current selection, it isn't brass. Decorative brass is a bug. Brass is for fills, borders, markers and focus rings. Brass as text is allowed only at large bold sizes (24px+ Outfit 700), never for body text or labels on cream: it measures 2.71:1 on Porcelain and 2.36:1 on Limewash, below even WCAG's 3:1 large-text minimum. So large brass text is an accepted exception, allowed only where an adjacent Walnut Ink or Grout Grey label carries the same meaning (as "Needs follow-up" does beneath its numeral).

**The Retired Night Rule.** The old dark palette (navy canvas `#10151C`, surface `#171E29`, light ink `#E8ECF1`) still styles the public `/book` and `/q/[token]` pages and legacy tokens in `app/globals.css`. It is retired: never use it in new work, and move those pages onto limewash/porcelain when they are next touched. `deep-slate` survives only as text-on-brass.

## Typography

**Display Font:** Outfit (with system-ui, sans-serif)
**Body Font:** Inter (with system-ui, sans-serif)
**Email Font:** Helvetica, Arial, sans-serif (web fonts don't load reliably in mail clients)

**Character:** A confident geometric bold for the things you glance at — page titles and the numbers that matter — paired with a neutral, highly legible sans for the things you read and act on. Outfit is loaded at weight 700 only; it is always bold.

### Hierarchy
- **Display** (Outfit 700, 36px, line-height 1, tabular figures): hero stat numbers on the dashboard, with a small grey label tight beneath (4px gap). Tabular figures keep columns of numbers aligned.
- **Headline** (Outfit 700, 24px, 32px): page titles — "Dashboard", "Leads", "Settings". Followed by a 14px grey subtitle.
- **Title** (Outfit 700, 18px, 28px): section headings inside a page ("Quotes", "Contact history", "By campaign").
- **Body** (Inter 400, 14px, 20px): everything operational — table cells, list rows, form values, buttons, nav items.
- **Label** (Inter 400, 12px, 16px): hints under fields, timestamps, compact buttons, error text in the staff app.

Table headers use Outfit 700 at body size (14px) in Grout Grey. Customer-facing forms step up to 16px inputs and 15px/500 labels so iOS doesn't zoom and labels read as primary text.

### Named Rules
**The Two-Voice Rule.** Outfit is for titles and hero numbers; Inter is for everything else. Never set a paragraph, form value or button label in Outfit, and never set a page title in Inter.

## Layout

The staff app is a fixed 240px wrought-iron sidebar beside a limewash content column. Pages sit in a centred column with 32px padding, capped by purpose: 672px for forms and settings, 768px for single records (a quote, the calendar), 1152px for tables and dashboards. The dashboard uses a two-column card grid (one column on narrow screens) with 24px gaps.

Spacing is a strict 4px-multiple scale (4, 8, 12, 16, 24, 32). Cards carry 24px internal padding; list rows 8px vertical; table cells 12px × 16px. Title blocks sit 32px above the content they introduce.

The customer booking widget is mobile-first: single column under 480px of container width (it responds to its container, not the viewport), two-column name and phone/email pairs above that, capped at 560px.

## Elevation & Depth

The system is flat. There are no shadows anywhere — not on cards, dropdowns, popovers or buttons. Depth comes from two tones (porcelain surfaces on limewash ground) and 1px Oat Hairline joins. Interactive feedback is tonal: rows and nav items gain a faint wash on hover rather than lifting.

### Named Rules
**The Hairline Rule.** Separation is a 1px Oat Hairline border or a tonal step, never a shadow or a gradient. If two surfaces need more separation than a hairline gives, the layout is wrong.

## Shapes

The staff app is square: every card, button, input, tab, table and marker has sharp 0px corners, reinforcing the precise, cabinet-maker feel. Small solid squares (6–8px) mark status and urgency instead of dots or pills.

Customer-facing surfaces soften deliberately: the embed widget card at 12px, its inputs, cards and buttons at 8px, and email buttons at 6px. Circles appear only for icons (the email success tick).

## Components

### Buttons
Quiet and precise; one clear primary per view.
- **Shape:** square in the staff app (0px); 8px in the embed widget; 6px in emails.
- **Primary:** Brass Fitting fill with Deep Slate text, 14px, 8px × 16px padding. Used for "+ Add customer", "Save changes", "Save spend".
- **Hover:** brass at 90% opacity, 150ms colour transition. Disabled: 50% opacity.
- **Secondary:** transparent with a 1px Oat Hairline border and Walnut Ink text, 12px, 6px × 12px. The border darkens to Walnut Ink on hover ("Download PDF", "Send reminder now", "Log contact").
- **Customer primary:** full width, 52px tall, 16px/600 text, 8px corners.
- **Email:** Wrought Iron bold text on the brand colour, 14px × 24px, 6px corners. Because the brand colour is set per business, the template picks whichever of Wrought Iron or white contrasts more with it — Wrought Iron for brass and other light colours.

### Cards / Containers
- **Corner Style:** square (0px) in the staff app; 12px for the embed widget shell.
- **Background:** Porcelain on Limewash.
- **Shadow Strategy:** none — see Elevation & Depth.
- **Border:** 1px Oat Hairline.
- **Internal Padding:** 24px.

### Inputs / Fields
- **Style (staff):** 1px Oat Hairline border, Limewash fill, 14px Walnut Ink text, 8px × 12px padding, square corners. Labels sit 4px above in 14px Grout Grey.
- **Focus (staff):** the border darkens to Walnut Ink; no ring, no glow.
- **Style (customer):** white fill, 1px Putty border, 48px minimum height, 16px text, 8px corners; border turns Warm Taupe on hover.
- **Focus (customer):** Brass border plus a soft 3px brass ring (~28% opacity).
- **Error:** Terracotta Alert border and message beneath, shown on blur or submit — never while typing.

### Navigation
- **Sidebar:** 240px Wrought Iron column; company name in Outfit at the top, then icon + label items in 14px Inter.
- **Default:** white at 55% opacity. **Hover:** white at 85% with a 5% white wash.
- **Active:** a 2px brass left edge with a 15% brass tint and full-white text. Disabled items ("Quotes") sit at 25% white.
- **Icons:** 20px line icons at 2px stroke, rounded caps and joins.

### Status Badge
An 8px solid square in the status colour, then the status name in Walnut Ink. Overdue customers get a 6px brass square before their name.

### Tables and Lists
Porcelain container with a hairline border; Outfit headers in Grout Grey; rows divided by hairlines with a 30% Oat Hairline hover wash. Numeric columns are right-aligned with tabular figures.

### Stat Tile (signature)
The dashboard's number-first card: a 36px Outfit numeral in Walnut Ink — or Brass Fitting when it demands action — with a 14px Grout Grey label 4px beneath, then a hairline-divided list of the items it counts.

### Tabs
Text-only 14px tabs over a hairline rule; the active tab takes a 2px Walnut Ink underline and Walnut Ink text, inactive tabs are Grout Grey.

### Emails
Limewash-toned outer ground (`#F4F1EA`), a centred 600px white card with a 1px `#E6E1D6` border and a 3px brand-colour bar across the top, 32px padding, a labelled detail block (grey labels left, bold values right), at most one button, and a 13px grey footer.

## Do's and Don'ts

### Do:
- **Do** put new staff screens on Limewash with Porcelain cards and 1px Oat Hairline borders.
- **Do** keep brass to primary actions, current selection and urgent counts (The Brass Rule).
- **Do** lead dashboards and summaries with a 36px Outfit number and a small grey label.
- **Do** use the 4px spacing scale: 24px card padding, 24px card gaps, 32px page padding.
- **Do** use tabular figures and right alignment for money and counts in tables.
- **Do** round corners (6–12px) and enlarge touch targets only on customer-facing surfaces.

### Don't:
- **Don't** add shadows, glows or gradients anywhere (The Hairline Rule).
- **Don't** use the retired dark navy palette in new work (The Retired Night Rule).
- **Don't** put white text on brass anywhere; use Deep Slate in the app and widget, Wrought Iron in emails.
- **Don't** set small text or labels in brass; brass text is only for large bold numerals with a label beside them (The Brass Rule).
- **Don't** round corners in the staff app.
- **Don't** set body copy, buttons or form values in Outfit.
- **Don't** introduce a second accent colour; use the muted status colours for categories.
