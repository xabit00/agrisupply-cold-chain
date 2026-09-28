"use client";

import { useEffect } from "react";
import { useOfflineStore } from "@/stores/offline.store";
import { queueService } from "@/offline/queue.service";

export function useOnlineStatus() {
  const { isOnline, setIsOnline, setPendingCount } = useOfflineStore();

  useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true);
      await queueService.replayPendingTransactions();
      const count = await queueService.getPendingCount();
      setPendingCount(count);
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Initial count
    queueService.getPendingCount().then(setPendingCount);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [setIsOnline, setPendingCount]);

  return { isOnline };
}
