"use client";

import React, { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  useAllShipmentsQuery,
  useShipmentStatsQuery,
} from "@/lib/hooks/use-shipments-query";
import {
  PRODUCE_CATEGORIES,
  SHIPMENT_STATUSES,
} from "@/lib/constants/produce-presets";
import { ShipmentStatus } from "@/lib/types";
import { EmptyState } from "@/components/shared/empty-state";
import { BarChart3, PackageCheck, ShieldCheck, Timer } from "lucide-react";

const STATUS_COLORS: Record<ShipmentStatus, string> = {
  Draft: "#94a3b8",
  Harvested: "#64748b",
  InTransit: "#0284c7",
  ColdStorage: "#f59e0b",
  Delivered: "#059669",
  Compromised: "#e11d48",
};

const CATEGORY_COLORS: Record<string, string> = {
  Dairy: "#0284c7",
  Fruits: "#f59e0b",
  Vegetables: "#059669",
  Meat: "#e11d48",
  Seafood: "#06b6d4",
  Flowers: "#d946ef",
};

const AXIS = {
  stroke: "#94a3b8",
  fontSize: 10,
  tickLine: false,
  axisLine: false,
} as const;

const TOOLTIP_STYLE = {
  borderRadius: 8,
  border: "1px solid #e2e8f0",
  fontSize: 12,
  boxShadow: "0 4px 12px rgba(15,23,42,0.08)",
};

function Panel({
  title,
  hint,
  children,
  footer,
}: {
  title: string;
  hint: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
          {title}
        </h3>
        <span className="text-[10px] text-slate-400">{hint}</span>
      </div>
      <div className="mt-3 h-[210px] w-full">{children}</div>
      {footer && <div className="mt-3 flex flex-wrap gap-3">{footer}</div>}
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] text-slate-500">
      <span
        className="h-2.5 w-2.5 rounded-sm"
        style={{ backgroundColor: color }}
        aria-hidden="true"
      />
      {label}
    </span>
  );
}

function StatPill({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  tone: "emerald" | "amber" | "sky";
}) {
  const tones = {
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
    amber: "border-amber-200 bg-amber-50 text-amber-700",
    sky: "border-sky-200 bg-sky-50 text-sky-700",
  } as const;

  return (
    <div className={`flex items-center gap-2.5 rounded-lg border px-3 py-2 ${tones[tone]}`}>
      <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
      <div className="min-w-0">
        <p className="truncate text-[10px] font-bold uppercase tracking-wide opacity-70">
          {label}
        </p>
        <p className="truncate text-sm font-extrabold">{value}</p>
      </div>
    </div>
  );
}

