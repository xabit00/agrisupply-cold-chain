import { PaginationParams } from "@/lib/types";

export const queryKeys = {
  shipments: {
    all: ["shipments"] as const,
    list: (params: PaginationParams) => ["shipments", "list", params] as const,
    detail: (id: string) => ["shipments", "detail", id] as const,
  },
  iot: {
    telemetry: (shipmentId: string) => ["iot", "telemetry", shipmentId] as const,
  },
  tracking: {
    geofences: ["tracking", "geofences"] as const,
    alerts: (shipmentId?: string) => ["tracking", "alerts", shipmentId ?? "all"] as const,
  },
  auth: {
    me: ["auth", "me"] as const,
  },
} as const;
