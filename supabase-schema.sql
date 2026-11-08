-- Investment Club Database Schema for Supabase
-- Run this in the Supabase SQL Editor: https://supabase.com/dashboard/project/obpkvdbqxxdnqxkxeyfa/sql

-- Create Role enum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'INVESTOR');

-- Create TransactionType enum
CREATE TYPE "TransactionType" AS ENUM ('ADMIN_CREDIT', 'INVESTMENT', 'PAYOUT');

-- Create CompanyStatus enum
CREATE TYPE "CompanyStatus" AS ENUM ('OPEN', 'CLOSED');

-- Create User table
CREATE TABLE "User" (
    "id" TEXT PRIMARY KEY,
    "email" TEXT UNIQUE NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'INVESTOR',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create Company table
CREATE TABLE "Company" (
    "id" TEXT PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "sector" TEXT,
    "status" "CompanyStatus" NOT NULL DEFAULT 'OPEN',
    "currentValue" DECIMAL(14, 2) NOT NULL DEFAULT 0,
    "initialValue" DECIMAL(14, 2) NOT NULL DEFAULT 0,
    "historicalData" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT NOT NULL,
    CONSTRAINT "Company_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Create Investment table
CREATE TABLE "Investment" (
    "id" TEXT PRIMARY KEY,
    "amount" DECIMAL(14, 2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT,
    "userId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    CONSTRAINT "Investment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Investment_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Create WalletTransaction table
CREATE TABLE "WalletTransaction" (
    "id" TEXT PRIMARY KEY,
    "amount" DECIMAL(14, 2) NOT NULL,
    "type" "TransactionType" NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    CONSTRAINT "WalletTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "WalletTransaction_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Create indexes for better performance
CREATE INDEX "User_email_key" ON "User"("email");
CREATE INDEX "Company_createdById_idx" ON "Company"("createdById");
CREATE INDEX "Investment_userId_idx" ON "Investment"("userId");
CREATE INDEX "Investment_companyId_idx" ON "Investment"("companyId");
CREATE INDEX "WalletTransaction_userId_idx" ON "WalletTransaction"("userId");
CREATE INDEX "WalletTransaction_createdById_idx" ON "WalletTransaction"("createdById");

-- Create updatedAt trigger for Company table
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_Company_updated_at BEFORE UPDATE ON "Company"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
