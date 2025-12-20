-- CreateEnum
CREATE TYPE "PartRequestStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'FULFILLED', 'CANCELLED');

-- CreateTable: part_requests
CREATE TABLE "part_requests" (
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

-- AddForeignKey: part_requests -> companies
ALTER TABLE "part_requests" ADD CONSTRAINT "part_requests_companyId_fkey"
FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: part_requests -> users
ALTER TABLE "part_requests" ADD CONSTRAINT "part_requests_requestedBy_fkey"
FOREIGN KEY ("requestedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
