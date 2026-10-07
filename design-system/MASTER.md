# SA Hall Material 3 design system

This file is the source of truth for the Angular UI. Explicit product requirements override generic component defaults.

## Direction and language

- Arabic is default; set `lang="ar" dir="rtl"` on the document.
- Use logical CSS properties (`inline-start`, `inline-end`) and Angular CDK directionality.
- Isolate phone numbers, email, identifiers and technical values with `bdi` or scoped `dir="ltr"`.
- Do not mirror universally recognized playback/media or brand marks. Directional arrows use semantic start/end icons.

## Color roles

Seed violet: `#6750A4`.

```text
primary               #6750A4
on-primary            #FFFFFF
primary-container     #EADDFF
on-primary-container  #21005D
secondary             #625B71
secondary-container   #E8DEF8
surface               #FFFBFE
surface-container     #F3EDF7
surface-container-hi  #ECE6F0
on-surface            #1D1B20
on-surface-variant    #49454F
outline               #79747E
error                 #B3261E
on-error               #FFFFFF
```

Verify all actual token pairs with automated WCAG contrast tests. Normal text requires 4.5:1; large text and non-text UI indicators require at least 3:1. Color never acts as the only state indicator.

## Typography

- Self-host an Arabic/Latin variable font with `font-display: swap`; do not depend on Google Fonts at runtime.
- Body minimum: 16 px / 1.6 on mobile.
- Roles: display 40/48, headline 32/40 and 28/36, title 22/30 and 18/26, body 16/26 and 14/22, label 14/20 and 12/18.
- Use 600–700 weight for headings and 400–500 for body/labels. Avoid `font-black` as the default hierarchy mechanism.
- Use tabular figures for prices, dates, counts and tables.

## Shape, spacing and elevation

- 4 px base; common spacing: 8, 12, 16, 24, 32, 48.
- Component radii: 8 px compact, 12 px controls, 16 px containers, 28 px sheets/FAB where Material specifies it. Avoid arbitrary giant radii.
- Default elevation is zero. No box/drop shadows for ordinary cards, navigation or tables.
- Separate groups with surface tone, whitespace, headings and dividers only where information structure requires one.
- Desktop content max width is consistent per shell; operational pages prioritize useful density.

## Navigation

- Public: top app bar and clear page routes.
- Customer mobile: no more than five labeled top-level bottom destinations.
- Vendor/admin: drawer at compact widths, navigation rail/drawer at large widths; one hierarchy pattern at a time.
- Current destination has icon, label and active indicator. Destructive/logout actions are separated.
- Deep links preserve filters and identifiers; route changes focus the main heading.

## Components and data

- One primary action per view; secondary actions are visually subordinate.
- Data-heavy views use semantic tables, sticky headers only when helpful, sortable headers with `aria-sort`, pagination, filter summary and overflow action menus.
- On mobile, prioritize columns or use a purpose-built list; never force unreadable horizontal tables.
- Forms use visible labels, typed inputs, field-level Arabic error text, error summary for multi-error submissions and focus to the first invalid field.
- Destructive actions require clear confirmation; reversible removal offers undo where safe.
- Empty states explain what happened and the next useful action. Errors include recovery/retry.
- Loading under 300 ms does not flash; longer work uses reserved-space skeletons or progress.

## Interaction and accessibility

- Minimum target: 48 x 48 CSS px; minimum 8 px separation.
- Every icon-only button has an accessible Arabic name and tooltip where useful.
- Visible keyboard focus is never removed. Tab order follows reading order.
- Add a skip-to-content link and appropriate landmarks/headings.
- Snackbars use `aria-live="polite"`; blocking errors use appropriate alert semantics without stealing focus unexpectedly.
- Images have meaningful Arabic alternatives or empty alt when decorative; dimensions/aspect ratio reserve layout space.
- Support zoom and text growth without clipping at 200%.

## Motion

- State feedback: 150 ms; standard transitions: 200–250 ms; sheets/dialogs: up to 300 ms.
- Animate only opacity and transform; never animate layout dimensions for decoration.
- Motion communicates state/navigation and remains interruptible.
- Under `prefers-reduced-motion: reduce`, remove non-essential transition/animation and smooth scrolling.

## Prohibited patterns

- Box shadows/drop shadows, decorative borders, random gradients
- Card grids for ordinary table data
- Emoji as structural icons
- Placeholder-only labels, hidden focus, color-only statuses
- Remote placeholder/demo assets in production paths
- Decorative charts without a decision-making purpose and accessible table/summary
- Duplicated headings/descriptions or large empty hero spacing in operational views

## Responsive verification

Verify at minimum 375, 768, 1024 and 1440 CSS px, portrait and landscape where applicable. There must be no page-level horizontal scrolling, content behind fixed navigation, hover-only actions, or RTL regressions in menus/dialogs/pagination/date controls.
