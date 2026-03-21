-- Guard the rolled-back cleanup path against a partial enum swap.
-- Expected meaning:
-- - this cleanup is only safe if VerificationRequest.status still uses the pre-026 label set.
-- - if the column is bound to VerificationRequestStatus_new, stop immediately.
-- - if the live enum labels are not REQUESTED / IN_PROGRESS / COMPLETED / REJECTED / ASSIGNED / TIMED_OUT, stop immediately.
DO $$
DECLARE
  status_udt_name text;
  status_labels text[];
  expected_labels text[] := ARRAY[
    'REQUESTED',
    'IN_PROGRESS',
    'COMPLETED',
    'REJECTED',
    'ASSIGNED',
    'TIMED_OUT'
  ];
BEGIN
  SELECT c.udt_name
  INTO status_udt_name
  FROM information_schema.columns c
  WHERE c.table_schema = ANY (current_schemas(false))
    AND c.table_name = 'VerificationRequest'
    AND c.column_name = 'status'
  LIMIT 1;

  IF status_udt_name IS NULL THEN
    RAISE EXCEPTION 'Abort cleanup: VerificationRequest.status was not found in the active schema search path.';
  END IF;

  IF status_udt_name = 'VerificationRequestStatus_new' THEN
    RAISE EXCEPTION 'Abort cleanup: VerificationRequest.status is bound to VerificationRequestStatus_new. Partial enum swap detected.';
  END IF;

  SELECT array_agg(e.enumlabel ORDER BY e.enumsortorder)
  INTO status_labels
  FROM pg_type t
  JOIN pg_enum e ON e.enumtypid = t.oid
  JOIN pg_namespace n ON n.oid = t.typnamespace
  WHERE n.nspname = ANY (current_schemas(false))
    AND t.typname = status_udt_name;

  IF status_labels IS DISTINCT FROM expected_labels THEN
    RAISE EXCEPTION
      'Abort cleanup: VerificationRequest.status uses enum % with labels %, not the pre-026 label set %.',
      status_udt_name,
      status_labels,
      expected_labels;
  END IF;
END $$;

-- Hard stop if EscalationRequest contains rows.
-- Expected meaning:
-- - a non-zero row count means real escalation data exists and cleanup must not drop the table.
-- - an absent table or a zero row count passes this guard.
DO $$
DECLARE
  escalation_request_count bigint;
BEGIN
  IF to_regclass('"EscalationRequest"') IS NULL THEN
    RAISE NOTICE 'EscalationRequest is absent; row-count guard passed.';
    RETURN;
  END IF;

  EXECUTE 'SELECT COUNT(*) FROM "EscalationRequest"' INTO escalation_request_count;

  IF escalation_request_count > 0 THEN
    RAISE EXCEPTION
      'Abort cleanup: EscalationRequest contains % row(s). Do not drop real escalation data.',
      escalation_request_count;
  END IF;
END $$;

-- Drop EscalationRequest only if it exists and is empty.
-- Expected meaning:
-- - this removes the table only on the cleanup-safe rolled-back path.
-- - indexes and table-owned constraints disappear with the table drop.
DO $$
DECLARE
  escalation_request_count bigint;
BEGIN
  IF to_regclass('"EscalationRequest"') IS NULL THEN
    RAISE NOTICE 'EscalationRequest is absent; nothing to drop.';
    RETURN;
  END IF;

  EXECUTE 'SELECT COUNT(*) FROM "EscalationRequest"' INTO escalation_request_count;

  IF escalation_request_count <> 0 THEN
    RAISE EXCEPTION
      'Abort cleanup: EscalationRequest contains % row(s). Refusing to drop the table.',
      escalation_request_count;
  END IF;

  EXECUTE 'DROP TABLE "EscalationRequest"';
END $$;

-- Drop the leftover EscalationRequestType enum only if no live column still uses it.
-- Expected meaning:
-- - this is safe after the table is gone and no other column references the type.
-- - if usage remains, stop instead of forcing a destructive cascade.
DO $$
DECLARE
  type_exists boolean;
  usage_count integer;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = ANY (current_schemas(false))
      AND t.typname = 'EscalationRequestType'
  )
  INTO type_exists;

  IF NOT type_exists THEN
    RAISE NOTICE 'EscalationRequestType is absent; nothing to drop.';
    RETURN;
  END IF;

  SELECT COUNT(*)
  INTO usage_count
  FROM information_schema.columns c
  WHERE c.table_schema = ANY (current_schemas(false))
    AND c.udt_name = 'EscalationRequestType';

  IF usage_count <> 0 THEN
    RAISE EXCEPTION
      'Abort cleanup: EscalationRequestType is still referenced by % column(s).',
      usage_count;
  END IF;

  EXECUTE 'DROP TYPE "EscalationRequestType"';
END $$;

-- Drop the leftover EscalationRequestStatus enum only if no live column still uses it.
-- Expected meaning:
-- - this is safe after the table is gone and no other column references the type.
-- - if usage remains, stop instead of forcing a destructive cascade.
DO $$
DECLARE
  type_exists boolean;
  usage_count integer;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = ANY (current_schemas(false))
      AND t.typname = 'EscalationRequestStatus'
  )
  INTO type_exists;

  IF NOT type_exists THEN
    RAISE NOTICE 'EscalationRequestStatus is absent; nothing to drop.';
    RETURN;
  END IF;

  SELECT COUNT(*)
  INTO usage_count
  FROM information_schema.columns c
  WHERE c.table_schema = ANY (current_schemas(false))
    AND c.udt_name = 'EscalationRequestStatus';

  IF usage_count <> 0 THEN
    RAISE EXCEPTION
      'Abort cleanup: EscalationRequestStatus is still referenced by % column(s).',
      usage_count;
  END IF;

  EXECUTE 'DROP TYPE "EscalationRequestStatus"';
END $$;

-- Drop the leftover VerificationRequestStatus_new enum only if no live column still uses it.
-- Expected meaning:
-- - this is safe only after the earlier guard proved VerificationRequest.status is not bound to the temporary enum.
-- - if any column still uses the type, stop instead of forcing a destructive cascade.
DO $$
DECLARE
  type_exists boolean;
  usage_count integer;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = ANY (current_schemas(false))
      AND t.typname = 'VerificationRequestStatus_new'
  )
  INTO type_exists;

  IF NOT type_exists THEN
    RAISE NOTICE 'VerificationRequestStatus_new is absent; nothing to drop.';
    RETURN;
  END IF;

  SELECT COUNT(*)
  INTO usage_count
  FROM information_schema.columns c
  WHERE c.table_schema = ANY (current_schemas(false))
    AND c.udt_name = 'VerificationRequestStatus_new';

  IF usage_count <> 0 THEN
    RAISE EXCEPTION
      'Abort cleanup: VerificationRequestStatus_new is still referenced by % column(s).',
      usage_count;
  END IF;

  EXECUTE 'DROP TYPE "VerificationRequestStatus_new"';
END $$;
