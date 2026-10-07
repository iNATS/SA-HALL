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

## Acceptance process

1. Define an expected production traffic mix and peak factor from analytics/business evidence.
2. Seed a privacy-safe dataset with production-like cardinality/skew.
3. Run smoke, ramp, steady-state, spike and 2–8 hour soak tests.
4. Find saturation and the first bottleneck; change one variable at a time.
5. Publish tested safe capacity with at least 30% headroom and SLO thresholds.
6. Repeat after material query, dependency, infrastructure or traffic changes.

Until this process runs, measured capacity is **unknown** and the 10-million-user/day target is an architecture direction, not a deployment guarantee.
