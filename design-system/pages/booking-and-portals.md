# Booking and portal page overrides

These screens restore the information architecture documented by the legacy React application while inheriting every token and accessibility rule from `../MASTER.md`.

## Public booking journey

- Catalog → hall details → date and package → services → contact details → review and payment → client tracking.
- Always expose the current step, a predictable back action, a complete price breakdown, and payment-state language.
- Demo actions must state that they do not create a real booking or charge.

## Client portal

- Primary destinations are bookings, store orders, and profile.
- Booking records expose confirmation state, payment progress, remaining balance, and the next action.

## Hall-owner portal

- Preserve legacy navigation: overview, calendar, bookings, halls, services, accounting, clients, and organization settings.
- Operational tables prioritize status, date, customer, payment, and a clear row action.

## Administration portal

- Preserve legacy navigation: overview, requests, halls, services, subscribers, accounting, content, and system settings.
- Approval states must use both text and color. Destructive or approval actions remain explicit.

## Responsive behavior

- At 840 px and wider, the owner and admin panels use a persistent right-side (RTL) navigation drawer.
- Below 840 px, a bottom navigation bar shows four primary destinations plus "More", which opens the
  drawer as a modal surface; it closes automatically after navigation.
- Data tables (`mat-table`) render on wide windows; phones get purpose-built lists with the same data,
  and booking details open as a full-screen dialog.
- Tables may scroll inside their own bounded container; the page itself must not scroll horizontally.

## Data consistency

- Every panel reads the same records: a booking created at checkout appears in the client's bookings,
  the owner's queue and calendar, and the admin totals. Totals, VAT, deposits, fees and balances are
  derived from booking lines (`core/domain/pricing.ts`), never typed as display strings.
