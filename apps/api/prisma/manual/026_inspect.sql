-- Inspect the Prisma migration row for 026_verification_escalation_workflow.
-- Expected meaning:
-- - finished_at IS NULL and rolled_back_at IS NULL means Prisma still sees 026 as failed and unresolved.
-- - rolled_back_at IS NOT NULL means the failure was resolved as rolled back.
-- - finished_at IS NOT NULL means Prisma recorded 026 as applied.
SELECT
  "id",
  "migration_name",
  "started_at",
  "finished_at",
  "rolled_back_at",
  "applied_steps_count",
  "logs"
FROM "_prisma_migrations"
WHERE "migration_name" = '026_verification_escalation_workflow'
ORDER BY "started_at" DESC;

-- Inspect whether the temporary enum created by 026 still exists.
-- Expected meaning:
-- - true means the enum swap started and left VerificationRequestStatus_new behind.
-- - false means the temporary enum is not present in the active schema search path.
SELECT EXISTS (
  SELECT 1
  FROM pg_type t
  JOIN pg_namespace n ON n.oid = t.typnamespace
  WHERE n.nspname = ANY (current_schemas(false))
    AND t.typname = 'VerificationRequestStatus_new'
) AS verification_request_status_new_exists;

-- Inspect the current labels on VerificationRequestStatus.
-- Expected meaning:
-- - REQUESTED / IN_PROGRESS / COMPLETED / REJECTED / ASSIGNED / TIMED_OUT is the pre-026 shape.
-- - PENDING / ASSIGNED / IN_PROGRESS / COMPLETED / REJECTED / ESCALATED is the post-026 shape.
SELECT
  t.typname AS enum_name,
  e.enumsortorder,
  e.enumlabel
FROM pg_type t
JOIN pg_enum e ON e.enumtypid = t.oid
JOIN pg_namespace n ON n.oid = t.typnamespace
WHERE n.nspname = ANY (current_schemas(false))
  AND t.typname = 'VerificationRequestStatus'
ORDER BY e.enumsortorder;

-- Inspect the current labels on EscalationRequestType.
-- Expected meaning:
-- - VERIFICATION_WHATSAPP means the type exists with the expected post-026 label.
-- - zero rows means the type does not exist in the active schema search path.
SELECT
  t.typname AS enum_name,
  e.enumsortorder,
  e.enumlabel
FROM pg_type t
JOIN pg_enum e ON e.enumtypid = t.oid
JOIN pg_namespace n ON n.oid = t.typnamespace
WHERE n.nspname = ANY (current_schemas(false))
  AND t.typname = 'EscalationRequestType'
ORDER BY e.enumsortorder;

-- Inspect the current labels on EscalationRequestStatus.
-- Expected meaning:
-- - OPEN / RESOLVED means the type exists with the expected post-026 labels.
-- - zero rows means the type does not exist in the active schema search path.
SELECT
  t.typname AS enum_name,
  e.enumsortorder,
  e.enumlabel
FROM pg_type t
JOIN pg_enum e ON e.enumtypid = t.oid
JOIN pg_namespace n ON n.oid = t.typnamespace
WHERE n.nspname = ANY (current_schemas(false))
  AND t.typname = 'EscalationRequestStatus'
ORDER BY e.enumsortorder;

-- Inspect whether the EscalationRequest table exists.
-- Expected meaning:
-- - true means at least part of the table-creation portion of 026 ran.
-- - false means the table is absent.
SELECT to_regclass('"EscalationRequest"') IS NOT NULL AS escalation_request_table_exists;

-- List EscalationRequest columns.
-- Expected meaning:
-- - the full post-026 table has id, verificationRequestId, userId, type, status,
--   requestedAt, resolvedAt, createdAt, and updatedAt.
-- - zero rows means the table is absent.
SELECT
  c.table_schema,
  c.table_name,
  c.ordinal_position,
  c.column_name,
  c.data_type,
  c.udt_name,
  c.is_nullable,
  c.column_default
FROM information_schema.columns c
WHERE c.table_schema = ANY (current_schemas(false))
  AND c.table_name = 'EscalationRequest'
ORDER BY c.ordinal_position;

-- List EscalationRequest indexes.
-- Expected meaning:
-- - post-026 should include the primary-key-backed index, the unique verificationRequestId index,
--   EscalationRequest_status_requestedAt_idx, and EscalationRequest_userId_status_idx.
-- - zero rows means the table is absent or indexes were not created.
SELECT
  i.schemaname,
  i.tablename,
  i.indexname,
  i.indexdef
