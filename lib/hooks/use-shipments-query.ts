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
