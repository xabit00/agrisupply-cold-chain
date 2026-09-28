"use client";

import React from "react";
import { Shipment } from "@/lib/types";
import { KanbanColumn } from "./kanban-column";

export function KanbanBoard({ shipments }: { shipments: Shipment[] }) {
  const inTransit = shipments.filter((s) => s.status === "InTransit");
  const coldStorage = shipments.filter((s) => s.status === "ColdStorage");
  const delivered = shipments.filter((s) => s.status === "Delivered");

  return (
    <div className="flex flex-col gap-4 md:flex-row">
      <KanbanColumn title="In Transit" shipments={inTransit} />
      <KanbanColumn title="Cold Storage" shipments={coldStorage} />
      <KanbanColumn title="Delivered" shipments={delivered} />
    </div>
  );
}
