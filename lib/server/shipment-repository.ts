import {
  DestinationType as DbDestinationType,
  MembershipRole,
  Prisma,
  ProduceBatchStatus as DbProduceBatchStatus,
  ProduceCategory as DbProduceCategory,
  ShipmentStatus as DbShipmentStatus,
  StorageMode as DbStorageMode,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  ColdChainMetrics,
  DestinationType,
  PaginatedResult,
  PaginationParams,
  ProduceCategory,
  Shipment,
  ShipmentCreateRequest,
  ShipmentStatus,
  StorageMode,
} from "@/lib/types";
import { AMBIENT_PRESET } from "@/lib/constants/produce-presets";

const shipmentInclude = {
  produceBatch: true,
  originFarm: true,
  destinationWarehouse: true,
} satisfies Prisma.ShipmentInclude;

type ShipmentRecord = Prisma.ShipmentGetPayload<{
  include: typeof shipmentInclude;
}>;

export type ShipmentCreatePayload = ShipmentCreateRequest & {
  idempotencyKey?: string;
  trackingNumber?: string;
  status?: ShipmentStatus;
  currentLocation?: Shipment["currentLocation"];
  temperatureAlert?: boolean;
  humidityAlert?: boolean;
  tamperAlert?: boolean;
  dispatchedAt?: string;
  deliveredAt?: string;
};

const CATEGORY_TO_DB: Record<ProduceCategory, DbProduceCategory> = {
  Dairy: DbProduceCategory.DAIRY,
  Fruits: DbProduceCategory.FRUITS,
  Vegetables: DbProduceCategory.VEGETABLES,
  Meat: DbProduceCategory.MEAT,
  Seafood: DbProduceCategory.SEAFOOD,
  Flowers: DbProduceCategory.FLOWERS,
};

const CATEGORY_FROM_DB: Record<DbProduceCategory, ProduceCategory> = {
  DAIRY: "Dairy",
  FRUITS: "Fruits",
  VEGETABLES: "Vegetables",
  MEAT: "Meat",
  SEAFOOD: "Seafood",
  FLOWERS: "Flowers",
};

const STATUS_TO_DB: Record<ShipmentStatus, DbShipmentStatus> = {
  Draft: DbShipmentStatus.DRAFT,
  Harvested: DbShipmentStatus.HARVESTED,
  InTransit: DbShipmentStatus.IN_TRANSIT,
  ColdStorage: DbShipmentStatus.COLD_STORAGE,
  Delivered: DbShipmentStatus.DELIVERED,
  Compromised: DbShipmentStatus.COMPROMISED,
};

const BATCH_STATUS_TO_DB: Record<ShipmentStatus, DbProduceBatchStatus> = {
  Draft: DbProduceBatchStatus.DRAFT,
  Harvested: DbProduceBatchStatus.HARVESTED,
  InTransit: DbProduceBatchStatus.IN_TRANSIT,
  ColdStorage: DbProduceBatchStatus.COLD_STORAGE,
  Delivered: DbProduceBatchStatus.DELIVERED,
  Compromised: DbProduceBatchStatus.COMPROMISED,
};

const STATUS_FROM_DB: Record<DbShipmentStatus, ShipmentStatus> = {
  DRAFT: "Draft",
  HARVESTED: "Harvested",
  IN_TRANSIT: "InTransit",
  COLD_STORAGE: "ColdStorage",
  DELIVERED: "Delivered",
  COMPROMISED: "Compromised",
};

const STORAGE_TO_DB: Record<StorageMode, DbStorageMode> = {
  Ambient: DbStorageMode.AMBIENT,
  Refrigerated: DbStorageMode.REFRIGERATED,
  Frozen: DbStorageMode.FROZEN,
};

const STORAGE_FROM_DB: Record<DbStorageMode, StorageMode> = {
  AMBIENT: "Ambient",
  REFRIGERATED: "Refrigerated",
  FROZEN: "Frozen",
};

const DESTINATION_TO_DB: Record<DestinationType, DbDestinationType> = {
  Warehouse: DbDestinationType.WAREHOUSE,
  RetailOutlet: DbDestinationType.RETAIL_OUTLET,
  DirectConsumer: DbDestinationType.DIRECT_CONSUMER,
};

const DESTINATION_FROM_DB: Record<DbDestinationType, DestinationType> = {
  WAREHOUSE: "Warehouse",
  RETAIL_OUTLET: "RetailOutlet",
  DIRECT_CONSUMER: "DirectConsumer",
};

const ACTIVE_STATUSES: ShipmentStatus[] = ["Harvested", "InTransit", "ColdStorage"];

