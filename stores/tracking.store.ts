import { create } from "zustand";
import { GeoCoordinate, GeofenceAlert } from "@/lib/types";

interface TrackingState {
  activeVehicles: Record<string, GeoCoordinate>;
  alerts: GeofenceAlert[];
  updateVehiclePosition: (shipmentId: string, coordinate: GeoCoordinate) => void;
  addAlert: (alert: GeofenceAlert) => void;
}

export const useTrackingStore = create<TrackingState>((set) => ({
  activeVehicles: {},
  alerts: [],
  updateVehiclePosition: (shipmentId, coordinate) =>
    set((state) => ({
      activeVehicles: { ...state.activeVehicles, [shipmentId]: coordinate },
    })),
  addAlert: (alert) =>
    set((state) => ({
      alerts: [alert, ...state.alerts.slice(0, 49)],
    })),
}));
