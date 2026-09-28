import { apiClient } from "./api-client";
import { Shipment, PaginatedResult, PaginationParams, ColdChainMetrics } from "@/lib/types";

export const shipmentService = {
  async getShipments(params: PaginationParams) {
    const query = new URLSearchParams({
      page: params.page.toString(),
      pageSize: params.pageSize.toString(),
      ...(params.searchQuery ? { searchQuery: params.searchQuery } : {}),
      ...(params.statusFilter ? { statusFilter: params.statusFilter } : {}),
      ...(params.categoryFilter ? { categoryFilter: params.categoryFilter } : {}),
      ...(params.sortBy ? { sortBy: params.sortBy } : {}),
      ...(params.sortOrder ? { sortOrder: params.sortOrder } : {}),
    });
    return apiClient.get<PaginatedResult<Shipment>>(`/api/shipments?${query.toString()}`);
  },

  async getColdChainMetrics() {
    return apiClient.get<ColdChainMetrics>("/api/shipments/stats");
  },

  async getShipmentById(id: string) {
    return apiClient.get<Shipment>(`/api/shipments/${id}`);
  },

  async createShipment(shipment: Partial<Shipment>) {
    return apiClient.post<Shipment>("/api/shipments", shipment);
  },

  async updateShipmentStatus(id: string, status: Shipment["status"]) {
    return apiClient.put<Shipment>(`/api/shipments/${id}`, { status });
  },
};
