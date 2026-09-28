import { create } from "zustand";
import { Shipment, PaginationParams, ShipmentStatus, ProduceCategory } from "@/lib/types";

interface ShipmentState {
  shipments: Shipment[];
  selectedShipment: Shipment | null;
  selectedShipmentId: string | null;
  activeView: "table" | "kanban";
  pagination: PaginationParams;
  totalShipments: number;
  setShipments: (shipments: Shipment[], total: number) => void;
  setSelectedShipment: (shipment: Shipment | null) => void;
  setSelectedShipmentId: (id: string | null) => void;
  setActiveView: (view: "table" | "kanban") => void;
  setPagination: (params: Partial<PaginationParams>) => void;
  setSearchQuery: (query: string) => void;
  setStatusFilter: (status: ShipmentStatus | "ALL") => void;
  setCategoryFilter: (category: ProduceCategory | "ALL") => void;
  resetFilters: () => void;
}

const initialPagination: PaginationParams = {
  page: 1,
  pageSize: 10,
  searchQuery: "",
  statusFilter: "ALL",
  categoryFilter: "ALL",
  sortBy: "createdAt",
  sortOrder: "desc",
};

export const useShipmentStore = create<ShipmentState>((set) => ({
  shipments: [],
  selectedShipment: null,
  selectedShipmentId: null,
  activeView: "table",
  pagination: initialPagination,
  totalShipments: 0,
  setShipments: (shipments, total) => set({ shipments, totalShipments: total }),
  setSelectedShipment: (selectedShipment) =>
    set({
      selectedShipment,
      selectedShipmentId: selectedShipment?.id ?? null,
    }),
  setSelectedShipmentId: (selectedShipmentId) =>
    set({ selectedShipmentId }),
  setActiveView: (activeView) => set({ activeView }),
  setPagination: (params) =>
    set((state) => ({
      pagination: { ...state.pagination, ...params },
    })),
  setSearchQuery: (searchQuery) =>
    set((state) => ({
      pagination: { ...state.pagination, searchQuery, page: 1 },
    })),
  setStatusFilter: (statusFilter) =>
    set((state) => ({
      pagination: { ...state.pagination, statusFilter, page: 1 },
    })),
  setCategoryFilter: (categoryFilter) =>
    set((state) => ({
      pagination: { ...state.pagination, categoryFilter, page: 1 },
    })),
  resetFilters: () =>
    set((state) => ({
      pagination: {
        ...initialPagination,
        page: 1,
        pageSize: state.pagination.pageSize,
      },
    })),
}));

