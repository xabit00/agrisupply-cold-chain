"use client";

import React from "react";
import { PageHeader } from "@/components/shared/page-header";
import { MetricCard } from "@/components/shared/metric-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { DataTable } from "@/components/shared/data-table";
import { useShipmentsQuery } from "@/lib/hooks/use-shipments-query";
import { useShipmentStore } from "@/stores/shipment.store";
import { Shipment } from "@/lib/types";
import { ColumnDef } from "@tanstack/react-table";
import { formatDate, formatTemperature } from "@/lib/utils/formatters";
import { Sprout, Thermometer, ShieldAlert, Truck } from "lucide-react";

export default function FarmerPage() {
  const { pagination, setPagination } = useShipmentStore();
  const { data, isLoading } = useShipmentsQuery(pagination);

  const columns: ColumnDef<Shipment, unknown>[] = [
    {
      accessorKey: "trackingNumber",
      header: "Tracking ID",
      cell: ({ row }) => (
        <span className="font-semibold text-emerald-800 font-mono text-xs">
          {row.getValue("trackingNumber")}
        </span>
      ),
    },
    {
      accessorKey: "produce.name",
      header: "Produce & Quantity",
      cell: ({ row }) => (
        <div>
          <p className="font-medium text-slate-800">{row.original.produce.name}</p>
          <p className="text-[11px] text-slate-500">
            {row.original.produce.quantityKg.toLocaleString()} kg · {row.original.produce.category}
          </p>
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Cold-Chain Status",
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      accessorKey: "produce.optimalTempMin",
      header: "Temp Target",
      cell: ({ row }) => (
        <span className="text-xs text-slate-600">
          {formatTemperature(row.original.produce.optimalTempMin)} -{" "}
          {formatTemperature(row.original.produce.optimalTempMax)}
        </span>
      ),
    },
    {
      accessorKey: "createdAt",
      header: "Registered",
      cell: ({ row }) => (
        <span className="text-xs text-slate-500">
          {formatDate(row.original.createdAt)}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        heading="Farmer Dispatch & Harvest Hub"
        subheading="Register produce batches, monitor cold-chain handoffs, and audit vault compliance."
        badge="Active Region: Salinas Valley"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Active Harvests"
          value={data?.total ?? 2}
          subtitle="Batches in pipeline"
          icon={Sprout}
          variant="success"
        />
        <MetricCard
          title="In Transit"
          value={1}
          subtitle="Reefers on route"
          icon={Truck}
          variant="default"
        />
        <MetricCard
          title="Mean Cold-Box Temp"
          value="3.2°C"
          subtitle="Target 1.5°C - 4.0°C"
          icon={Thermometer}
          variant="default"
        />
        <MetricCard
          title="SLA Breach Count"
          value={0}
          subtitle="100% compliant"
          icon={ShieldAlert}
          variant="success"
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">Registered Produce Shipments</h2>
        </div>

        <DataTable
          columns={columns}
          data={data?.items ?? []}
          isLoading={isLoading}
          totalCount={data?.total}
          pageIndex={pagination.page}
          pageSize={pagination.pageSize}
          onPageChange={(p) => setPagination({ page: p })}
          onPageSizeChange={(s) => setPagination({ pageSize: s, page: 1 })}
        />
      </div>
    </div>
  );
}
