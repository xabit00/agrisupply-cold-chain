"use client";

import React, { useState } from "react";
import { DataTable } from "@/components/shared/data-table";
import { Shipment, ShipmentStatus, ProduceCategory } from "@/lib/types";
import { useShipmentStore } from "@/stores/shipment.store";
import { useShipmentsQuery } from "@/lib/hooks/use-shipments-query";
import { ShipmentDetailsCard } from "./shipment-details-card";
import { getShipmentColumns } from "./shipment-columns";
import { KanbanBoardContainer } from "@/components/features/kanban/kanban-board-container";
import { Search, RotateCcw, LayoutGrid, Table2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const CATEGORIES: ProduceCategory[] = ["Dairy", "Fruits", "Vegetables", "Meat", "Seafood", "Flowers"];
const STATUSES: ShipmentStatus[] = ["Draft", "Harvested", "InTransit", "ColdStorage", "Delivered", "Compromised"];

export function ShipmentTable({ initialStatus }: { initialStatus?: ShipmentStatus }) {
  const {
    pagination,
    setPagination,
    setSearchQuery,
    setStatusFilter,
    setCategoryFilter,
    resetFilters,
    activeView,
    setActiveView,
  } = useShipmentStore();

  const [activeShipment, setActiveShipment] = useState<Shipment | null>(null);

  React.useEffect(() => {
    if (initialStatus && pagination.statusFilter !== initialStatus) {
      setStatusFilter(initialStatus);
    }
  }, [initialStatus, setStatusFilter, pagination.statusFilter]);

  const { data, isLoading, isError, error, refetch } = useShipmentsQuery(pagination);

  const handleSort = (field: string) => {
    const isCurrent = pagination.sortBy === field;
    const nextOrder = isCurrent && pagination.sortOrder === "asc" ? "desc" : "asc";
    setPagination({ sortBy: field, sortOrder: nextOrder, page: 1 });
  };

  const columns = getShipmentColumns(handleSort, (s) => setActiveShipment(s));

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            aria-label="Search shipments"
            placeholder="Search by tracking ID, produce, or city..."
            value={pagination.searchQuery || ""}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-md border border-slate-200 pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {activeView === "table" && (
            <select
              value={pagination.statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as ShipmentStatus | "ALL")}
              className="rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700"
              aria-label="Filter by status"
            >
              <option value="ALL">All Statuses</option>
              {STATUSES.map((st) => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
          )}

          <select
            aria-label="Filter by produce category"
            value={pagination.categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as ProduceCategory | "ALL")}
            className="rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700"
          >
            <option value="ALL">All Categories</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          <div
            role="group"
            aria-label="Register view"
            className="flex overflow-hidden rounded-md border border-slate-200"
          >
            <button
              type="button"
              aria-pressed={activeView === "table"}
              onClick={() => setActiveView("table")}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold transition ${
                activeView === "table"
                  ? "bg-emerald-600 text-white"
                  : "bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              <Table2 className="h-3.5 w-3.5" aria-hidden="true" />
              Register
            </button>
            <button
              type="button"
              aria-pressed={activeView === "kanban"}
              onClick={() => setActiveView("kanban")}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold transition ${
                activeView === "kanban"
                  ? "bg-emerald-600 text-white"
                  : "bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" aria-hidden="true" />
              Board
            </button>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="h-8 px-2.5 text-xs text-slate-600"
            onClick={() => {
              resetFilters();
              refetch();
            }}
            title="Reset filters"
            aria-label="Reset filters"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {activeView === "table" ? (
        <DataTable
          columns={columns}
          data={data?.items ?? []}
          isLoading={isLoading}
          errorMessage={isError ? error.message : undefined}
          totalCount={data?.total}
          pageIndex={pagination.page}
          pageSize={pagination.pageSize}
          onPageChange={(p) => setPagination({ page: p })}
          onPageSizeChange={(s) => setPagination({ pageSize: s, page: 1 })}
        />
      ) : (
        <KanbanBoardContainer onSelect={(s) => setActiveShipment(s)} />
      )}

      <ShipmentDetailsCard
        shipment={activeShipment}
        onClose={() => setActiveShipment(null)}
      />
    </div>
  );
}
