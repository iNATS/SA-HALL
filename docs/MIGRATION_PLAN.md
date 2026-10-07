# SA Hall migration plan

## Strategy

Use a feature-by-feature strangler migration. The legacy React/Supabase application remains available while Angular and NestJS are introduced alongside it. Every slice captures current behavior, defines corrected behavior where the current implementation is unsafe or contradictory, imports compatible data, passes automated parity/security tests, and only then replaces its legacy route.

No production table is dropped and no identifier is regenerated during migration. Every data change has a forward migration, verification query and rollback/compensation procedure.

## Required cutover inputs

Before any production database migration:

1. Encrypted `pg_dump` of schema and data plus a Supabase policy/function/trigger catalog
2. Export of Auth identities and supported password/provider migration options
3. Storage object inventory and checksums
4. Row counts and referential-integrity report per table
5. Current environment/deployment inventory and provider credentials ownership
6. HyperPay transaction/webhook sample and reconciliation export
7. Sanitized production-scale dataset for rehearsal

## Milestones

### M0 — Baseline, containment and characterization

- Goal: make the current state reproducible and stop the most dangerous exposure.
- Affected: legacy source, payment/OTP paths, live RLS/config, CI, audit documents.
- Strategy: preserve behavior except disable unsafe payment/static OTP paths; record route/API/query behavior; capture production schema and data profiles.
- Risks: legacy production may depend on insecure flows; emergency containment may temporarily reduce functionality.
- Validation: `npm ci`, `npm run build`, dependency audit, policy catalog queries, manual smoke matrix, secret scan.
- Done when: all critical findings have an owner/containment, baseline build is reproducible, live schema is captured, and characterization tests cover public browse, auth, booking, vendor and admin smoke flows.

### M1 — Workspace and production foundation

- Goal: introduce Angular 22, NestJS 12, shared contracts, PostgreSQL migrations and Docker Compose without disrupting legacy runtime.
- Affected: `apps/web`, `apps/api`, `packages/contracts`, `infra/docker`, root scripts, CI.
- Strategy: scaffold strict standalone Angular and Nest modular monolith; add health/readiness, request IDs, structured errors/logging, config validation, PostgreSQL pool and migration runner.
- Risks: toolchain version drift; Compose health/start ordering; accidental coupling to local environment.
- Validation: clean install; frontend/backend lint, unit tests and builds; API health tests; `docker compose config`; clean-volume migration smoke test.
- Done when: a clean machine with Docker can start the new foundation and health checks pass; legacy remains independently runnable.

### M2 — Identity, sessions and authorization

- Goal: move authentication and all authorization decisions behind the API.
- Affected: Identity/Access/Profile modules, Angular auth routes/guards/interceptor, auth migration tooling.
- Strategy: map Supabase identities to preserved profile UUIDs; implement Argon2 password flow and provider-backed OTP; rotating sessions; role/ownership policies; admin re-authentication.
- Risks: password hashes may not be exportable; session invalidation and account-linking errors.
- Validation: unit tests for token/session rotation and OTP limits; integration matrix for anonymous/user/vendor/admin; E2E login/reset/logout; orphan/duplicate identity report.
- Done when: no client can select/mutate private profiles directly; every protected endpoint has positive and negative authorization tests; rollback login path is documented.

### M3 — Public content and catalog vertical slice

- Goal: serve the public homepage, halls/chalets/services, detail routes, categories, featured content and legal pages through Angular/Nest.
- Affected: Catalog/Content/Media API modules; public Angular shell and lazy routes.
- Strategy: introduce narrow DTOs and paginated search; safe CMS representation; deep-link routes; responsive Material 3 UI; image optimization.
- Risks: legacy schema/content inconsistencies and remote/broken media.
- Validation: contract tests; sanitization tests; route/deep-link E2E; Lighthouse/accessibility checks at 375/768/1440 px; visual comparison of required content.
- Done when: public data parity is signed off, no private profile/config fields are exposed, XSS regression tests pass, and public route budgets pass.

### M4 — Availability, pricing and booking

- Goal: migrate the core booking workflow with authoritative server validation and concurrency safety.
- Affected: Availability, Pricing, Coupons, Bookings; Angular booking forms/customer portal; database constraints.
- Strategy: formalize status/state rules; create immutable quotes; normalize phones; perform coupon, price and availability validation in one transaction; use idempotency keys.
- Risks: ambiguity in package/night/consultation/hold rules; existing overlapping bookings.
- Validation: characterization fixtures; property tests for money/VAT/discounts; concurrent booking integration test; role/ownership tests; E2E guest and authenticated bookings.
- Done when: the browser cannot set authoritative totals/status/vendor; double-booking test proves one winner; imported historical bookings reconcile by count and amount.

### M5 — Payments and subscriptions

- Goal: establish a safe, auditable money boundary.
- Affected: Payments/Subscriptions, provider adapter, webhook inbox, Angular payment status UI.
- Strategy: rotate credentials; server-created checkout; signed/verified idempotent webhooks; provider reconciliation; explicit subscription entitlements and asset limits.
- Risks: provider-specific signature behavior, in-flight transactions during cutover, historical state mismatch.
- Validation: provider sandbox tests; replay/out-of-order/duplicate webhook tests; amount/currency mismatch tests; reconciliation report; failure/retry E2E.
- Done when: secrets never reach the browser; URL parameters cannot change payment state; every provider transaction reconciles to one internal record.

