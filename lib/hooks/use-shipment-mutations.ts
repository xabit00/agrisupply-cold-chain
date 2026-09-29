"use client";

import { useMutation, useQueryClient, QueryClient, QueryKey } from "@tanstack/react-query";
import { shipmentService } from "@/lib/services/shipment.service";
import { queryKeys } from "@/lib/services/query-keys";
import { queueService } from "@/offline/queue.service";
import { useOfflineStore } from "@/stores/offline.store";
import { toast } from "@/stores/toast.store";
import {
  Shipment,
  ShipmentCreateRequest,
  ShipmentStatus,
  PaginatedResult,
} from "@/lib/types";

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

type CachedShipmentShape = Shipment | PaginatedResult<Shipment> | undefined;

/** Writes a new status into every cached shipment list AND detail payload. */
function applyStatusToCaches(
  queryClient: QueryClient,
  id: string,
  status: ShipmentStatus
) {
  queryClient.setQueriesData<CachedShipmentShape>(
    { queryKey: queryKeys.shipments.all },
    (old) => {
      if (!old) return old;
      if ("items" in old) {
        if (!old.items.some((item) => item.id === id)) return old;
        return {
          ...old,
          items: old.items.map((item) =>
            item.id === id ? { ...item, status } : item
          ),
        };
      }
      if (old.id === id) return { ...old, status };
      return old;
    }
  );
}

/** Cache snapshot taken before an optimistic move so it can be rolled back. */
interface StatusMutationContext {
  snapshots: Array<[QueryKey, CachedShipmentShape]>;
}

/**
 * Kanban drag → status change. Moves the card optimistically in every cached
 * list/detail first, then persists through PUT /api/shipments/[id]. When the
 * browser is offline the move is durably queued (action UPDATE_STATUS) and the
 * optimistic state is intentionally kept, since the server has not seen it yet.
 */
export function useUpdateShipmentStatusMutation() {
  const queryClient = useQueryClient();
  const isOnline = useOfflineStore((state) => state.isOnline);
  const setPendingCount = useOfflineStore((state) => state.setPendingCount);

  return useMutation<
    { queued: boolean; shipment: Shipment | null },
    Error,
    { id: string; status: ShipmentStatus; trackingNumber: string },
    StatusMutationContext
  >({
    mutationFn: async ({ id, status }) => {
      if (!isOnline) {
        await queueService.enqueueMutation(
          "UPDATE_STATUS",
          `/api/shipments/${id}`,
          "PUT",
          { status }
        );
        const pending = await queueService.getPendingCount();
        setPendingCount(pending);
        return { queued: true, shipment: null };
      }

      const response = await shipmentService.updateShipmentStatus(id, status);
      if (!response.success || !response.data) {
        throw new Error(response.error || "Failed to update the batch status");
      }
      return { queued: false, shipment: response.data };
    },

    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.shipments.all });
      const snapshots = queryClient.getQueriesData<CachedShipmentShape>({
        queryKey: queryKeys.shipments.all,
      });
      applyStatusToCaches(queryClient, id, status);
      return { snapshots };
    },

    onError: (error, _variables, context) => {
      // Only restore keys that actually had data before the optimistic move.
      context?.snapshots.forEach(([key, data]) => {
        if (data !== undefined) queryClient.setQueryData(key, data);
      });
      toast.error("Status update failed", error.message);
    },

    onSuccess: (result, { status, trackingNumber }) => {
      if (result.queued) {
        toast.info(
          "Status change queued offline",
          `Moving ${trackingNumber} to ${status} will sync automatically once you reconnect.`
        );
        return;
      }

      void queryClient.invalidateQueries({ queryKey: queryKeys.shipments.all });
      toast.success(
        `${trackingNumber} moved to ${status}`,
        "The pipeline board and the shipment register now reflect the new stage."
      );
    },
  });
}