export function MetricCharts() {
  const { data: all, isLoading } = useAllShipmentsQuery();
  const { data: metrics } = useShipmentStatsQuery();

  const shipments = useMemo(() => all?.items ?? [], [all]);

  /** Batches sitting in each pipeline stage. */
  const pipeline = useMemo(
    () =>
      SHIPMENT_STATUSES.map((status) => ({
        status,
        batches: shipments.filter((s) => s.status === status).length,
      })),
    [shipments]
  );

  /** Avg origin→delivery hours per category, from completed deliveries only. */
  const deliveryByCategory = useMemo(() => {
    const rows: ({ category: string; hours: number } | null)[] =
      PRODUCE_CATEGORIES.map((category) => {
      const completed = shipments.filter(
        (s) =>
          s.produce.category === category &&
          s.status === "Delivered" &&
          Boolean(s.deliveredAt)
      );
      const durations = completed
        .map(
          (s) =>
            (Date.parse(s.deliveredAt as string) -
              Date.parse(s.dispatchedAt ?? s.createdAt)) /
            3_600_000
        )
        .filter((hours) => Number.isFinite(hours) && hours >= 0);

      if (durations.length === 0) return null;
      return {
        category,
        hours:
          Math.round(
            (durations.reduce((sum, h) => sum + h, 0) / durations.length) * 10
          ) / 10,
      };
    });

    return rows.filter(
      (row): row is { category: string; hours: number } => row !== null
    );
  }, [shipments]);

  /** Batches with a clean envelope vs. any active temperature/humidity/tamper alert. */
  const integrity = useMemo(
    () =>
      PRODUCE_CATEGORIES.map((category) => {
        const rows = shipments.filter((s) => s.produce.category === category);
        return {
          category,
          clean: rows.filter(
            (s) => !s.temperatureAlert && !s.humidityAlert && !s.tamperAlert
          ).length,
          alerted: rows.filter(
            (s) => s.temperatureAlert || s.humidityAlert || s.tamperAlert
          ).length,
        };
      }),
    [shipments]
  );

  if (isLoading) {
    return (
      <div
        className="grid gap-4 md:grid-cols-3"
        aria-busy="true"
        aria-label="Loading analytics"
      >
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-[290px] animate-pulse rounded-lg border border-slate-200 bg-slate-100"
          />
        ))}
      </div>
    );
  }

  if (shipments.length === 0) {
    return (
      <EmptyState
        title="No analytics yet"
        description="Register a batch and the pipeline, delivery and integrity charts will populate automatically."
        icon={<BarChart3 className="mx-auto h-10 w-10 text-slate-300" />}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <StatPill
          icon={PackageCheck}
          label="Loss rate"
          value={`${metrics?.lossRatePct ?? 0}%`}
          tone="amber"
        />
        <StatPill
          icon={ShieldCheck}
          label="SLA compliance"
          value={`${metrics?.complianceRatePct ?? 100}%`}
          tone="emerald"
        />
        <StatPill
          icon={Timer}
          label="Avg delivery cycle"
          value={`${metrics?.avgDeliveryHours ?? 0}h`}
          tone="sky"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Panel title="Batches by stage" hint="live from the register">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={pipeline}
              margin={{ top: 4, right: 4, left: -24, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" vertical={false} />
              <XAxis
                dataKey="status"
                {...AXIS}
                interval={0}
                angle={-32}
                textAnchor="end"
                height={54}
              />
              <YAxis {...AXIS} allowDecimals={false} />
              <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "#f8fafc" }} />
              <Bar dataKey="batches" name="Batches" radius={[4, 4, 0, 0]}>
                {pipeline.map((row) => (
                  <Cell key={row.status} fill={STATUS_COLORS[row.status]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Panel>

        <Panel title="Avg delivery cycle" hint="hours · completed only">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={deliveryByCategory}
              margin={{ top: 4, right: 4, left: -24, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" vertical={false} />
              <XAxis dataKey="category" {...AXIS} />
              <YAxis {...AXIS} allowDecimals={false} />
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                cursor={{ fill: "#f8fafc" }}
                formatter={(value) => [`${value} h`, "Avg cycle"]}
              />
              <Bar dataKey="hours" name="Hours" radius={[4, 4, 0, 0]}>
                {deliveryByCategory.map((row) => (
                  <Cell
                    key={row.category}
                    fill={CATEGORY_COLORS[row.category] ?? "#64748b"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Panel>

        <Panel
          title="Cold-chain integrity"
          hint="clean vs. alerted batches"
          footer={
            <>
              <LegendDot color="#059669" label="Within envelope" />
              <LegendDot color="#e11d48" label="Active alert" />
            </>
          }
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={integrity}
              margin={{ top: 4, right: 4, left: -24, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" vertical={false} />
              <XAxis dataKey="category" {...AXIS} />
              <YAxis {...AXIS} allowDecimals={false} />
              <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "#f8fafc" }} />
              <Bar
                dataKey="clean"
                stackId="a"
                name="Within envelope"
                fill="#059669"
              />
              <Bar
                dataKey="alerted"
                stackId="a"
                name="Alerted"
                fill="#e11d48"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </Panel>
      </div>
    </div>
  );
}


