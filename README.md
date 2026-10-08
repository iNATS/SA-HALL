# SA Hall

SA Hall is being migrated from a browser-only React/Supabase application to an Arabic-first Angular 22 + NestJS 12 + PostgreSQL architecture. The migration is intentionally non-destructive: the legacy application remains at the repository root until each feature reaches tested parity.

## Current status

- Legacy React application: builds and remains the behavior reference; not safe for production without the containment actions in the audit.
- New Angular application: Material 3 redesign (royal violet primary, champagne gold accents, zero
  elevation) covering the public marketplace, client account, hall-owner panel and administration panel.
  Phones get an installable, app-like experience (bottom navigation, full-screen flows, offline shell);
  desktops get navigation drawers and data tables. All screens currently run on consistent demo data
  (`apps/web/src/app/core/demo`) until the API feature slices exist.
- New NestJS API: Fastify, validated configuration, structured request logs, correlation IDs, consistent errors, PostgreSQL readiness and ordered checksum migrations.
- Deployment: Compose services for the Angular web/proxy, API and private PostgreSQL database. Redis is not included because no measured need has been demonstrated.

Read these first:

- [Handover audit](docs/HANDOVER_AUDIT.md)
- [Target architecture](docs/TARGET_ARCHITECTURE.md)
- [Migration plan](docs/MIGRATION_PLAN.md)
- [Capacity and scaling](docs/CAPACITY_AND_SCALING.md)
- [Material 3 design system](design-system/MASTER.md)

Historical implementation notes and the unordered legacy Supabase SQL patches have been moved to
`docs/legacy/` and `database/legacy/`. They are retained only as migration evidence and must not be
treated as an executable migration sequence.

## Docker deployment

Requirements: Docker Engine with Compose. No host Node.js or PostgreSQL installation is needed.

1. Merge the Docker values from `.env.example` into a local `.env` and replace `POSTGRES_PASSWORD` with a long random secret. Never commit the resulting file.
2. Start the stack:

   ```bash
   docker compose up -d
   ```

3. Check service state and health:

   ```bash
   docker compose ps
   curl --fail http://localhost:8080/health/live
   curl --fail http://localhost:8080/health/ready
   ```

The site listens on port `8080` by default. PostgreSQL has no host port and is reachable only on the internal Compose network. Database and upload data use named volumes.

This foundation is not yet a production cutover. Public catalog, identity, booking, payment and administrative feature slices still need to be migrated and reconciled before the legacy runtime can be retired.

## Web app

```bash
npm --prefix apps/web ci
npm --prefix apps/web start        # http://localhost:4200
```

| Area | Entry route |
| --- | --- |
| Public marketplace and checkout | `/`, `/halls`, `/halls/:slug`, `/booking/:slug` |
| Client account | `/client/bookings`, `/client/favorites`, `/client/profile` |
| Hall-owner panel | `/owner/dashboard` |
| Administration panel | `/admin/dashboard` |
| Workspace chooser | `/sign-in` |

Design rules live in [design-system/MASTER.md](design-system/MASTER.md); payload measurements and the
single-VPS assessment live in [docs/CAPACITY_AND_SCALING.md](docs/CAPACITY_AND_SCALING.md).

## Local verification

Angular 22.2 requires Node `22.22.3`, `24.15.0`, or newer compatible releases. The Docker images pin Node `24.15.0`. If the host Node is older, use Docker for authoritative builds.

```bash
# Existing behavior reference
npm ci
npm run build

# Angular
npm --prefix apps/web ci
npm run web:test
npm run web:build

# API
npm --prefix apps/api ci
npm run api:test
npm run api:build
npm run api:test:e2e

# Shared contracts
npm --prefix packages/contracts install
npm run contracts:typecheck
```

## Database migrations

The API runs checksum-protected SQL migrations before startup. Applied files are recorded in `schema_migrations`, and changing an already-applied migration fails startup. Add new files under `apps/api/src/migrations` using the next four-digit prefix; never edit an applied migration.

The current migration only establishes required extensions. Business tables are deliberately deferred until the live Supabase schema is exported and reconciled, preventing the new schema from guessing at production data.

## Backup and restore baseline

Until automated off-host backups are added, an operator can create a logical backup with:

```bash
docker compose exec -T postgres pg_dump -U sa_hall -d sa_hall -Fc > sa-hall.dump
```

Restore must be rehearsed into a separate empty database/Compose project, never over a live database. A production release requires encrypted off-host scheduling, retention, checksum verification and a timed restore test as described in the migration plan.

## Security notice

The legacy payment and static OTP flows contain critical findings. Do not expose the current React/Supabase implementation as a production-safe payment or authentication system. Rotate the payment credential and apply the audit containment actions before accepting real transactions.