FROM pg_indexes i
WHERE i.schemaname = ANY (current_schemas(false))
  AND i.tablename = 'EscalationRequest'
ORDER BY i.indexname;

-- List EscalationRequest constraints and foreign keys.
-- Expected meaning:
-- - post-026 should include EscalationRequest_pkey,
--   EscalationRequest_verificationRequestId_fkey, and EscalationRequest_userId_fkey.
-- - zero rows means the table is absent or the constraints/FKs were not added.
SELECT
  con.conname AS constraint_name,
  CASE con.contype
    WHEN 'p' THEN 'PRIMARY KEY'
    WHEN 'f' THEN 'FOREIGN KEY'
    WHEN 'u' THEN 'UNIQUE'
    WHEN 'c' THEN 'CHECK'
    ELSE con.contype::text
  END AS constraint_type,
  pg_get_constraintdef(con.oid) AS definition
FROM pg_constraint con
JOIN pg_class rel ON rel.oid = con.conrelid
JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
WHERE nsp.nspname = ANY (current_schemas(false))
  AND rel.relname = 'EscalationRequest'
ORDER BY constraint_type, constraint_name;

-- Inspect the live VerificationRequest.status column type and default.
-- Expected meaning:
-- - udt_name = VerificationRequestStatus means the column points at the renamed live enum.
-- - udt_name = VerificationRequestStatus_new means the enum swap stopped mid-flight.
-- - column_default should be 'PENDING' only after a full 026 application.
SELECT
  c.table_schema,
  c.table_name,
  c.column_name,
  c.udt_name,
  c.is_nullable,
  c.column_default
FROM information_schema.columns c
WHERE c.table_schema = ANY (current_schemas(false))
  AND c.table_name = 'VerificationRequest'
  AND c.column_name = 'status';

-- Count VerificationRequest rows by status.
-- Expected meaning:
-- - any TIMED_OUT rows mean the pre-026 status values still exist.
-- - ESCALATED rows are only possible after the post-026 enum shape is live.
SELECT
  "status"::text AS status,
  COUNT(*) AS row_count
FROM "VerificationRequest"
GROUP BY "status"
ORDER BY "status"::text;

-- Count VerificationRequest rows whose reason still carries the WhatsApp escalation marker.
-- Expected meaning:
-- - zero means the 026 data move for WhatsApp escalation reasons is fully complete.
-- - any non-zero count means at least some pre-026 reason payload still remains in VerificationRequest.
SELECT COUNT(*) AS whatsapp_help_reason_count
FROM "VerificationRequest"
WHERE "reason" LIKE 'WHATSAPP_HELP_REQUESTED:%';

-- Count timeout-shaped VerificationRequest rows.
-- Expected meaning:
-- - timed_out_status_count > 0 means the old TIMED_OUT enum value is still present in live data.
-- - default_timeout_reason_count > 0 means the old default timeout reason text still remains somewhere.
-- - combined_timeout_footprint_count > 0 means timeout cleanup is not fully complete.
SELECT
  COUNT(*) FILTER (WHERE "status"::text = 'TIMED_OUT') AS timed_out_status_count,
  COUNT(*) FILTER (WHERE "reason" = 'Timed out without employee response') AS default_timeout_reason_count,
  COUNT(*) FILTER (
    WHERE "status"::text = 'TIMED_OUT'
       OR "reason" = 'Timed out without employee response'
  ) AS combined_timeout_footprint_count
FROM "VerificationRequest";

-- Count EscalationRequest rows, guarded so the query still runs if the table is absent.
-- Expected meaning:
-- - zero means the table is absent or present but empty.
-- - any non-zero count means real escalation rows exist and the rolled-back cleanup path must not drop the table.
DO $$
DECLARE
  escalation_request_count bigint;
BEGIN
  IF to_regclass('"EscalationRequest"') IS NULL THEN
    RAISE NOTICE 'EscalationRequest row count: table absent';
    RETURN;
  END IF;

  EXECUTE 'SELECT COUNT(*) FROM "EscalationRequest"' INTO escalation_request_count;
  RAISE NOTICE 'EscalationRequest row count: %', escalation_request_count;
END $$;
