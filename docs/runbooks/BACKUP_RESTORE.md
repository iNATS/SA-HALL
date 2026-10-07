# PostgreSQL backup and restore runbook

Status: foundation procedure; production automation and an off-host destination are still required.

## Objectives to confirm before cutover

The operator must approve recovery point objective (RPO), recovery time objective (RTO), retention, encryption key ownership and storage region. Until then, keep at least daily logical backups and provider/volume snapshots where available, with one encrypted copy off the VPS.

## Create a logical backup

Run from the repository directory on the VPS. The target directory must be encrypted or immediately transferred to encrypted off-host storage.

```bash
backup_name="sa-hall-$(date -u +%Y%m%dT%H%M%SZ).dump"
docker compose exec -T postgres pg_dump \
  --username=sa_hall \
  --dbname=sa_hall \
  --format=custom \
  --no-owner \
  --no-privileges > "$backup_name"
sha256sum "$backup_name" > "$backup_name.sha256"
```

Do not write database passwords into shell history or command arguments. Compose supplies the container credential.

## Verify a backup

```bash
sha256sum --check sa-hall-YYYYMMDDTHHMMSSZ.dump.sha256
pg_restore --list sa-hall-YYYYMMDDTHHMMSSZ.dump > /dev/null
```

A list check is not a restore test. A backup is accepted only after it restores successfully into an isolated empty database and application smoke checks pass.

## Restore rehearsal

Never rehearse over the live database. Use an isolated Compose project and different volume/network names.

1. Stop application writes or work only from a copied backup.
2. Start an empty PostgreSQL 18 instance in the isolated project.
3. Copy/stream the backup into that container.
4. Restore:

   ```bash
   docker compose -p sa-hall-restore exec -T postgres pg_restore \
     --username=sa_hall \
     --dbname=sa_hall \
     --clean \
     --if-exists \
     --no-owner \
     --no-privileges < sa-hall-YYYYMMDDTHHMMSSZ.dump
   ```

5. Run migrations only after the restored schema version is recorded.
6. Verify row counts, orphan/duplicate queries, monetary reconciliation, representative logins, catalog reads and booking/order histories.
7. Record total restore time, backup age, checksum, application revision and validation results.

## Disaster restore

- Declare the incident and freeze writes where possible.
- Preserve failed volumes/logs for investigation; do not overwrite the only evidence.
- Select the newest verified backup within the approved RPO.
- Provision a clean host/database, restore, run only forward-compatible migrations, and execute the sign-off checklist.
- Change routing only after readiness and data reconciliation pass.
- Rotate credentials if compromise is suspected.
- Document data loss window, customer impact and follow-up actions.

## Required automation before production acceptance

- scheduled `pg_dump` with failure alerting
- encryption before leaving the host
- off-host upload with least-privilege credentials
- retention/lifecycle enforcement
- immutable or object-locked recovery copies for the approved period
- backup age/size/checksum monitoring
- monthly automated restore plus quarterly operator disaster drill
- storage object/media backup and checksum reconciliation, not database-only backup
