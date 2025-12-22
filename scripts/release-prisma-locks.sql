-- Release all Prisma advisory locks
-- Run this in Supabase SQL Editor

-- Step 1: Check current advisory locks
SELECT
    locktype,
    database,
    pid,
    mode,
    granted
FROM pg_locks
WHERE locktype = 'advisory';

-- Step 2: Find sessions holding advisory locks
SELECT
    pg_locks.pid,
    pg_stat_activity.usename,
    pg_stat_activity.application_name,
    pg_stat_activity.client_addr,
    pg_stat_activity.state,
    pg_stat_activity.query,
    pg_stat_activity.query_start,
    NOW() - pg_stat_activity.query_start AS duration
FROM pg_locks
JOIN pg_stat_activity ON pg_locks.pid = pg_stat_activity.pid
WHERE pg_locks.locktype = 'advisory';

-- Step 3: Release all advisory locks for current session
SELECT pg_advisory_unlock_all();

-- Step 4: If locks persist, terminate the sessions holding them
-- UNCOMMENT THE LINES BELOW IF STEP 3 DOESN'T WORK:

-- SELECT pg_terminate_backend(pid)
-- FROM pg_locks
-- WHERE locktype = 'advisory'
-- AND pid != pg_backend_pid();

-- Step 5: Verify locks are gone
SELECT COUNT(*) as remaining_locks
FROM pg_locks
WHERE locktype = 'advisory';
