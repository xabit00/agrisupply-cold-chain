import { apiClient } from "./api-client";
import { SensorReading } from "@/lib/types";

export const iotService = {
  /**
   * Deterministic bootstrap history for the live chart, fetched before the
   * first socket event so the panel is never empty.
   */
  async getTelemetryHistory(shipmentId: string, points = 30) {
    const query = new URLSearchParams({
      shipmentId,
      points: points.toString(),
    });
    return apiClient.get<SensorReading[]>(`/api/iot?${query.toString()}`);
  },

  /** Persists a single reading — used when a breach crosses the threshold. */
  async logReading(reading: SensorReading) {
    return apiClient.post<SensorReading>("/api/iot", reading);
  },
};