### M6 — Vendor operations

- Goal: migrate assets, calendar, bookings, customers, coupons and brand/media management.
- Affected: vendor Angular shell; Catalog/Bookings/CRM/Coupons/Media modules.
- Strategy: responsive tables and focused forms; scoped commands; optimistic concurrency; secure upload pipeline; server-enforced plan limits.
- Risks: broad legacy forms contain hidden business behavior; media migration volume.
- Validation: per-feature parity checklist; ownership/IDOR tests; upload abuse tests; tablet/mobile keyboard/accessibility passes.
- Done when: vendor workflows are complete without direct database/storage access and all destructive actions are confirmed/audited.

### M7 — Commerce, POS and finance

- Goal: migrate store, inventory, orders, invoices, payments, expenses and finance reporting.
- Affected: Commerce/Finance API modules; public store and vendor/admin screens.
- Strategy: transactional inventory/order creation; immutable invoice snapshots; server-side aggregates/exports; lazy-load PDF/chart tooling.
- Risks: unclear seller/buyer meaning of `vendor_id`, accounting compliance, historic totals.
- Validation: concurrency/stock tests; money reconciliation; invoice golden files; permission tests; export/load tests.
- Done when: stock cannot go negative, client prices are ignored, financial totals reconcile, and compliance requirements are documented/accepted.

### M8 — Administration and CMS

- Goal: migrate moderation, users/subscribers, feature placement, configuration, announcements, homepage sections and audit views.
- Affected: Administration/Content/Operations modules and admin Angular shell.
- Strategy: explicit permission map, recent-auth for sensitive actions, constrained settings DTOs, responsive data tables, immutable audit events.
- Risks: legacy screens rely on overbroad `select('*')`; operational settings may include secrets.
- Validation: admin/non-admin authorization matrix; mass-assignment tests; CMS XSS tests; audit event assertions; accessibility/E2E.
- Done when: no admin action is possible without server permission and sensitive settings are neither stored in public rows nor returned to Angular.

### M9 — Data migration rehearsal and cutover

- Goal: move production data and objects with measured downtime/rollback.
- Affected: migrations/importers, auth mapping, storage copy, DNS/proxy routing, runbooks.
- Strategy: repeatable extract-transform-load preserving UUIDs; checksum/count/financial reconciliation; rehearsal on production-size copy; final delta capture or controlled write freeze.
- Risks: unknown live drift, auth password portability, broken references, cutover writes.
- Validation: row counts, null/orphan/duplicate reports, sampled domain comparisons, object checksums, login tests, financial reconciliation, timed restore/rollback drill.
- Done when: two successful rehearsals meet RTO, sign-off queries are clean, rollback trigger/time are explicit, and backups are restore-tested.

### M10 — Legacy retirement and production hardening

- Goal: remove React/Supabase runtime dependency only after full parity.
- Affected: legacy app/dependencies, proxy routes, documentation, monitoring, CI/CD.
- Strategy: observe canary traffic; close direct database/storage policies; remove old bundle and secrets; archive source/tag after retention window.
- Risks: long-tail routes or integrations omitted from parity matrix.
- Validation: full E2E, build/lint/test gates, container scan, k6 scenarios, failure injection, backup restore, 7–14 day canary metrics.
- Done when: Angular fully serves every supported workflow, no browser imports/calls Supabase or React, no critical findings remain, and operational acceptance is signed.

## Feature parity record

Each feature receives a file under `docs/parity/` with:

- legacy routes/components and queries
- actor, preconditions and business rules
- happy path plus error/empty/loading states
- fields, validation and normalization rules
- authorization/ownership matrix
- data mapping and reconciliation queries
- intentionally corrected defects with product approval
- unit, integration, API and E2E test IDs
- rollback instructions and retirement commit

## Database migration safety

- Establish the live schema as baseline migration `0000`; never infer it solely from repository SQL.
- Add new columns/tables first; backfill in bounded batches; validate; switch reads; switch writes; enforce constraints; remove compatibility only in a later release.
- Prefer `NOT VALID` foreign/check constraints followed by validation for large tables.
- Create large indexes concurrently outside transactional migrations when needed.
- Preserve UUIDs and original timestamps; retain a source-to-target reconciliation table.
- Never log row payloads containing PII or secrets.

## Release gates

Every milestone must pass:

```text
format -> lint -> typecheck -> unit -> integration -> migration smoke
       -> API contract -> E2E critical flows -> production build
       -> dependency/secret/container scan
```

Performance gates are route-specific and based on measured budgets, not an invented 10-million-user claim. Initial proposed frontend gates are: no public initial JS chunk above 250 kB gzip, no unexpected route chunk above 150 kB gzip, and no Core Web Vitals regression against the accepted baseline.

## Rollback model

- Application releases are immutable and previous images remain deployable.
- Expand/contract migrations keep the previous application compatible during the rollback window.
- Payment/provider events are retained in an idempotent inbox so replay is safe.
- Cutover has explicit stop conditions: reconciliation mismatch, elevated 5xx, auth failure, payment mismatch, booking conflict or database saturation.
- Database restore is the last resort; normal rollback uses compatibility and application image reversion to avoid discarding valid new writes.
