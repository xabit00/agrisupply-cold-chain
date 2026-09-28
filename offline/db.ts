import Dexie, { Table } from "dexie";
import { QueuedTransaction } from "@/lib/types";

export class AgriSupplyDB extends Dexie {
  queuedTransactions!: Table<QueuedTransaction, string>;

  constructor() {
    super("AgriSupplyOfflineDB");
    this.version(1).stores({
      queuedTransactions: "id, idempotencyKey, action, status, queuedAt",
    });
  }
}

export const db = new AgriSupplyDB();
