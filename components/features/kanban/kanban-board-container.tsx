"use client";

import React, { useMemo } from "react";
import { Shipment, ShipmentStatus } from "@/lib/types";
import { useAllShipmentsQuery } from "@/lib/hooks/use-shipments-query";
import { useUpdateShipmentStatusMutation } from "@/lib/hooks/use-shipment-mutations";
import { useShipmentStore } from "@/stores/shipment.store";
import { KanbanBoard, KANBAN_COLUMNS } from "./kanban-board";
import { EmptyState } from "@/components/shared/empty-state";
import { Columns3, MoveRight, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";

interface KanbanBoardProps {
  onSelect?: (shipment: Shipment) => void;
}

export function KanbanBoardContainer({ onSelect = () => undefined }: KanbanBoardProps) {
  const { data, isLoading } = useAllShipmentsQuery();
  const searchQuery =
    useShipmentStore((state) => state.pagination.searchQuery) ?? "";
  const categoryFilter =
    useShipmentStore((state) => state.pagination.categoryFilter) ?? "ALL";
  const resetFilters = useShipmentStore((state) => state.resetFilters);
  const updateStatus = useUpdateShipmentStatusMutation();

  // The register's status filter is ignored (columns already segment by
  // status), but search + category still narrow the board so the toolbar
  // never looks like it stopped working.
  const visible = useMemo(() => {
    const term = searchQuery.trim().toLowerCase();
    return (data?.items ?? []).filter((shipment) => {
      const matchesCategory =
        categoryFilter === "ALL" || shipment.produce.category === categoryFilter;
      if (!matchesCategory) return false;
      if (!term) return true;
      return (
        shipment.trackingNumber.toLowerCase().includes(term) ||
        shipment.produce.name.toLowerCase().includes(term) ||
        shipment.destination.name.toLowerCase().includes(term)
      );
    });
  }, [data, searchQuery, categoryFilter]);

  const handleStatusChange = (shipment: Shipment, status: ShipmentStatus) => {
    if (status === shipment.status) return;
    updateStatus.mutate({
      id: shipment.id,
      status,
      trackingNumber: shipment.trackingNumber,
    });
  };

  if (isLoading) {
    return (
      <div className="flex gap-4 overflow-hidden" aria-busy="true" aria-label="Loading pipeline board">
        {KANBAN_COLUMNS.map((status) => (
          <div
            key={status}
            className="w-[260px] shrink-0 space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3"
          >
            <div className="h-6 w-24 animate-pulse rounded-full bg-slate-200" />
            <div className="h-24 animate-pulse rounded-md bg-white" />
            <div className="h-24 animate-pulse rounded-md bg-white" />
          </div>
        ))}
      </div>
    );
  }

  if (visible.length === 0) {
    const filtered = searchQuery.trim().length > 0 || categoryFilter !== "ALL";
    return (
      <EmptyState
        title={filtered ? "No batches match your filters" : "The pipeline is empty"}
        description={
          filtered
            ? "Nothing on the board matches the current search or category filter."
            : "Register a batch from the Farmer Hub and it will appear here, ready to be dragged across stages."
        }
        icon={
          filtered ? (
            <SearchX className="mx-auto h-10 w-10 text-slate-300" />
          ) : (
            <Columns3 className="mx-auto h-10 w-10 text-slate-300" />
          )
        }
        action={
          filtered ? (
            <Button variant="outline" size="sm" onClick={() => resetFilters()}>
              Reset filters
            </Button>
          ) : undefined
        }
      />
    );
  }

  return (
    <div className="space-y-3">
      <p className="flex items-center gap-1.5 text-xs text-slate-500">
        <MoveRight className="h-3.5 w-3.5" aria-hidden="true" />
        Drag a card between columns to change its stage — the register and the
        metrics update immediately.
        {updateStatus.isPending && (
          <span className="font-semibold text-emerald-600">Saving…</span>
        )}
      </p>
      <KanbanBoard
        shipments={visible}
        onStatusChange={handleStatusChange}
        onSelect={onSelect}
      />
    </div>
  );
}
