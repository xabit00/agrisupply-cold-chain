-- CreateEnum
CREATE TYPE "ProduceCategory" AS ENUM ('DAIRY', 'FRUITS', 'VEGETABLES', 'MEAT', 'SEAFOOD', 'FLOWERS');

-- CreateEnum
CREATE TYPE "ProduceBatchStatus" AS ENUM ('DRAFT', 'HARVESTED', 'IN_TRANSIT', 'COLD_STORAGE', 'DELIVERED', 'COMPROMISED');

-- CreateEnum
CREATE TYPE "ShipmentStatus" AS ENUM ('DRAFT', 'HARVESTED', 'IN_TRANSIT', 'COLD_STORAGE', 'DELIVERED', 'COMPROMISED');

-- CreateEnum
CREATE TYPE "StorageMode" AS ENUM ('AMBIENT', 'REFRIGERATED', 'FROZEN');

-- CreateEnum
CREATE TYPE "DestinationType" AS ENUM ('WAREHOUSE', 'RETAIL_OUTLET', 'DIRECT_CONSUMER');

-- CreateTable
CREATE TABLE "ProduceBatch" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "farmId" TEXT NOT NULL,
    "createdByUserId" TEXT NOT NULL,
    "batchCode" TEXT NOT NULL,
    "produceType" TEXT NOT NULL,
    "variety" TEXT,
    "category" "ProduceCategory" NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'kg',
    "grade" TEXT,
    "harvestDate" TIMESTAMP(3),
    "status" "ProduceBatchStatus" NOT NULL DEFAULT 'DRAFT',
    "optimalTempMin" DOUBLE PRECISION NOT NULL,
    "optimalTempMax" DOUBLE PRECISION NOT NULL,
    "optimalHumidityMin" DOUBLE PRECISION NOT NULL,
    "optimalHumidityMax" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProduceBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Shipment" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "produceBatchId" TEXT NOT NULL,
    "originFarmId" TEXT NOT NULL,
    "destinationWarehouseId" TEXT,
    "transporterUserId" TEXT,
    "retailerUserId" TEXT,
    "trackingCode" TEXT NOT NULL,
    "status" "ShipmentStatus" NOT NULL DEFAULT 'DRAFT',
    "destinationType" "DestinationType" NOT NULL,
    "storageMode" "StorageMode" NOT NULL,
    "requiresTransport" BOOLEAN NOT NULL DEFAULT false,
    "tamperSealEnabled" BOOLEAN NOT NULL DEFAULT false,
    "sealId" TEXT,
    "containers" JSONB,
    "photos" JSONB,
    "notes" TEXT,
    "originNameSnapshot" TEXT NOT NULL,
    "originAddressSnapshot" TEXT NOT NULL,
    "originLatitudeSnapshot" DOUBLE PRECISION NOT NULL,
    "originLongitudeSnapshot" DOUBLE PRECISION NOT NULL,
    "destinationNameSnapshot" TEXT NOT NULL,
    "destinationAddressSnapshot" TEXT NOT NULL,
    "destinationLatitudeSnapshot" DOUBLE PRECISION NOT NULL,
    "destinationLongitudeSnapshot" DOUBLE PRECISION NOT NULL,
    "currentLatitude" DOUBLE PRECISION,
    "currentLongitude" DOUBLE PRECISION,
    "temperatureAlert" BOOLEAN NOT NULL DEFAULT false,
    "humidityAlert" BOOLEAN NOT NULL DEFAULT false,
    "tamperAlert" BOOLEAN NOT NULL DEFAULT false,
    "idempotencyKey" TEXT,
    "scheduledAt" TIMESTAMP(3),
    "departedAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Shipment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProduceBatch_organizationId_idx" ON "ProduceBatch"("organizationId");

-- CreateIndex
CREATE INDEX "ProduceBatch_farmId_idx" ON "ProduceBatch"("farmId");

-- CreateIndex
CREATE INDEX "ProduceBatch_createdAt_idx" ON "ProduceBatch"("createdAt");

-- CreateIndex
CREATE INDEX "ProduceBatch_status_idx" ON "ProduceBatch"("status");

-- CreateIndex
CREATE INDEX "ProduceBatch_batchCode_idx" ON "ProduceBatch"("batchCode");

-- CreateIndex
CREATE UNIQUE INDEX "ProduceBatch_organizationId_batchCode_key" ON "ProduceBatch"("organizationId", "batchCode");

-- CreateIndex
CREATE UNIQUE INDEX "Shipment_produceBatchId_key" ON "Shipment"("produceBatchId");

-- CreateIndex
CREATE INDEX "Shipment_organizationId_idx" ON "Shipment"("organizationId");

-- CreateIndex
CREATE INDEX "Shipment_originFarmId_idx" ON "Shipment"("originFarmId");

-- CreateIndex
CREATE INDEX "Shipment_destinationWarehouseId_idx" ON "Shipment"("destinationWarehouseId");

-- CreateIndex
CREATE INDEX "Shipment_transporterUserId_idx" ON "Shipment"("transporterUserId");

-- CreateIndex
CREATE INDEX "Shipment_retailerUserId_idx" ON "Shipment"("retailerUserId");

-- CreateIndex
CREATE INDEX "Shipment_status_idx" ON "Shipment"("status");

-- CreateIndex
CREATE INDEX "Shipment_createdAt_idx" ON "Shipment"("createdAt");

-- CreateIndex
CREATE INDEX "Shipment_trackingCode_idx" ON "Shipment"("trackingCode");

-- CreateIndex
CREATE UNIQUE INDEX "Shipment_organizationId_trackingCode_key" ON "Shipment"("organizationId", "trackingCode");

-- CreateIndex
CREATE UNIQUE INDEX "Shipment_organizationId_idempotencyKey_key" ON "Shipment"("organizationId", "idempotencyKey");

-- AddForeignKey
ALTER TABLE "ProduceBatch" ADD CONSTRAINT "ProduceBatch_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProduceBatch" ADD CONSTRAINT "ProduceBatch_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "Farm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProduceBatch" ADD CONSTRAINT "ProduceBatch_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shipment" ADD CONSTRAINT "Shipment_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shipment" ADD CONSTRAINT "Shipment_produceBatchId_fkey" FOREIGN KEY ("produceBatchId") REFERENCES "ProduceBatch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shipment" ADD CONSTRAINT "Shipment_originFarmId_fkey" FOREIGN KEY ("originFarmId") REFERENCES "Farm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shipment" ADD CONSTRAINT "Shipment_destinationWarehouseId_fkey" FOREIGN KEY ("destinationWarehouseId") REFERENCES "Warehouse"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shipment" ADD CONSTRAINT "Shipment_transporterUserId_fkey" FOREIGN KEY ("transporterUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shipment" ADD CONSTRAINT "Shipment_retailerUserId_fkey" FOREIGN KEY ("retailerUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
