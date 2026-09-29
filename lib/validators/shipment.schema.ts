import { z } from "zod";
import {
  DESTINATION_TYPES,
  MAX_PHOTO_BYTES,
  MAX_SHIPMENT_PHOTOS,
  PRODUCE_CATEGORIES,
  SHIPMENT_STATUSES,
  STORAGE_MODES,
  requiresPhotoEvidence,
} from "@/lib/constants/produce-presets";
import { MOCK_USERS } from "@/lib/constants/roles";

const MAX_PHOTO_KB = Math.round(MAX_PHOTO_BYTES / 1000);
const USERS = Object.values(MOCK_USERS).map((account) => account.user);
const VALID_WAREHOUSE_IDS = new Set(
  USERS.filter((user) => user.role === "WarehouseAdmin").map((user) => user.id)
);
const VALID_RETAILER_IDS = new Set(
  USERS.filter((user) => user.role === "Retailer").map((user) => user.id)
);
const VALID_TRANSPORTER_IDS = new Set(
  USERS.filter((user) => user.role === "Transporter").map((user) => user.id)
);

/**
 * Body accepted by PUT /api/shipments/[id] — a stage transition driven by the
 * Kanban board. `.strict()` so a caller cannot smuggle arbitrary fields onto
 * the shipment record.
 */
export const shipmentStatusUpdateSchema = z
  .object({
    status: z.enum(SHIPMENT_STATUSES, {
      errorMap: () => ({
        message: "Unknown pipeline stage — must be a valid shipment status",
      }),
    }),
  })
  .strict();


export const shipmentContainerSchema = z.object({
  id: z.string().min(1),
  label: z
    .string()
    .trim()
    .min(1, "Container label is required")
    .max(40, "Container label must be 40 characters or fewer"),
  quantityKg: z
    .number({ invalid_type_error: "Container weight is required" })
    .positive("Container weight must be greater than 0"),
  sealId: z.string().trim().max(40).optional(),
});

export const shipmentPhotoSchema = z.object({
  id: z.string().min(1),
  label: z.string().trim().min(1, "Photo label is required").max(60),
  dataUrl: z.string().startsWith("data:image/", "Photo must be a captured image"),
  source: z.enum(["camera", "upload"]),
  capturedAt: z.string().min(1),
  sizeBytes: z.number().nonnegative(),
});

/**
 * Canonical shipment create schema — shared by the multi-step form (client) and
 * POST /api/shipments (server). Conditional requirements are declared once here:
 * the cold-chain envelope is mandatory unless the lot ships Ambient, the
 * destination type decides which custodian id is required, seal references are
 * required when tamper sealing is on, container weights must reconcile to the
 * batch weight, and perishable-evidence categories must attach a photo.
 */