function asArray<T>(value: Prisma.JsonValue | null): T[] | undefined {
  return Array.isArray(value) ? (value as unknown as T[]) : undefined;
}

function toApiShipment(record: ShipmentRecord): Shipment {
  const batch = record.produceBatch;
  const currentLocation =
    record.currentLatitude !== null && record.currentLongitude !== null
      ? { lat: record.currentLatitude, lng: record.currentLongitude }
      : undefined;

  return {
    id: record.id,
    trackingNumber: record.trackingCode,
    farmerId: batch.createdByUserId,
    transporterId: record.transporterUserId ?? undefined,
    warehouseId: record.destinationWarehouseId ?? undefined,
    retailerId: record.retailerUserId ?? undefined,
    produce: {
      id: batch.id,
      name: batch.produceType,
      category: CATEGORY_FROM_DB[batch.category],
      quantityKg: batch.quantity,
      optimalTempMin: batch.optimalTempMin,
      optimalTempMax: batch.optimalTempMax,
      optimalHumidityMin: batch.optimalHumidityMin,
      optimalHumidityMax: batch.optimalHumidityMax,
    },
    origin: {
      name: record.originNameSnapshot,
      address: record.originAddressSnapshot,
      coordinates: {
        lat: record.originLatitudeSnapshot,
        lng: record.originLongitudeSnapshot,
      },
    },
    destination: {
      name: record.destinationNameSnapshot,
      address: record.destinationAddressSnapshot,
      coordinates: {
        lat: record.destinationLatitudeSnapshot,
        lng: record.destinationLongitudeSnapshot,
      },
    },
    status: STATUS_FROM_DB[record.status],
    storageMode: STORAGE_FROM_DB[record.storageMode],
    containers: asArray<NonNullable<Shipment["containers"]>[number]>(record.containers),
    compliance: {
      destinationType: DESTINATION_FROM_DB[record.destinationType],
      requiresTransport: record.requiresTransport,
      tamperSealEnabled: record.tamperSealEnabled,
      sealId: record.sealId ?? undefined,
    },
    currentLocation,
    temperatureAlert: record.temperatureAlert,
    humidityAlert: record.humidityAlert,
    tamperAlert: record.tamperAlert,
    photos: asArray<NonNullable<Shipment["photos"]>[number]>(record.photos),
    notes: record.notes ?? undefined,
    createdAt: record.createdAt.toISOString(),
    dispatchedAt: record.departedAt?.toISOString(),
    deliveredAt: record.deliveredAt?.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

function sortValue(shipment: Shipment, sortBy: string): string | number {
  switch (sortBy) {
    case "trackingNumber":
      return shipment.trackingNumber;
    case "produceName":
      return shipment.produce.name.toLowerCase();
    case "category":
      return shipment.produce.category;
    case "quantityKg":
      return shipment.produce.quantityKg;
    case "status":
      return shipment.status;
    case "destinationName":
      return shipment.destination.name.toLowerCase();
    case "updatedAt":
      return shipment.updatedAt;
    default:
      return shipment.createdAt;
  }
}

function matchesSearch(shipment: Shipment, term: string): boolean {
  return [
    shipment.trackingNumber,
    shipment.produce.name,
    shipment.produce.category,
    shipment.origin.name,
    shipment.origin.address,
    shipment.destination.name,
    shipment.destination.address,
  ].some((value) => value.toLowerCase().includes(term));
}

async function allShipmentRecords(): Promise<ShipmentRecord[]> {
  return prisma.shipment.findMany({ include: shipmentInclude });
}

async function findShipmentRecord(id: string): Promise<ShipmentRecord | null> {
  return prisma.shipment.findFirst({
    where: {
      OR: [
        { id: { equals: id, mode: "insensitive" } },
        { trackingCode: { equals: id, mode: "insensitive" } },
      ],
    },
    include: shipmentInclude,
  });
}

export async function listShipments(
  params: Partial<PaginationParams>
): Promise<PaginatedResult<Shipment>> {
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 10));
  const searchQuery = (params.searchQuery ?? "").trim().toLowerCase();
  const statusFilter = params.statusFilter ?? "ALL";
  const categoryFilter = params.categoryFilter ?? "ALL";
  const sortBy = params.sortBy ?? "createdAt";
  const sortOrder = params.sortOrder ?? "desc";

  let filtered = (await allShipmentRecords()).map(toApiShipment);
  if (searchQuery) filtered = filtered.filter((item) => matchesSearch(item, searchQuery));
  if (statusFilter !== "ALL") filtered = filtered.filter((item) => item.status === statusFilter);
  if (categoryFilter !== "ALL") filtered = filtered.filter((item) => item.produce.category === categoryFilter);

  filtered.sort((a, b) => {
    const left = sortValue(a, sortBy);
    const right = sortValue(b, sortBy);
    if (left === right) return a.id.localeCompare(b.id);
    const comparison = left > right ? 1 : -1;
    return sortOrder === "asc" ? comparison : -comparison;
  });

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;

  return {
    items: filtered.slice(start, start + pageSize),
    total,
    page: safePage,
    pageSize,
    totalPages,
  };
}

