-- Add new enums for distribution model
CREATE TYPE "UserRole_new" AS ENUM ('ADMIN', 'WAREHOUSE', 'FIELD', 'SALES_REP', 'DRIVER', 'CUSTOMER_USER');
CREATE TYPE "BusinessModel" AS ENUM ('WAREHOUSE_ONLY', 'DISTRIBUTION', 'HYBRID');
CREATE TYPE "CustomerStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');
CREATE TYPE "CustomerOrderStatus" AS ENUM ('SUBMITTED', 'APPROVED', 'PULLED', 'LOADED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED');
CREATE TYPE "CustomerOrderType" AS ENUM ('STANDARD', 'EMERGENCY', 'STANDING');
CREATE TYPE "DeliveryStatus" AS ENUM ('SCHEDULED', 'LOADED', 'IN_TRANSIT', 'ARRIVED', 'DELIVERED', 'FAILED');
CREATE TYPE "LicenseTier_new" AS ENUM ('BASE', 'ELITE', 'DISTRIBUTION');

-- Add businessModel to Company table
ALTER TABLE "companies" ADD COLUMN "businessModel" "BusinessModel" NOT NULL DEFAULT 'WAREHOUSE_ONLY';

-- Add new fields to User table
ALTER TABLE "users" ADD COLUMN "territory" TEXT;
ALTER TABLE "users" ADD COLUMN "commissionRate" DOUBLE PRECISION;
ALTER TABLE "users" ADD COLUMN "licenseNumber" TEXT;
ALTER TABLE "users" ADD COLUMN "customerId" TEXT;
