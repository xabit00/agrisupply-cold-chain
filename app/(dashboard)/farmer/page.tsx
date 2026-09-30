"use client";

import * as React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/shared/page-header";
import { MetricCard } from "@/components/shared/metric-card";
import { ShipmentTable } from "@/components/features/shipments/shipment-table";
import { MetricCharts } from "@/components/features/analytics/metric-charts";
import { ShipmentCreateDialog } from "@/components/features/shipments/shipment-create-dialog";
import { useShipmentStatsQuery } from "@/lib/hooks/use-shipments-query";
import { queryKeys } from "@/lib/services/query-keys";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import { Plus, RefreshCw, Sprout, Truck, Timer, ShieldAlert } from "lucide-react";

const REGION_OPTIONS = [
  "Sargodha Farm A",
  "Multan Guava Orchard",
  "Mirpur Khas Mango Farm",
  "Quetta Farm Hub",
] as const;

type ActiveRegion = (typeof REGION_OPTIONS)[number];

export default function FarmerPage() {
  const queryClient = useQueryClient();
  const { data: metrics, isLoading, isRefetching } = useShipmentStatsQuery();
  const [createOpen, setCreateOpen] = React.useState(false);
  const [activeRegion, setActiveRegion] = React.useState<ActiveRegion>("Sargodha Farm A");

  const handleRefresh = () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.shipments.all });
  };

  const breachCount = metrics?.temperatureBreachCount ?? 0;

  return (
    <div className="space-y-6">
      <PageHeader
        heading="Farmer Dispatch & Harvest Hub"
        subheading="Register produce batches, monitor cold-chain handoffs, and audit vault compliance."
        badge={`Active Region: ${activeRegion}`}
      >
        <label htmlFor="active-region" className="sr-only">
          Active region
        </label>
        <select
          id="active-region"
          value={activeRegion}
          onChange={(event) => setActiveRegion(event.target.value as ActiveRegion)}
          aria-label="Active region"
          className="h-9 rounded-md border border-emerald-200 bg-white px-2.5 text-xs font-semibold text-emerald-800 shadow-sm outline-none transition hover:border-emerald-300 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
        >
          {REGION_OPTIONS.map((region) => (
            <option key={region} value={region}>
              {region}
            </option>
          ))}
        </select>
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefetching || isLoading}>
          <RefreshCw className={cn("h-3.5 w-3.5 mr-1.5", isRefetching && "animate-spin")} />
          Sync Cold-Chain
        </Button>
        <Button
          size="sm"
          className="bg-emerald-600 text-white hover:bg-emerald-700"
          onClick={() => setCreateOpen(true)}
        >
          <Plus className="mr-1.5 h-3.5 w-3.5" /> Register Batch
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Registered Batches"
          value={metrics?.totalShipments ?? 0}
          subtitle="Lots across all categories"
          icon={Sprout}
          variant="default"
        />
        <MetricCard
          title="Active Cold-Chain"
          value={metrics?.activeShipments ?? 0}
          subtitle="Harvested · transit · vault"
          icon={Truck}
          variant="success"
        />
        <MetricCard
          title="Avg Delivery Cycle"
          value={`${metrics?.avgDeliveryHours ?? 0}h`}
          subtitle="Origin to retail handoff"
          icon={Timer}
          variant="default"
        />
        <MetricCard
          title="SLA Breaches"
          value={breachCount}
          subtitle={`${metrics?.complianceRatePct ?? 100}% compliant · ${metrics?.lossRatePct ?? 0}% loss`}
          icon={ShieldAlert}
          variant={breachCount > 0 ? "danger" : "success"}
        />
      </div>

      <section className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Registered Produce Shipments
            </h2>
            <p className="text-xs text-slate-500">
              Server-filtered, sortable and paginated register. Select any row to inspect its
              cold-chain SLA envelope.
            </p>
          </div>
        </div>

        <ShipmentTable />
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="text-base font-bold text-slate-900">Cold-Chain Analytics</h2>
          <p className="text-xs text-slate-500">
            Pipeline distribution, delivery-cycle and integrity metrics computed from the
            same shipment register — they move as soon as a batch changes stage.
          </p>
        </div>

        <MetricCharts />
      </section>

      <ShipmentCreateDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
