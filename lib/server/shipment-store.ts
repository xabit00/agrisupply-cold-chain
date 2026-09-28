import {
  Shipment,
  PaginatedResult,
  PaginationParams,
  ColdChainMetrics,
  ProduceCategory,
} from "@/lib/types";
import { initialMockShipments } from "@/lib/constants/mock-shipments";

/**
 * Module-scoped in-memory transactional store.
 * State persists for the lifetime of the Node server process, which is sufficient
 * for the hackathon build; every route handler reads/writes through this facade so
 * mutations stay consistent across all endpoints.
 */
let shipments: Shipment[] = initialMockShipments.map((shipment) => ({
  ...shipment,
  produce: { ...shipment.produce },
  origin: { ...shipment.origin },
  destination: { ...shipment.destination },
}));

let idSequence = initialMockShipments.length + 1;

const ACTIVE_STATUSES: Shipment["status"][] = ["Harvested", "InTransit", "ColdStorage"];

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
    case "createdAt":
    default:
      return shipment.createdAt;
  }
}

function matchesSearch(shipment: Shipment, term: string): boolean {
  return (
    shipment.trackingNumber.toLowerCase().includes(term) ||
    shipment.produce.name.toLowerCase().includes(term) ||
    shipment.produce.category.toLowerCase().includes(term) ||
    shipment.origin.name.toLowerCase().includes(term) ||
    shipment.origin.address.toLowerCase().includes(term) ||
    shipment.destination.name.toLowerCase().includes(term) ||
    shipment.destination.address.toLowerCase().includes(term)
  );
}

export function listShipments(params: Partial<PaginationParams>): PaginatedResult<Shipment> {
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 10));
  const searchQuery = (params.searchQuery ?? "").trim().toLowerCase();
  const statusFilter = params.statusFilter ?? "ALL";
  const categoryFilter: ProduceCategory | "ALL" = params.categoryFilter ?? "ALL";
  const sortBy = params.sortBy ?? "createdAt";
  const sortOrder: "asc" | "desc" = params.sortOrder ?? "desc";

  let filtered = [...shipments];

  if (searchQuery) {
    filtered = filtered.filter((shipment) => matchesSearch(shipment, searchQuery));
  }

  if (statusFilter !== "ALL") {
    filtered = filtered.filter((shipment) => shipment.status === statusFilter);
  }

  if (categoryFilter !== "ALL") {
    filtered = filtered.filter((shipment) => shipment.produce.category === categoryFilter);
  }

  filtered.sort((a, b) => {
    const aVal = sortValue(a, sortBy);
    const bVal = sortValue(b, sortBy);
    if (aVal === bVal) return a.id.localeCompare(b.id);
    const comparison = aVal > bVal ? 1 : -1;
    return sortOrder === "asc" ? comparison : -comparison;
  });

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  const startIndex = (safePage - 1) * pageSize;

  return {
    items: filtered.slice(startIndex, startIndex + pageSize),
    total,
    page: safePage,
    pageSize,
    totalPages,
  };
}

export function findShipmentById(id: string): Shipment | undefined {
  const needle = id.trim().toLowerCase();
  return shipments.find(
    (shipment) =>
      shipment.id.toLowerCase() === needle ||
      shipment.trackingNumber.toLowerCase() === needle
  );
}

export function createShipment(payload: Partial<Shipment>): Shipment {
  const now = new Date().toISOString();
  const produce = payload.produce;
  const categorySuffix = (produce?.category ?? "General").slice(0, 4).toUpperCase();

  const shipment: Shipment = {
    id: `SHP-${String(idSequence++).padStart(3, "0")}`,
    trackingNumber:
      payload.trackingNumber ??
      `TRK-${Math.floor(10000 + Math.random() * 89999)}-${categorySuffix}`,
    farmerId: payload.farmerId ?? "usr_farm_elena",
    transporterId: payload.transporterId,
    warehouseId: payload.warehouseId,
    retailerId: payload.retailerId,
    produce: {
      id: produce?.id ?? `PRD-${Date.now()}`,
      name: produce?.name ?? "Unspecified Produce",
      category: produce?.category ?? "Vegetables",
      quantityKg: produce?.quantityKg ?? 0,
      optimalTempMin: produce?.optimalTempMin ?? 0,
      optimalTempMax: produce?.optimalTempMax ?? 4,
      optimalHumidityMin: produce?.optimalHumidityMin ?? 70,
      optimalHumidityMax: produce?.optimalHumidityMax ?? 90,
    },
    origin: payload.origin ?? {
      name: "Unspecified Origin",
      address: "Not provided",
      coordinates: { lat: 0, lng: 0 },
    },
    destination: payload.destination ?? {
      name: "Unspecified Destination",
      address: "Not provided",
      coordinates: { lat: 0, lng: 0 },
    },
    status: payload.status ?? "Draft",
    currentLocation: payload.currentLocation,
    temperatureAlert: payload.temperatureAlert ?? false,
    humidityAlert: payload.humidityAlert ?? false,
    tamperAlert: payload.tamperAlert ?? false,
    createdAt: now,
    dispatchedAt: payload.dispatchedAt,
    deliveredAt: payload.deliveredAt,
    updatedAt: now,
  };

  shipments = [shipment, ...shipments];
  return shipment;
}

export function updateShipment(id: string, patch: Partial<Shipment>): Shipment | null {
  const existing = findShipmentById(id);
  if (!existing) return null;

  const updated: Shipment = {
    ...existing,
    ...patch,
    id: existing.id,
    trackingNumber: patch.trackingNumber ?? existing.trackingNumber,
    produce: patch.produce ? { ...existing.produce, ...patch.produce } : existing.produce,
    origin: patch.origin ? { ...existing.origin, ...patch.origin } : existing.origin,
    destination: patch.destination
      ? { ...existing.destination, ...patch.destination }
      : existing.destination,
    updatedAt: new Date().toISOString(),
  };

  shipments = shipments.map((shipment) =>
    shipment.id === existing.id ? updated : shipment
  );
  return updated;
}

export function computeColdChainMetrics(): ColdChainMetrics {
  const total = shipments.length;
  const active = shipments.filter((s) => ACTIVE_STATUSES.includes(s.status)).length;
  const compromised = shipments.filter((s) => s.status === "Compromised").length;
  const breached = shipments.filter(
    (s) => s.temperatureAlert || s.humidityAlert || s.tamperAlert
  ).length;

  const deliveredDurations = shipments
    .filter((s) => s.status === "Delivered" && Boolean(s.deliveredAt))
    .map((s) => {
      const start = new Date(s.dispatchedAt ?? s.createdAt).getTime();
      const end = new Date(s.deliveredAt as string).getTime();
      return Math.max(0, (end - start) / (1000 * 60 * 60));
    });

  const avgDeliveryHours =
    deliveredDurations.length > 0
      ? deliveredDurations.reduce((sum, hours) => sum + hours, 0) / deliveredDurations.length
      : 0;

  return {
    totalShipments: total,
    activeShipments: active,
    lossRatePct: total > 0 ? Number(((compromised / total) * 100).toFixed(1)) : 0,
    avgDeliveryHours: Number(avgDeliveryHours.toFixed(1)),
    temperatureBreachCount: breached,
    complianceRatePct:
      total > 0 ? Number((((total - breached) / total) * 100).toFixed(1)) : 100,
  };
}
