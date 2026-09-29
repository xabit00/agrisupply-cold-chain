import { apiClient } from "./api-client";
import type { GeoCoordinate, Geofence, GeofenceAlert } from "@/lib/types";

export const trackingService = {
  async getGeofences() {
    return apiClient.get<Geofence[]>("/api/tracking?type=geofences");
  },

  async getGeofenceAlerts(shipmentId?: string) {
    const query = shipmentId ? `?shipmentId=${encodeURIComponent(shipmentId)}` : "";
    return apiClient.get<GeofenceAlert[]>(`/api/tracking${query}`);
  },

  async evaluatePosition(shipmentId: string, coordinate: GeoCoordinate) {
    return apiClient.post<GeofenceAlert[]>("/api/tracking", { shipmentId, coordinate });
  },
};