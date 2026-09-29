"use client";

import React from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Shipment, ShipmentStatus } from "@/lib/types";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { KanbanCard } from "./kanban-card";
import { cn } from "@/lib/utils/cn";
import { Inbox } from "lucide-react";

interface KanbanColumnProps {
  status: ShipmentStatus;
  shipments: Shipment[];
  onSelect: (shipment: Shipment) => void;
}

export function KanbanColumn({ status, shipments, onSelect }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const totalKg = shipments.reduce(
    (sum, shipment) => sum + shipment.produce.quantityKg,
    0
  );

  return (
    <section
      className="flex w-[260px] shrink-0 flex-col rounded-lg border border-slate-200 bg-slate-50"
      aria-label={`${status} column, ${shipments.length} batches`}
    >
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-3 py-2.5">
        <StatusBadge status={status} className="border-0 px-2" />
        <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-bold text-slate-600 shadow-sm">
          {shipments.length}
        </span>
      </header>

      <p className="px-3 pt-2 text-[10px] font-medium uppercase tracking-wide text-slate-400">
        {totalKg.toLocaleString()} kg in stage
      </p>

      <div
        ref={setNodeRef}
        className={cn(
          "flex-1 space-y-2 overflow-y-auto p-2 transition-colors",
          isOver && "bg-emerald-50 ring-2 ring-inset ring-emerald-400"
        )}
      >
        <SortableContext
          items={shipments.map((shipment) => shipment.id)}
          strategy={verticalListSortingStrategy}
        >
          {shipments.length === 0 ? (
            <EmptyState
              title="No batches"
              description="Drag a batch here to move it into this stage."
              icon={<Inbox className="mx-auto h-8 w-8 text-slate-300" />}
              className="min-h-[140px] border-0 bg-transparent p-4"
            />
          ) : (
            shipments.map((shipment) => (
              <KanbanCard
                key={shipment.id}
                shipment={shipment}
                onSelect={onSelect}
              />
            ))
          )}
        </SortableContext>
      </div>
    </section>
  );
}

