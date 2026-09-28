"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { shipmentService } from "@/lib/services/shipment.service";
import { queryKeys } from "@/lib/services/query-keys";
import { queueService } from "@/offline/queue.service";
import { useOfflineStore } from "@/stores/offline.store";
import { toast } from "@/stores/toast.store";
import { Shipment, ShipmentCreateRequest } from "@/lib/types";

export type CreateShipmentResult =
  | { queued: false; shipment: Shipment }
  | { queued: true; shipment: null };

/**
 * Single mutation path for batch registration: goes straight to the API when
 * online, otherwise durably queues the request in IndexedDB (Dexie) for replay
 * by useOnlineStatus once connectivity returns.
 */
export function useCreateShipmentMutation() {
  const queryClient = useQueryClient();
  const isOnline = useOfflineStore((state) => state.isOnline);
  const setPendingCount = useOfflineStore((state) => state.setPendingCount);

  return useMutation<CreateShipmentResult, Error, ShipmentCreateRequest>({
    mutationFn: async (request) => {
      if (!isOnline) {
        await queueService.enqueueMutation(
          "CREATE_SHIPMENT",
          "/api/shipments",
          "POST",
          request
        );
        const pending = await queueService.getPendingCount();
        setPendingCount(pending);
        return { queued: true, shipment: null };
      }

      const response = await shipmentService.createShipment(request);

      if (!response.success || !response.data) {
        throw new Error(response.error || "Failed to register the produce batch");
      }

      return { queued: false, shipment: response.data };
    },

    onSuccess: (result) => {
      if (result.queued) {
        toast.info(
          "Batch queued offline",
          "Saved to the local outbox — it will sync automatically once you reconnect."
        );
        return;
      }

      void queryClient.invalidateQueries({ queryKey: queryKeys.shipments.all });

      toast.success(
        `Batch ${result.shipment.trackingNumber} registered`,
        `${result.shipment.produce.name} · ${result.shipment.produce.quantityKg.toLocaleString()} kg is now tracked in the shipment register.`
      );
    },

    onError: (error) => {
      toast.error("Batch registration failed", error.message);
    },
  });
}
