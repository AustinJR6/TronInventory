-- Manually mark the migration as applied
-- Run this in Supabase SQL Editor AFTER releasing locks

-- First, check the current migration status
SELECT * FROM "_prisma_migrations"
ORDER BY finished_at DESC;

-- Update the failed migration to mark it as applied
UPDATE "_prisma_migrations"
SET
    finished_at = NOW(),
    applied_steps_count = 1,
    logs = 'Manually marked as applied after resolving migration lock issues'
WHERE migration_name = '20251218_add_multi_tenant_company_layer'
AND finished_at IS NULL;

-- Verify the update
SELECT migration_name, finished_at, applied_steps_count, logs
FROM "_prisma_migrations"
WHERE migration_name = '20251218_add_multi_tenant_company_layer';
