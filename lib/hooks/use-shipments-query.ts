"use client";

import { useQuery } from "@tanstack/react-query";
import { shipmentService } from "@/lib/services/shipment.service";
import { queryKeys } from "@/lib/services/query-keys";
import { PaginationParams } from "@/lib/types";

export function useShipmentsQuery(params: PaginationParams) {
  return useQuery({
    queryKey: queryKeys.shipments.list(params),
    queryFn: async () => {
      const response = await shipmentService.getShipments(params);
      if (!response.success || !response.data) {
        throw new Error(response.error || "Failed to fetch shipments");
      }
      return response.data;
    },
  });
}

export function useShipmentDetailQuery(id: string | null) {
  return useQuery({
    queryKey: queryKeys.shipments.detail(id ?? ""),
    queryFn: async () => {
      if (!id) return null;
      const response = await shipmentService.getShipmentById(id);
      if (!response.success || !response.data) {
        throw new Error(response.error || "Failed to fetch shipment detail");
      }
      return response.data;
    },
    enabled: Boolean(id),
  });
}

export function useShipmentStatsQuery() {
  return useQuery({
    queryKey: queryKeys.shipments.stats,
    queryFn: async () => {
      const response = await shipmentService.getColdChainMetrics();
      if (!response.success || !response.data) {
        throw new Error(response.error || "Failed to fetch cold-chain metrics");
      }
      return response.data;
    },
  });
}

/**
 * Every batch the server holds (single page, newest first). Powers the Kanban
 * board and the analytics charts, which both need the *whole* dataset rather
 * than the paginated slice the register table asks for.
 *
 * Status filtering is deliberately NOT applied here: the board already
 * segments by status into columns, so honouring it would hide whole columns.
 */
const BOARD_PARAMS: PaginationParams = {
  page: 1,
  pageSize: 100,
  searchQuery: "",
  statusFilter: "ALL",
  categoryFilter: "ALL",
  sortBy: "createdAt",
  sortOrder: "desc",
};

export function useAllShipmentsQuery() {
  return useShipmentsQuery(BOARD_PARAMS);
}
