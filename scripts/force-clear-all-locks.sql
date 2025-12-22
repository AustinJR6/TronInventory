-- AGGRESSIVE: Force clear ALL locks and connections
-- Run this in Supabase SQL Editor

-- Step 1: See all current connections
SELECT
    pid,
    usename,
    application_name,
    client_addr,
    state,
    query_start,
    NOW() - query_start as duration
FROM pg_stat_activity
WHERE datname = current_database()
ORDER BY query_start;

-- Step 2: Terminate ALL connections except your current one
-- This will kill any stuck Prisma migrations
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE datname = current_database()
  AND pid != pg_backend_pid()
  AND application_name LIKE '%prisma%';

-- Step 3: Release ALL advisory locks
SELECT pg_advisory_unlock_all();

-- Step 4: Verify no advisory locks remain
SELECT
    locktype,
    database,
    pid,
    mode,
    granted
FROM pg_locks
WHERE locktype = 'advisory';

-- Step 5: Check the migration status
SELECT
    migration_name,
    finished_at,
    applied_steps_count,
    CASE
        WHEN finished_at IS NULL THEN 'FAILED/IN_PROGRESS'
        ELSE 'COMPLETED'
    END as status
FROM "_prisma_migrations"
ORDER BY started_at DESC
LIMIT 10;