export async function findShipmentById(id: string): Promise<Shipment | undefined> {
  const record = await findShipmentRecord(id.trim());
  return record ? toApiShipment(record) : undefined;
}

async function resolveFoundation(payload: ShipmentCreatePayload) {
  const farmer = await prisma.user.findUnique({
    where: { id: payload.farmerId },
    include: {
      memberships: {
        include: { organization: { include: { farms: true } } },
      },
    },
  });
  const membership =
    farmer?.memberships.find((item) => item.role === MembershipRole.FARMER) ??
    farmer?.memberships[0];
  const farm = membership?.organization.farms[0];
  if (!farmer || !membership || !farm) {
    throw new Error("The signed-in farmer has no staging organization or origin farm");
  }

  let warehouse = null;
  if (payload.destinationType === "Warehouse" && payload.warehouseId) {
    warehouse = await prisma.warehouse.findFirst({
      where: {
        OR: [
          { id: payload.warehouseId },
          {
            organization: {
              memberships: {
                some: {
                  userId: payload.warehouseId,
                  role: MembershipRole.WAREHOUSE_ADMIN,
                },
              },
            },
          },
        ],
      },
    });
  }
  if (payload.destinationType === "Warehouse" && !warehouse) {
    throw new Error("The selected staging warehouse could not be resolved");
  }

  return { farmer, membership, farm, warehouse };
}

function generatedCode(prefix: string, suffix: string): string {
  return `${prefix}-${Date.now().toString(36).toUpperCase()}-${crypto.randomUUID()
    .slice(0, 6)
    .toUpperCase()}-${suffix}`;
}

export async function createShipment(payload: ShipmentCreatePayload): Promise<Shipment> {
  const { membership, farm, warehouse } = await resolveFoundation(payload);
  const organizationId = membership.organizationId;

  if (payload.idempotencyKey) {
    const existing = await prisma.shipment.findUnique({
      where: {
        organizationId_idempotencyKey: {
          organizationId,
          idempotencyKey: payload.idempotencyKey,
        },
      },
      include: shipmentInclude,
    });
    if (existing) return toApiShipment(existing);
  }

  const produce = payload.produce;
  const storageMode = payload.storageMode ?? AMBIENT_PRESET.storageMode;
  const ambient = storageMode === "Ambient" ? AMBIENT_PRESET : undefined;
  const status = payload.status ?? "Draft";
  const categorySuffix = produce.category.slice(0, 4).toUpperCase();
  const trackingCode =
    payload.trackingNumber ?? generatedCode("TRK", categorySuffix);
  const batchCode = generatedCode("BATCH", categorySuffix);
  const batchId = `batch_${crypto.randomUUID()}`;
  const shipmentId = `shipment_${crypto.randomUUID()}`;
  const destinationLatitude = warehouse?.latitude ?? 0;
  const destinationLongitude = warehouse?.longitude ?? 0;

  try {
    const [, record] = await prisma.$transaction([
      prisma.produceBatch.create({
        data: {
          id: batchId,
          organizationId,
          farmId: farm.id,
          createdByUserId: payload.farmerId,
          batchCode,
          produceType: produce.name,
          category: CATEGORY_TO_DB[produce.category],
          quantity: produce.quantityKg,
          status: BATCH_STATUS_TO_DB[status],
          optimalTempMin: produce.optimalTempMin ?? ambient?.tempMin ?? 0,
          optimalTempMax: produce.optimalTempMax ?? ambient?.tempMax ?? 4,
          optimalHumidityMin: produce.optimalHumidityMin ?? ambient?.humidityMin ?? 70,
          optimalHumidityMax: produce.optimalHumidityMax ?? ambient?.humidityMax ?? 90,
        },
      }),
      prisma.shipment.create({
        data: {
          id: shipmentId,
          organizationId,
          produceBatchId: batchId,
          originFarmId: farm.id,
          destinationWarehouseId: warehouse?.id,
          transporterUserId: payload.transporterId,
          retailerUserId: payload.retailerId,
          trackingCode,
          status: STATUS_TO_DB[status],
          destinationType: DESTINATION_TO_DB[payload.destinationType],
          storageMode: STORAGE_TO_DB[storageMode],
          requiresTransport: payload.requiresTransport,
          tamperSealEnabled: payload.tamperSealEnabled,
          sealId: payload.sealId,
          ...(payload.containers.length
            ? { containers: payload.containers as unknown as Prisma.InputJsonValue }
            : {}),
          ...(payload.photos.length
            ? { photos: payload.photos as unknown as Prisma.InputJsonValue }
            : {}),
          notes: payload.notes,
          originNameSnapshot: payload.origin.name,
          originAddressSnapshot: payload.origin.address,
          originLatitudeSnapshot: farm.latitude,
          originLongitudeSnapshot: farm.longitude,
          destinationNameSnapshot: payload.destination.name,
          destinationAddressSnapshot: payload.destination.address,
          destinationLatitudeSnapshot: destinationLatitude,
          destinationLongitudeSnapshot: destinationLongitude,
          currentLatitude: payload.currentLocation?.lat,
          currentLongitude: payload.currentLocation?.lng,
          temperatureAlert: payload.temperatureAlert ?? false,
          humidityAlert: payload.humidityAlert ?? false,
          tamperAlert: payload.tamperAlert ?? false,
          idempotencyKey: payload.idempotencyKey,
          departedAt: payload.dispatchedAt
            ? new Date(payload.dispatchedAt)
            : undefined,
          deliveredAt: payload.deliveredAt
            ? new Date(payload.deliveredAt)
            : undefined,
        },
        include: shipmentInclude,
      }),
    ]);
    return toApiShipment(record);
  } catch (error) {
    if (
      payload.idempotencyKey &&
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const existing = await prisma.shipment.findUnique({
        where: {
          organizationId_idempotencyKey: {
            organizationId,
            idempotencyKey: payload.idempotencyKey,
          },
        },
        include: shipmentInclude,
      });
      if (existing) return toApiShipment(existing);
    }
    throw error;
  }
}

