-- Manual migration application - Run this in Supabase SQL Editor
-- This applies all 3 pending migrations without using Prisma's lock system

-- ===================================================================
-- Migration 1: 20251219_add_part_requests
-- ===================================================================

-- CreateEnum (if not exists)
DO $$ BEGIN
    CREATE TYPE "PartRequestStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'FULFILLED', 'CANCELLED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateTable: part_requests (if not exists)
CREATE TABLE IF NOT EXISTS "part_requests" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "requestedBy" TEXT NOT NULL,
    "itemName" TEXT NOT NULL,
    "description" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "urgency" TEXT NOT NULL DEFAULT 'normal',
    "status" "PartRequestStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "fulfilledBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "fulfilledAt" TIMESTAMP(3),

    CONSTRAINT "part_requests_pkey" PRIMARY KEY ("id")
);

-- AddForeignKeys (if not exists)
DO $$ BEGIN
    ALTER TABLE "part_requests" ADD CONSTRAINT "part_requests_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "part_requests" ADD CONSTRAINT "part_requests_requestedBy_fkey"
    FOREIGN KEY ("requestedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ===================================================================
-- Migration 2: 20251219_add_sku_qr_code
-- ===================================================================

-- Add SKU and QR code fields (if not exists)
DO $$ BEGIN
    ALTER TABLE "warehouse_inventory" ADD COLUMN IF NOT EXISTS "sku" TEXT;
    ALTER TABLE "warehouse_inventory" ADD COLUMN IF NOT EXISTS "qrCodeData" TEXT;
END $$;

-- Add unique constraint for SKU (if not exists)
CREATE UNIQUE INDEX IF NOT EXISTS "warehouse_inventory_companyId_sku_branchId_key"
ON "warehouse_inventory"("companyId", "sku", "branchId")
WHERE "sku" IS NOT NULL;

-- ===================================================================
-- Migration 3: 20251221_add_ai_assistant
-- ===================================================================

-- CreateEnums (if not exists)
DO $$ BEGIN
    CREATE TYPE "AiConversationStatus" AS ENUM ('ACTIVE', 'ARCHIVED', 'COMPLETED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "AiMessageRole" AS ENUM ('USER', 'ASSISTANT', 'SYSTEM');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "AiActionStatus" AS ENUM ('PROPOSED', 'CONFIRMED', 'EXECUTED', 'FAILED', 'CANCELLED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateTable: ai_conversations (if not exists)
CREATE TABLE IF NOT EXISTS "ai_conversations" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "branchId" TEXT,
    "topic" TEXT NOT NULL,
    "status" "AiConversationStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "archivedAt" TIMESTAMP(3),

    CONSTRAINT "ai_conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable: ai_messages (if not exists)
CREATE TABLE IF NOT EXISTS "ai_messages" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "role" "AiMessageRole" NOT NULL,
    "content" TEXT NOT NULL,
    "toolCalls" TEXT,
    "audioTranscript" BOOLEAN NOT NULL DEFAULT false,
    "tokenCount" INTEGER,
    "processingTimeMs" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable: ai_actions (if not exists)
CREATE TABLE IF NOT EXISTS "ai_actions" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "status" "AiActionStatus" NOT NULL DEFAULT 'PROPOSED',
    "proposedData" TEXT NOT NULL,
    "executedData" TEXT,
    "errorMessage" TEXT,
    "idempotencyKey" TEXT NOT NULL,
    "entityType" TEXT,
    "entityId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmedAt" TIMESTAMP(3),
    "executedAt" TIMESTAMP(3),

    CONSTRAINT "ai_actions_pkey" PRIMARY KEY ("id")
);

-- CreateTable: audit_logs (if not exists)
CREATE TABLE IF NOT EXISTS "audit_logs" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "userId" TEXT,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "changes" TEXT NOT NULL,
    "reason" TEXT,
    "source" TEXT NOT NULL DEFAULT 'ui',
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndexes (if not exists)
CREATE INDEX IF NOT EXISTS "ai_conversations_companyId_userId_idx" ON "ai_conversations"("companyId", "userId");
CREATE INDEX IF NOT EXISTS "ai_conversations_status_lastMessageAt_idx" ON "ai_conversations"("status", "lastMessageAt");
CREATE INDEX IF NOT EXISTS "ai_messages_conversationId_createdAt_idx" ON "ai_messages"("conversationId", "createdAt");
CREATE UNIQUE INDEX IF NOT EXISTS "ai_actions_idempotencyKey_key" ON "ai_actions"("idempotencyKey");
CREATE INDEX IF NOT EXISTS "ai_actions_companyId_userId_idx" ON "ai_actions"("companyId", "userId");
CREATE INDEX IF NOT EXISTS "ai_actions_status_createdAt_idx" ON "ai_actions"("status", "createdAt");
CREATE INDEX IF NOT EXISTS "ai_actions_idempotencyKey_idx" ON "ai_actions"("idempotencyKey");
CREATE INDEX IF NOT EXISTS "audit_logs_companyId_entityType_entityId_idx" ON "audit_logs"("companyId", "entityType", "entityId");
CREATE INDEX IF NOT EXISTS "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- AddForeignKeys (if not exists)
DO $$ BEGIN
    ALTER TABLE "ai_conversations" ADD CONSTRAINT "ai_conversations_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "ai_conversations" ADD CONSTRAINT "ai_conversations_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "ai_conversations" ADD CONSTRAINT "ai_conversations_branchId_fkey"
    FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "ai_messages" ADD CONSTRAINT "ai_messages_conversationId_fkey"
    FOREIGN KEY ("conversationId") REFERENCES "ai_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "ai_actions" ADD CONSTRAINT "ai_actions_conversationId_fkey"
    FOREIGN KEY ("conversationId") REFERENCES "ai_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "ai_actions" ADD CONSTRAINT "ai_actions_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "ai_actions" ADD CONSTRAINT "ai_actions_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ===================================================================
-- Mark migrations as applied in Prisma's migration table
-- ===================================================================

INSERT INTO "_prisma_migrations" (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count)
VALUES
    (gen_random_uuid()::text, '', NOW(), '20251219_add_part_requests', 'Manually applied via SQL script', NULL, NOW(), 1),
    (gen_random_uuid()::text, '', NOW(), '20251219_add_sku_qr_code', 'Manually applied via SQL script', NULL, NOW(), 1),
    (gen_random_uuid()::text, '', NOW(), '20251221_add_ai_assistant', 'Manually applied via SQL script', NULL, NOW(), 1)
ON CONFLICT DO NOTHING;

-- Done!
SELECT 'All migrations applied successfully!' as status;
