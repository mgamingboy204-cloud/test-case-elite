# 026 Migration Recovery

## Recovery goal
Recover `026_verification_escalation_workflow` from Prisma `P3009` without mis-marking migration history:

- use `--rolled-back` if inspection shows the database is still pre-026 or only has cleanup-safe leftovers
- use `--applied` only if inspection proves the database is already fully post-026
- stop immediately on any partial enum swap signal

## Exact commands from repo root
```sh
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f apps/api/prisma/manual/026_inspect.sql
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f apps/api/prisma/manual/026_cleanup_rolled_back.sql

npx prisma migrate resolve --rolled-back 026_verification_escalation_workflow --schema apps/api/prisma/schema.prisma
npx prisma migrate resolve --applied 026_verification_escalation_workflow --schema apps/api/prisma/schema.prisma
npx prisma migrate deploy --schema apps/api/prisma/schema.prisma
npx prisma migrate status --schema apps/api/prisma/schema.prisma
```

## Exact commands from `apps/api`
```sh
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f prisma/manual/026_inspect.sql
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f prisma/manual/026_cleanup_rolled_back.sql

npx prisma migrate resolve --rolled-back 026_verification_escalation_workflow --schema prisma/schema.prisma
npx prisma migrate resolve --applied 026_verification_escalation_workflow --schema prisma/schema.prisma
npx prisma migrate deploy --schema prisma/schema.prisma
npx prisma migrate status --schema prisma/schema.prisma
```

## Strict decision matrix
| Inspection result | Action |
| --- | --- |
| `_prisma_migrations` shows a failed unresolved row for `026_verification_escalation_workflow`, `VerificationRequest.status` is **not** bound to `VerificationRequestStatus_new`, the live `VerificationRequestStatus` labels are still `REQUESTED`, `IN_PROGRESS`, `COMPLETED`, `REJECTED`, `ASSIGNED`, `TIMED_OUT`, and `EscalationRequest` is absent or empty | Use the rolled-back path. Run cleanup if leftover table/types exist, then `resolve --rolled-back`, then `migrate deploy`, then `migrate status`. |
| `_prisma_migrations` shows a failed unresolved row for `026_verification_escalation_workflow`, `VerificationRequest.status` is bound to `VerificationRequestStatus`, the live `VerificationRequestStatus` labels are `PENDING`, `ASSIGNED`, `IN_PROGRESS`, `COMPLETED`, `REJECTED`, `ESCALATED`, `EscalationRequestType` is `VERIFICATION_WHATSAPP`, `EscalationRequestStatus` is `OPEN` / `RESOLVED`, `EscalationRequest` exists with the expected columns, indexes, and FKs, `WHATSAPP_HELP_REQUESTED:%` count is `0`, timeout footprint is `0`, and `VerificationRequestStatus_new` is absent | Use `resolve --applied`. After that, run `migrate status`. Run `migrate deploy` only if later migrations are pending. |
| `VerificationRequest.status` is bound to `VerificationRequestStatus_new` | STOP. Partial enum swap. Do not run rolled-back cleanup. Do not resolve as rolled back. Do not resolve as applied. |
| `VerificationRequest.status` is bound to `VerificationRequestStatus`, but the live labels already look post-026 while `EscalationRequest` is missing, incomplete, or its enums / indexes / FKs do not fully match post-026 | STOP. Partial 026 application. Do not use `--rolled-back`. Do not use `--applied`. |
| `EscalationRequest` exists and contains rows, but inspection does not prove the full post-026 shape end to end | STOP. Cleanup would risk deleting real escalation data. Do not use `--rolled-back`. |
| `WHATSAPP_HELP_REQUESTED:%` rows remain in `VerificationRequest.reason`, or any `TIMED_OUT` / default-timeout footprint remains, while the enum or table already looks post-026 | STOP. Data migration is incomplete. Do not use `--applied`. |

## Production runbook
1. Open a production shell in the service and move to the app directory.
```sh
cd /opt/render/project/src/apps/api
```

2. Run inspection first and keep the output.
```sh
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f prisma/manual/026_inspect.sql
```

3. Compare the inspection output to the decision matrix above.

4. If and only if the matrix says the rolled-back path is safe, run cleanup.
```sh
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f prisma/manual/026_cleanup_rolled_back.sql
```

5. Resolve the failed migration as rolled back.
```sh
npx prisma migrate resolve --rolled-back 026_verification_escalation_workflow --schema prisma/schema.prisma
```

6. Re-run deploy so Prisma executes 026 cleanly.
```sh
npx prisma migrate deploy --schema prisma/schema.prisma
```

7. Confirm Prisma now sees a healthy migration state.
```sh
npx prisma migrate status --schema prisma/schema.prisma
```

8. Re-run inspection to confirm the database is now fully post-026.
```sh
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f prisma/manual/026_inspect.sql
```

9. If and only if the matrix proves the database is already fully post-026 before any cleanup, skip cleanup and use the applied path instead.
```sh
npx prisma migrate resolve --applied 026_verification_escalation_workflow --schema prisma/schema.prisma
npx prisma migrate status --schema prisma/schema.prisma
```

## Validation after recovery
1. `npx prisma migrate status --schema prisma/schema.prisma` shows no unresolved failed migration.
2. `_prisma_migrations` no longer shows an unresolved failed row for `026_verification_escalation_workflow`.
3. `VerificationRequest.status` is bound to `VerificationRequestStatus`, not `VerificationRequestStatus_new`.
4. `VerificationRequestStatus_new` is absent.
5. `VerificationRequestStatus` labels are `PENDING`, `ASSIGNED`, `IN_PROGRESS`, `COMPLETED`, `REJECTED`, `ESCALATED`.
6. `EscalationRequestType` is `VERIFICATION_WHATSAPP`.
7. `EscalationRequestStatus` is `OPEN`, `RESOLVED`.
8. `EscalationRequest` exists with the expected columns, indexes, and FKs.
9. `WHATSAPP_HELP_REQUESTED:%` count is `0`.
10. Timeout footprint count is `0`.

## Risks to avoid
- Do not run the cleanup file when `VerificationRequest.status` is bound to `VerificationRequestStatus_new`.
- Do not run the cleanup file when `EscalationRequest` contains rows.
- Do not use `resolve --applied` unless structure and data both prove full post-026 completion.
- Do not use `resolve --rolled-back` after a partial enum swap.
- Do not edit or delete migration `026_verification_escalation_workflow` as part of this recovery.

## Optional minimal script additions
If you want shorter operational aliases later, the smallest safe additions to the root `package.json` are:

```json
{
  "scripts": {
    "db:migrate:status": "prisma migrate status --schema apps/api/prisma/schema.prisma",
    "db:migrate:resolve:026:rolledback": "prisma migrate resolve --rolled-back 026_verification_escalation_workflow --schema apps/api/prisma/schema.prisma",
    "db:migrate:resolve:026:applied": "prisma migrate resolve --applied 026_verification_escalation_workflow --schema apps/api/prisma/schema.prisma"
  }
}
```

## Default recommendation
Use the rolled-back path only when inspection shows the pre-026 enum shape and no live escalation rows. Stop on any partial enum swap signal instead of forcing either resolve path.
