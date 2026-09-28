import { create } from "zustand";
import { Shipment, PaginationParams } from "@/lib/types";

interface ShipmentState {
  shipments: Shipment[];
  selectedShipment: Shipment | null;
  pagination: PaginationParams;
  totalShipments: number;
  setShipments: (shipments: Shipment[], total: number) => void;
  setSelectedShipment: (shipment: Shipment | null) => void;
  setPagination: (params: Partial<PaginationParams>) => void;
}

export const useShipmentStore = create<ShipmentState>((set) => ({
  shipments: [],
  selectedShipment: null,
  pagination: {
    page: 1,
    pageSize: 10,
    statusFilter: "ALL",
    categoryFilter: "ALL",
  },
  totalShipments: 0,
  setShipments: (shipments, total) => set({ shipments, totalShipments: total }),
  setSelectedShipment: (selectedShipment) => set({ selectedShipment }),
  setPagination: (params) =>
    set((state) => ({
      pagination: { ...state.pagination, ...params },
    })),
}));
