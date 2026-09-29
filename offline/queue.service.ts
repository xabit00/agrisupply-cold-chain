import { db } from "./db";
import type { QueuedTransaction, OfflineActionType } from "@/lib/types";
import { apiClient } from "@/lib/services/api-client";

let replayPromise: Promise<void> | null = null;

export const queueService = {
  async enqueueMutation<T>(
    action: OfflineActionType,
    endpoint: string,
    method: "POST" | "PUT" | "PATCH" | "DELETE",
    payload: T
  ): Promise<QueuedTransaction<T>> {
    const id = `tx_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const tx: QueuedTransaction<T> = {
      id,
      idempotencyKey: id,
      action,
      endpoint,
      method,
      payload,
      queuedAt: new Date().toISOString(),
      retryCount: 0,
      status: "pending",
    };
    await db.queuedTransactions.add(tx as QueuedTransaction);
    return tx;
  },

  async replayPendingTransactions(): Promise<void> {
    if (replayPromise) return replayPromise;

    replayPromise = (async () => {
      const candidates = await db.queuedTransactions
        .filter((tx) => (tx.status === "pending" || tx.status === "failed") && tx.retryCount < 5)
        .sortBy("queuedAt");

      for (const tx of candidates) {
        try {
          await db.queuedTransactions.update(tx.id, { status: "syncing", errorMessage: undefined });
          const res = await apiClient.request(tx.endpoint, {
            method: tx.method,
            body: JSON.stringify(tx.payload),
            headers: { "X-Idempotency-Key": tx.idempotencyKey },
          });

          if (res.success) {
            await db.queuedTransactions.update(tx.id, {
              status: "synced",
              syncedAt: new Date().toISOString(),
              errorMessage: undefined,
            });
          } else {
            await db.queuedTransactions.update(tx.id, {
              status: "failed",
              errorMessage: res.error,
              retryCount: tx.retryCount + 1,
            });
          }
        } catch (error) {
          await db.queuedTransactions.update(tx.id, {
            status: "failed",
            errorMessage: error instanceof Error ? error.message : "Sync error",
            retryCount: tx.retryCount + 1,
          });
        }
      }
    })().finally(() => {
      replayPromise = null;
    });

    return replayPromise;
  },

  async getPendingCount(): Promise<number> {
    return db.queuedTransactions
      .filter((tx) => tx.status === "pending" || tx.status === "failed" || tx.status === "syncing")
      .count();
  },
};