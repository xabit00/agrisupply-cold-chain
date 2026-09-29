import {
  Shipment,
  ShipmentCreateRequest,
  ShipmentCompliance,
  LocationCheckpoint,
  PaginatedResult,
  PaginationParams,
  ColdChainMetrics,
  ProduceCategory,
} from "@/lib/types";
import { initialMockShipments } from "@/lib/constants/mock-shipments";
import { AMBIENT_PRESET } from "@/lib/constants/produce-presets";
import { MOCK_USERS } from "@/lib/constants/roles";

/**
 * Create payload: the validated create DTO plus the optional server-assigned
 * fields the store is allowed to honour (tracking number, status, timestamps and
 * alert flags). Declared explicitly rather than intersected with `Partial<Shipment>`
 * so callers never have to supply server-owned geo coordinates.
 */
export type ShipmentCreatePayload = ShipmentCreateRequest & {
  trackingNumber?: string;
  status?: Shipment["status"];
  currentLocation?: Shipment["currentLocation"];
  temperatureAlert?: boolean;
  humidityAlert?: boolean;
  tamperAlert?: boolean;
  dispatchedAt?: string;
  deliveredAt?: string;
  produce?: ShipmentCreateRequest["produce"] & { id?: string };
};

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

const STAFF_MEMBERS = Object.values(MOCK_USERS).map((account) => account.user);

/** Resolves a custodian id (transporter / warehouse / retailer) to a display label. */
function custodianLabel(id?: string): string | undefined {
  if (!id) return undefined;
  const match = STAFF_MEMBERS.find((member) => member.id === id);
  return match ? `${match.name} · ${match.organizationId}` : undefined;
}

function resolveCheckpoint(
  provided: Partial<LocationCheckpoint> | undefined,
  fallbackName: string,
  fallbackLabel?: string
): LocationCheckpoint {
  if (provided && provided.name && provided.name.trim().length > 0) {
    return {
      name: provided.name,
      address: provided.address ?? "Address pending confirmation",
      coordinates: provided.coordinates ?? { lat: 0, lng: 0 },
      reachedAt: provided.reachedAt,
    };
  }

  return {
    name: fallbackLabel ?? fallbackName,
    address: "Address pending confirmation",
    coordinates: { lat: 0, lng: 0 },
  };
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

export function createShipment(payload: ShipmentCreatePayload): Shipment {
  const now = new Date().toISOString();
  const produce = payload.produce;
  const categorySuffix = (produce?.category ?? "General").slice(0, 4).toUpperCase();

  const storageMode = payload.storageMode ?? AMBIENT_PRESET.storageMode;
  // Ambient lots submit no controlled-atmosphere window, so the ambient envelope is
  // recorded instead — the lot still evaluates against an SLA afterwards.
  const ambientEnvelope =
    storageMode === "Ambient" ? AMBIENT_PRESET : undefined;

  const compliance: ShipmentCompliance | undefined = payload.destinationType
    ? {
        destinationType: payload.destinationType,
        requiresTransport: payload.requiresTransport ?? false,
        tamperSealEnabled: payload.tamperSealEnabled ?? false,
        sealId: payload.sealId,
      }
    : undefined;

  const destinationFallback =
    custodianLabel(payload.warehouseId) ??
    custodianLabel(payload.retailerId) ??
    "Direct consumer drop-off";

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
      optimalTempMin: produce?.optimalTempMin ?? ambientEnvelope?.tempMin ?? 0,
      optimalTempMax: produce?.optimalTempMax ?? ambientEnvelope?.tempMax ?? 4,
      optimalHumidityMin:
        produce?.optimalHumidityMin ?? ambientEnvelope?.humidityMin ?? 70,
      optimalHumidityMax:
        produce?.optimalHumidityMax ?? ambientEnvelope?.humidityMax ?? 90,
    },
    origin: resolveCheckpoint(payload.origin, "Unspecified Origin"),
    destination: resolveCheckpoint(
      payload.destination,
      "Unspecified Destination",
      destinationFallback
    ),
    status: payload.status ?? "Draft",
    storageMode,
    containers: payload.containers?.length ? payload.containers : undefined,
    currentLocation: payload.currentLocation,
    temperatureAlert: payload.temperatureAlert ?? false,
    humidityAlert: payload.humidityAlert ?? false,
    tamperAlert: payload.tamperAlert ?? false,
    photos: payload.photos?.length ? payload.photos : undefined,
    notes: payload.notes,
    compliance,
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

  const now = new Date().toISOString();

  // Stage bookkeeping: leaving Draft stamps the dispatch time, reaching
  // Delivered stamps the delivery time (and reverting to Draft clears it).
  // Keeps the delivery-cycle analytics truthful when the Kanban board moves a
  // card that has no handoff timestamps yet.
  let dispatchedAt = existing.dispatchedAt;
  let deliveredAt = existing.deliveredAt;
  if (patch.status && patch.status !== existing.status) {
    if (patch.status !== "Draft" && !dispatchedAt) dispatchedAt = now;
    if (patch.status === "Delivered") deliveredAt = deliveredAt ?? now;
    if (patch.status === "Draft") deliveredAt = undefined;
  }

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
    dispatchedAt,
    deliveredAt,
    updatedAt: now,
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
