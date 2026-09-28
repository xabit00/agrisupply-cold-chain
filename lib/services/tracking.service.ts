import { apiClient } from "./api-client";
import { Geofence, GeofenceAlert } from "@/lib/types";

export const trackingService = {
  async getGeofences() {
    return apiClient.get<Geofence[]>("/api/tracking?type=geofences");
  },

  async getGeofenceAlerts(shipmentId?: string) {
    const query = shipmentId ? `?shipmentId=${shipmentId}` : "";
    return apiClient.get<GeofenceAlert[]>(`/api/tracking${query}`);
  },
};
