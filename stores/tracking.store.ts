import { create } from "zustand";
import { GeoCoordinate, GeofenceAlert } from "@/lib/types";

interface TrackingState {
  activeVehicles: Record<string, GeoCoordinate>;
  alerts: GeofenceAlert[];
  selectedVehicleId: string | null;
  updateVehiclePosition: (shipmentId: string, coordinate: GeoCoordinate) => void;
  setSelectedVehicleId: (id: string | null) => void;
  addAlert: (alert: GeofenceAlert) => void;
  clearAlerts: () => void;
}

export const useTrackingStore = create<TrackingState>((set) => ({
  activeVehicles: {},
  alerts: [],
  selectedVehicleId: null,
  updateVehiclePosition: (shipmentId, coordinate) =>
    set((state) => ({
      activeVehicles: { ...state.activeVehicles, [shipmentId]: coordinate },
    })),
  setSelectedVehicleId: (selectedVehicleId) => set({ selectedVehicleId }),
  addAlert: (alert) =>
    set((state) => ({
      alerts: [alert, ...state.alerts.slice(0, 49)],
    })),
  clearAlerts: () => set({ alerts: [] }),
}));