export async function updateShipment(
  id: string,
  patch: Partial<Shipment>
): Promise<Shipment | null> {
  const existing = await findShipmentRecord(id.trim());
  if (!existing) return null;

  const nextStatus = patch.status ?? STATUS_FROM_DB[existing.status];
  const now = new Date();
  let departedAt = existing.departedAt;
  let deliveredAt = existing.deliveredAt;
  if (patch.status && STATUS_TO_DB[patch.status] !== existing.status) {
    if (patch.status !== "Draft" && !departedAt) departedAt = now;
    if (patch.status === "Delivered") deliveredAt = deliveredAt ?? now;
    if (patch.status === "Draft") deliveredAt = null;
  }

  const [updated] = await prisma.$transaction([
    prisma.shipment.update({
      where: { id: existing.id },
      data: {
        status: STATUS_TO_DB[nextStatus],
        departedAt,
        deliveredAt,
      },
      include: shipmentInclude,
    }),
    prisma.produceBatch.update({
      where: { id: existing.produceBatchId },
      data: { status: BATCH_STATUS_TO_DB[nextStatus] },
    }),
  ]);

  return toApiShipment(updated);
}

export async function deleteShipment(id: string): Promise<Shipment | null> {
  const existing = await findShipmentRecord(id.trim());
  if (!existing) return null;
  await prisma.$transaction(async (tx) => {
    await tx.shipment.delete({ where: { id: existing.id } });
    await tx.produceBatch.delete({ where: { id: existing.produceBatchId } });
  });
  return toApiShipment(existing);
}

export async function computeColdChainMetrics(): Promise<ColdChainMetrics> {
  const shipments = (await allShipmentRecords()).map(toApiShipment);
  const total = shipments.length;
  const active = shipments.filter((item) => ACTIVE_STATUSES.includes(item.status)).length;
  const compromised = shipments.filter((item) => item.status === "Compromised").length;
  const breached = shipments.filter(
    (item) => item.temperatureAlert || item.humidityAlert || item.tamperAlert
  ).length;
  const deliveryHours = shipments
    .filter((item) => item.status === "Delivered" && item.deliveredAt)
    .map((item) => {
      const start = new Date(item.dispatchedAt ?? item.createdAt).getTime();
      const end = new Date(item.deliveredAt as string).getTime();
      return Math.max(0, (end - start) / 3_600_000);
    });
  const average = deliveryHours.length
    ? deliveryHours.reduce((sum, hours) => sum + hours, 0) / deliveryHours.length
    : 0;

  return {
    totalShipments: total,
    activeShipments: active,
    lossRatePct: total ? Number(((compromised / total) * 100).toFixed(1)) : 0,
    avgDeliveryHours: Number(average.toFixed(1)),
    temperatureBreachCount: breached,
    complianceRatePct: total
      ? Number((((total - breached) / total) * 100).toFixed(1))
      : 100,
  };
}
