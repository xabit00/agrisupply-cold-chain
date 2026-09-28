import { db } from "./db";
import { QueuedTransaction, OfflineActionType } from "@/lib/types";
import { apiClient } from "@/lib/services/api-client";

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
    const pending = await db.queuedTransactions
      .where("status")
      .equals("pending")
      .toArray();

    for (const tx of pending) {
      try {
        await db.queuedTransactions.update(tx.id, { status: "syncing" });
        const res = await apiClient.request(tx.endpoint, {
          method: tx.method,
          body: JSON.stringify(tx.payload),
          headers: {
            "X-Idempotency-Key": tx.idempotencyKey,
          },
        });

        if (res.success) {
          await db.queuedTransactions.update(tx.id, {
            status: "synced",
            syncedAt: new Date().toISOString(),
          });
        } else {
          await db.queuedTransactions.update(tx.id, {
            status: "failed",
            errorMessage: res.error,
            retryCount: tx.retryCount + 1,
          });
        }
      } catch (err) {
        await db.queuedTransactions.update(tx.id, {
          status: "failed",
          errorMessage: err instanceof Error ? err.message : "Sync error",
          retryCount: tx.retryCount + 1,
        });
      }
    }
  },

  async getPendingCount(): Promise<number> {
    return db.queuedTransactions.where("status").equals("pending").count();
  },
};
