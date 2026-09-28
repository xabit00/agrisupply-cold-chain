import { DestinationType, ProduceCategory, ShipmentStatus, StorageMode } from "@/lib/types";

/**
 * Single source of truth for produce categories, shipment statuses and
 * cold-chain SLA presets. Consumed by the API filter allow-lists, the data
 * table toolbars and the M4 multi-step form.
 */
// `as const` tuples (not plain arrays) so zod's z.enum() can consume them directly.
export const PRODUCE_CATEGORIES = [
  "Dairy",
  "Fruits",
  "Vegetables",
  "Meat",
  "Seafood",
  "Flowers",
] as const satisfies readonly ProduceCategory[];

export const SHIPMENT_STATUSES = [
  "Draft",
  "Harvested",
  "InTransit",
  "ColdStorage",
  "Delivered",
  "Compromised",
] as const satisfies readonly ShipmentStatus[];

export const STORAGE_MODES = [
  "Ambient",
  "Refrigerated",
  "Frozen",
] as const satisfies readonly StorageMode[];

export const DESTINATION_TYPES = [
  "Warehouse",
  "RetailOutlet",
  "DirectConsumer",
] as const satisfies readonly DestinationType[];

export interface ColdChainPreset {
  /** Target temperature window in Celsius. */
  tempMin: number;
  tempMax: number;
  /** Target relative humidity window in percent. */
  humidityMin: number;
  humidityMax: number;
  /** Perishable lots require photographic cold-chain evidence. */
  perishable: boolean;
  storageMode: StorageMode;
}

export const PRODUCE_CATEGORY_PRESETS: Record<ProduceCategory, ColdChainPreset> = {
  Dairy: {
    tempMin: 1.5,
    tempMax: 4,
    humidityMin: 65,
    humidityMax: 85,
    perishable: true,
    storageMode: "Refrigerated",
  },
  Fruits: {
    tempMin: 0.5,
    tempMax: 6,
    humidityMin: 85,
    humidityMax: 95,
    perishable: true,
    storageMode: "Refrigerated",
  },
  Vegetables: {
    tempMin: 0.5,
    tempMax: 4,
    humidityMin: 90,
    humidityMax: 98,
    perishable: true,
    storageMode: "Refrigerated",
  },
  Meat: {
    tempMin: -2,
    tempMax: 0,
    humidityMin: 75,
    humidityMax: 85,
    perishable: true,
    storageMode: "Frozen",
  },
  Seafood: {
    tempMin: -1,
    tempMax: 1.5,
    humidityMin: 85,
    humidityMax: 95,
    perishable: true,
    storageMode: "Frozen",
  },
  Flowers: {
    tempMin: 1,
    tempMax: 3,
    humidityMin: 85,
    humidityMax: 95,
    perishable: false,
    storageMode: "Refrigerated",
  },
};

/** Fallback envelope applied to Ambient (shelf-stable) lots with no cold-chain inputs. */
export const AMBIENT_PRESET: ColdChainPreset = {
  tempMin: 10,
  tempMax: 25,
  humidityMin: 40,
  humidityMax: 70,
  perishable: false,
  storageMode: "Ambient",
};

/** Categories where at least one cold-chain evidence photo is mandatory. */
export const PHOTO_REQUIRED_CATEGORIES: readonly ProduceCategory[] = ["Meat", "Seafood"];

export const MAX_SHIPMENT_PHOTOS = 3;

/** Per-photo ceiling after client-side downscaling (bytes of the data URL). */
export const MAX_PHOTO_BYTES = 450_000;

/** Long-edge pixel cap applied when downscaling captured/uploaded photos. */
export const PHOTO_MAX_EDGE_PX = 640;

export function isPerishableCategory(category: ProduceCategory): boolean {
  return PRODUCE_CATEGORY_PRESETS[category].perishable;
}

export function requiresPhotoEvidence(category: ProduceCategory): boolean {
  return PHOTO_REQUIRED_CATEGORIES.includes(category);
}
