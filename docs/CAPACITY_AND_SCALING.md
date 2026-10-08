# Capacity and scaling

## Current evidence

No production traffic profile, database statistics, resource telemetry or load-test results were provided. The only measured baseline is the legacy frontend build: a 1,411.90 kB minified JavaScript entry bundle (347.02 kB gzip) produced in about 50 seconds on the audit host. No requests-per-second or latency capacity claim is currently defensible.

The long-term target of 10,000,000 users/day is not a single number: traffic shape, cacheability, authenticated actions, payload size and peak factor dominate. Ten million uniformly distributed daily visits average roughly 116 visits/second, but a real peak can be many times higher and each visit may generate multiple requests. Capacity will be stated only from reproducible tests and production telemetry.

## Test model

Use k6 scenarios for:

- cached public catalog/home reads
- uncached search/filter reads
- login/refresh/logout and OTP request/verify against a stub provider
- customer dashboard/history
- availability and quote
- concurrent booking for the same and different assets
- payment intent creation with a stub provider plus webhook replay
- vendor/admin paginated tables
- inventory/order writes
- representative image upload through a dedicated non-production environment

Record request rate, iteration rate, p50/p95/p99, error rate, CPU, RSS, event-loop lag, database query latency, pool wait, active connections, locks, cache hit ratio, disk IOPS and network throughput. Publish environment size, dataset, script revision and configuration with every result.

## Initial single-VPS posture

- One reverse proxy, Angular static container, API container and PostgreSQL container
- PostgreSQL and object volumes persisted and backed up off-host
- Bounded API worker/pool settings derived from available CPU/RAM and PostgreSQL `max_connections`
- Resource reservations/limits selected after a soak test, not copied defaults
- Automatic container restart, liveness/readiness and graceful termination
- Static/media caching and compression to keep work away from Node/PostgreSQL

This improves recoverability but is not high availability. Host, disk, provider or datacenter failure can stop the whole stack.

## Scaling signals and responses

| Signal | First response | Later response |
| --- | --- | --- |
| Static/media bandwidth | CDN/object caching | S3-compatible object storage + multi-region CDN |
| API CPU/event-loop saturation | profile/fix hot paths; add replicas | independent worker pools or justified service extraction |
| DB pool wait | fix query/index/N+1; reduce pool fan-out | connection proxy, larger/managed DB |
| Read-heavy DB saturation | cache public projections | read replicas with explicit consistency policy |
| Write locks/contention | shorten transactions and partition hot keys | queue/serialize specific workflows; partition only with evidence |
| Job backlog | tune DB-backed runner | external durable queue and worker autoscaling |
| Distributed auth/rate limiting | retain DB sessions initially | Redis/managed coordination store |

## Frontend delivery (measured 2026-10-08)

The Angular build was measured with `gzip -9` over the production output (`ng build --stats-json`,
closure of statically imported chunks per route):

| Payload | Size (gzip) |
| --- | --- |
| App shell: framework, router, shell, CSS | 130 KB |
| Full icon set (separate chunk, requested in parallel at startup) | 17 KB |
| Home screen (search, featured halls, services) | +49 KB |
| Hall details | +49 KB |
| Halls catalog | +63 KB |
| Checkout (Material date picker, stepper logic) | +106 KB |
| Client bookings | +13 KB |
| Owner shell / dashboard / bookings table | +55 / +49 / +107 KB |
| Display font (Arabic subset, cached for a year) | 22 KB |
| Hero photo on phones (portrait WebP 480w / 720w) | 51 / 83 KB |

Controls that keep the origin cheap:

- Every screen is a lazy chunk; the service worker precaches only the shell and caches other chunks
  on first use, so a public visitor never downloads owner or admin code.
- Fingerprinted bundles and fonts are `immutable` for a year; HTML, `ngsw.json` and the worker
  revalidate. Repeat visits served by the service worker cost the origin roughly one small revalidation.
- Text assets are gzip-compressed at image build time and served with `gzip_static`, so nginx spends no
  CPU compressing static files.
- nginx sends security and cache headers from one `map`, rate-limits `/api/`, keeps upstream connections
  alive, and micro-caches public API reads (see below).

### API micro-cache convention

nginx stores an API response only when the API explicitly marks it cacheable, for example
`Cache-Control: public, max-age=30` on public catalog and availability-summary reads. Requests with an
`Authorization` header or any cookie bypass the cache, responses with `Set-Cookie`, `private` or
`no-store` are never stored, concurrent misses are collapsed into one upstream request, and a stale copy
is served while refreshing or during brief API errors. This turns a burst of identical public reads
into one Node/PostgreSQL query per key per interval.

### What a single VPS can and cannot do

A rough model for 10,000,000 visits/day: if 30% are first visits at about 400 KB each (shell, first
screen, font, photos) and the rest are service-worker repeat visits, static transfer alone is about
1.2 TB/day, or 36 TB/month. That exceeds the monthly bandwidth of typical single VPS plans, and a single
host has no redundancy. To approach that traffic:

1. Put a CDN (for example Cloudflare) in front of the VPS so static files and cacheable API reads are
   served from the edge; configure `set_real_ip_from`/`real_ip_header` in nginx so rate limits apply per
   visitor, and terminate TLS with HSTS at that edge or a local proxy.
2. Keep the VPS for the API and PostgreSQL, sized from the load tests described above.
3. Follow the scale-out sequence in [Target architecture](TARGET_ARCHITECTURE.md) when measurements,
   not estimates, show saturation.

The figures above describe payload size, not served capacity. Requests per second, latency and
headroom still need the k6 acceptance process in this document before any traffic commitment.

## Acceptance process

1. Define an expected production traffic mix and peak factor from analytics/business evidence.
2. Seed a privacy-safe dataset with production-like cardinality/skew.
3. Run smoke, ramp, steady-state, spike and 2–8 hour soak tests.
4. Find saturation and the first bottleneck; change one variable at a time.
5. Publish tested safe capacity with at least 30% headroom and SLO thresholds.
6. Repeat after material query, dependency, infrastructure or traffic changes.

Until this process runs, measured capacity is **unknown** and the 10-million-user/day target is an architecture direction, not a deployment guarantee.
