import { apiClient } from "./api-client";
import { SensorReading } from "@/lib/types";

export const iotService = {
  async getLatestReadings(shipmentId: string) {
    return apiClient.get<SensorReading[]>(`/api/iot?shipmentId=${shipmentId}`);
  },

  async logReading(reading: Partial<SensorReading>) {
    return apiClient.post<SensorReading>("/api/iot", reading);
  },
};
