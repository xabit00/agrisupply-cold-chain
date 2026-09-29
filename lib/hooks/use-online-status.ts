"use client";

import { useCallback, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useOfflineStore } from "@/stores/offline.store";
import { queueService } from "@/offline/queue.service";
import { queryKeys } from "@/lib/services/query-keys";
import { toast } from "@/stores/toast.store";

export function useOnlineStatus() {
  const queryClient = useQueryClient();
  const { isOnline, pendingTransactionsCount, setIsOnline, setPendingCount } = useOfflineStore();

  const syncPending = useCallback(async () => {
    try {
      await queueService.replayPendingTransactions();
      const count = await queueService.getPendingCount();
      setPendingCount(count);
      await queryClient.invalidateQueries({ queryKey: queryKeys.shipments.all });
      if (count > 0) {
        toast.error("Some offline changes could not sync", `${count} change${count === 1 ? "" : "s"} will be retried when the connection returns.`);
      }
    } catch (error) {
      console.error("Offline synchronization failed", error);
      setPendingCount(await queueService.getPendingCount());
      toast.error("Offline synchronization failed", "Your changes remain safely queued on this device.");
    }
  }, [queryClient, setPendingCount]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      void syncPending();
    };
    const handleOffline = () => setIsOnline(false);

    setIsOnline(navigator.onLine);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    void queueService.getPendingCount().then(setPendingCount);
    if (navigator.onLine) void syncPending();

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [setIsOnline, setPendingCount, syncPending]);

  return { isOnline, pendingTransactionsCount };
}