# Public home page override

This page restores the stronger composition of the legacy SA Hall homepage without replacing the Material 3 system in `../MASTER.md`.

## Preserved legacy characteristics

- Full-width photographic venue hero with Arabic headline and a search panel.
- Prominent venue discovery, featured venue cards, service categories, and a simple booking journey.
- Warm, premium event-marketplace tone with restrained plum and gold cues.

## Current-system constraints

- Continue using the violet Material 3 semantic tokens and accessible focus treatment.
- Use zero elevation; separate content with tone, whitespace, and outline roles instead of shadows.
- Keep radii at the documented Material sizes and all interactive targets at least 48 px.
- Demo records must be visibly identified as demo data until the production catalogue is connected.
- Assets must be bundled locally. The hall photography is served as responsive WebP crops from
  `public/images/` (a portrait crop for phones, landscape for wider screens) and contains no remote dependency.
- On phones the photo covers the top of the hero and the search card straddles its lower edge, as in
  native booking apps; featured halls become a horizontally swipeable rail.
- The home search uses outlined text fields around native `select` and `date` controls so phones open
  their system pickers and the first screen stays light; the full Material date picker is reserved for
  checkout, where booked dates must be disabled.

## Halls and services catalog

- Wide windows: a floating filter sidebar on the inline-start side (right in Arabic), sticky under the
  app bar on a `surface-container-low` panel with an extra-large radius; it scrolls internally when
  taller than the viewport.
- Phones: a tonal "تصفية" trigger with an active-filter count opens a Material 3 modal side sheet from
  the same side, with a scrim, focus trapping, Escape to close, page scroll lock, focus returned to the
  trigger, and a sticky "show N results" action.
- Filters (search, city, availability date, guests, maximum nightly price, instant booking; category
  for services) live in the URL so results are shareable, and applied filters appear as removable chips.