export const shipmentSchema = z
  .object({
    farmerId: z.string().min(1, "Farmer context is missing — sign in again"),
    destinationType: z.enum(DESTINATION_TYPES),
    requiresTransport: z.boolean(),
    transporterId: z.string().optional(),
    warehouseId: z.string().optional(),
    retailerId: z.string().optional(),
    storageMode: z.enum(STORAGE_MODES),
    tamperSealEnabled: z.boolean(),
    sealId: z.string().trim().max(40, "Seal reference must be 40 characters or fewer").optional(),
    splitsIntoContainers: z.boolean(),
    containers: z.array(shipmentContainerSchema),
    photos: z
      .array(shipmentPhotoSchema)
      .max(MAX_SHIPMENT_PHOTOS, `A maximum of ${MAX_SHIPMENT_PHOTOS} photos can be attached`),
    notes: z.string().trim().max(500, "Notes must be 500 characters or fewer").optional(),
    produce: z.object({
      name: z
        .string()
        .trim()
        .min(2, "Produce name must be at least 2 characters")
        .max(80, "Produce name must be 80 characters or fewer"),
      category: z.enum(PRODUCE_CATEGORIES),
      quantityKg: z
        .number({ invalid_type_error: "Quantity is required" })
        .positive("Quantity must be greater than 0")
        .max(50000, "Quantity looks unrealistic (maximum 50,000 kg)"),
      optimalTempMin: z
        .number({ invalid_type_error: "Minimum temperature is required" })
        .min(-30, "Temperature cannot be below -30°C")
        .max(50, "Temperature cannot exceed 50°C")
        .optional(),
      optimalTempMax: z
        .number({ invalid_type_error: "Maximum temperature is required" })
        .min(-30, "Temperature cannot be below -30°C")
        .max(50, "Temperature cannot exceed 50°C")
        .optional(),
      optimalHumidityMin: z
        .number({ invalid_type_error: "Minimum humidity is required" })
        .min(0, "Humidity cannot be below 0%")
        .max(100, "Humidity cannot exceed 100%")
        .optional(),
      optimalHumidityMax: z
        .number({ invalid_type_error: "Maximum humidity is required" })
        .min(0, "Humidity cannot be below 0%")
        .max(100, "Humidity cannot exceed 100%")
        .optional(),
    }),
    origin: z.object({
      name: z.string().trim().min(2, "Origin name is required").max(80),
      address: z.string().trim().min(5, "Origin address is required").max(160),
    }),
    destination: z.object({
      name: z.string().trim().min(2, "Destination name is required").max(80),
      address: z.string().trim().min(5, "Destination address is required").max(160),
    }),
  })
  .superRefine((values, ctx) => {
    const { produce, storageMode } = values;

    // --- Conditional cold-chain envelope (hidden inputs for Ambient lots) ---
    if (storageMode !== "Ambient") {
      if (produce.optimalTempMin === undefined || produce.optimalTempMax === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["produce", "optimalTempMax"],
          message: "Temperature window is required for refrigerated and frozen lots",
        });
      } else if (produce.optimalTempMax <= produce.optimalTempMin) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["produce", "optimalTempMax"],
          message: "Maximum temperature must be greater than the minimum",
        });
      }

      if (
        produce.optimalHumidityMin === undefined ||
        produce.optimalHumidityMax === undefined
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["produce", "optimalHumidityMax"],
          message: "Humidity window is required for refrigerated and frozen lots",
        });
      } else if (produce.optimalHumidityMax <= produce.optimalHumidityMin) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["produce", "optimalHumidityMax"],
          message: "Maximum humidity must be greater than the minimum",
        });
      }
    }

    // --- Destination custodian depends on the selected destination type ---
    if (values.destinationType === "Warehouse" && !values.warehouseId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["warehouseId"],
        message: "Select the receiving cold-storage facility",
      });
    } else if (
      values.destinationType === "Warehouse" &&
      values.warehouseId &&
      !VALID_WAREHOUSE_IDS.has(values.warehouseId)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["warehouseId"],
        message: "Select a valid receiving cold-storage facility",
      });
    }

    if (values.destinationType === "RetailOutlet" && !values.retailerId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["retailerId"],
        message: "Select the receiving retail outlet",
      });
    } else if (
      values.destinationType === "RetailOutlet" &&
      values.retailerId &&
      !VALID_RETAILER_IDS.has(values.retailerId)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["retailerId"],
        message: "Select a valid receiving retail outlet",
      });
    }

    if (values.requiresTransport && !values.transporterId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["transporterId"],
        message: "Select the assigned transporter",
      });
    } else if (
      values.requiresTransport &&
      values.transporterId &&
      !VALID_TRANSPORTER_IDS.has(values.transporterId)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["transporterId"],
        message: "Select a valid assigned transporter",
      });
    }

    // --- Tamper sealing cascade ---
    if (values.tamperSealEnabled) {
      if ((values.sealId ?? "").trim().length < 4) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["sealId"],
          message: "Seal reference must be at least 4 characters",
        });
      }

      (values.containers ?? []).forEach((container, index) => {
        if ((container.sealId ?? "").trim().length < 4) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["containers", index, "sealId"],
            message: "Each sealed container needs its own seal reference",
          });
        }
      });
    }

    // --- Container split must reconcile with the batch weight ---
    if (values.splitsIntoContainers) {
      const containers = values.containers ?? [];

      if (containers.length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["containers"],
          message: "Add at least two containers when splitting a batch across units",
        });
      } else {
        const total = containers.reduce(
          (sum, container) =>
            sum + (Number.isFinite(container.quantityKg) ? container.quantityKg : 0),
          0
        );

        if (Math.abs(total - produce.quantityKg) > 0.01) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["containers"],
            message: `Container weights must total ${produce.quantityKg} kg (currently ${Number(
              total.toFixed(2)
            )} kg)`,
          });
        }
      }
    }

    // --- Photo evidence caps + perishable enforcement ---
    values.photos.forEach((photo, index) => {
      if (photo.sizeBytes > MAX_PHOTO_BYTES) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["photos", index, "dataUrl"],
          message: `Photo exceeds the ${MAX_PHOTO_KB} KB limit — retake or downscale it`,
        });
      }
    });

    if (requiresPhotoEvidence(produce.category) && values.photos.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["photos"],
        message: `${produce.category} lots require at least one cold-chain evidence photo`,
      });
    }
  });

export type ShipmentFormData = z.infer<typeof shipmentSchema>;
export type ShipmentContainerFormData = z.infer<typeof shipmentContainerSchema>;
export type ShipmentPhotoFormData = z.infer<typeof shipmentPhotoSchema>;
