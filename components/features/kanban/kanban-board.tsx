"use client";

import React, { useMemo } from "react";
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { Shipment, ShipmentStatus } from "@/lib/types";
import { SHIPMENT_STATUSES } from "@/lib/constants/produce-presets";
import { KanbanColumn } from "./kanban-column";

/** Every stage the register can be in, left → right (shared allow-list). */
export const KANBAN_COLUMNS: readonly ShipmentStatus[] = SHIPMENT_STATUSES;

interface KanbanBoardProps {
  shipments: Shipment[];
  onStatusChange: (shipment: Shipment, status: ShipmentStatus) => void;
  onSelect: (shipment: Shipment) => void;
}

export function KanbanBoard({
  shipments,
  onStatusChange,
  onSelect,
}: KanbanBoardProps) {
  // 6px of travel before a drag starts, so a plain click still opens the card.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  const grouped = useMemo(() => {
    const buckets = new Map<ShipmentStatus, Shipment[]>();
    KANBAN_COLUMNS.forEach((status) => buckets.set(status, []));
    shipments.forEach((shipment) => buckets.get(shipment.status)?.push(shipment));
    return buckets;
  }, [shipments]);

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over) return;

    const shipment = shipments.find((item) => item.id === String(active.id));
    if (!shipment) return;

    const overId = String(over.id);

    // Dropped directly onto a column header / its empty area.
    const column = KANBAN_COLUMNS.find((status) => status === overId);
    if (column) {
      if (column !== shipment.status) onStatusChange(shipment, column);
      return;
    }

    // Dropped onto another card — adopt that card's column.
    const overShipment = shipments.find((item) => item.id === overId);
    if (overShipment && overShipment.status !== shipment.status) {
      onStatusChange(shipment, overShipment.status);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-3">
        {KANBAN_COLUMNS.map((status) => (
          <KanbanColumn
            key={status}
            status={status}
            shipments={grouped.get(status) ?? []}
            onSelect={onSelect}
          />
        ))}
      </div>
    </DndContext>
  );
}

