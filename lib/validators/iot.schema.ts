import { z } from "zod";

/** Geo point as stored on the shipment domain model. */
export const geoCoordinateSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  altitude: z.number().optional(),
});

/**
 * Canonical telemetry contract: shared by the socket server's outbound
 * payload, `GET /api/iot` history output and `POST /api/iot` ingestion — so a
 * malformed reading can never enter the stream or the register.
 */
export const sensorReadingSchema = z.object({
  id: z.string().min(1, "Reading id is required"),
  shipmentId: z.string().min(1, "Reading must belong to a shipment"),
  temperature: z.number({ invalid_type_error: "Temperature is required" }).min(-60).max(80),
  humidity: z
    .number({ invalid_type_error: "Humidity is required" })
    .min(0, "Humidity cannot be below 0%")
    .max(100, "Humidity cannot exceed 100%"),
  batteryPct: z.number().min(0, "Battery cannot be below 0%").max(100, "Battery cannot exceed 100%"),
  signalStrengthDbm: z.number().min(-130).max(0),
  ambientLightLux: z.number().min(0).optional(),
  location: geoCoordinateSchema,
  timestamp: z.string().datetime("Timestamp must be an ISO-8601 date"),
  isBreached: z.boolean(),
  breachReason: z
    .enum(["TEMP_HIGH", "TEMP_LOW", "HUMIDITY_HIGH", "HUMIDITY_LOW", "TAMPER"])
    .optional(),
});

export const sensorReadingListSchema = z.array(sensorReadingSchema);

export type SensorReadingInput = z.infer<typeof sensorReadingSchema>;
