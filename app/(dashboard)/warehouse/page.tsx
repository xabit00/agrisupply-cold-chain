"use client";

import React, { useState, useEffect } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { KanbanBoardContainer } from "@/components/features/kanban/kanban-board-container";
import { IotTelemetryPanel } from "@/components/features/iot/iot-telemetry-panel";
import { SensorAlertBanner } from "@/components/features/iot/sensor-alert-banner";
import { ReportExportBar } from "@/components/features/reports/report-export-bar";
import { useTelemetry } from "@/lib/hooks/use-telemetry";
import { useAllShipmentsQuery } from "@/lib/hooks/use-shipments-query";
import {
  Thermometer, Droplets, Package, TrendingUp,
  AlertTriangle, CheckCircle, Clock, Warehouse
} from "lucide-react";

// ── Stat Card ────────────────────────────────────────────────
function StatCard({
  label, value, sub, icon, color = "green"
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
  color?: "green" | "blue" | "yellow" | "red";
}) {
  const colors = {
    green: "bg-emerald-50 text-emerald-600",
    blue: "bg-blue-50 text-blue-600",
    yellow: "bg-yellow-50 text-yellow-600",
    red: "bg-red-50 text-red-600",
  };
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium text-gray-500">{label}</p>
        <div className={`p-2 rounded-lg ${colors[color]}`}>{icon}</div>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

// ── Sensor Row ───────────────────────────────────────────────
function SensorRow({
  location, temp, humidity, status
}: {
  location: string;
  temp: number;
  humidity: number;
  status: "normal" | "warning" | "critical";
}) {
  const statusConfig = {
    normal: { label: "Normal", cls: "badge-green", icon: <CheckCircle className="h-3 w-3" /> },
    warning: { label: "Warning", cls: "badge-yellow", icon: <Clock className="h-3 w-3" /> },
    critical: { label: "Critical", cls: "badge-red", icon: <AlertTriangle className="h-3 w-3" /> },
  };
  const cfg = statusConfig[status];
  return (
    <div className={`flex items-center justify-between p-3 rounded-lg border ${status === "critical" ? "border-red-200 bg-red-50" :
        status === "warning" ? "border-yellow-200 bg-yellow-50" :
          "border-gray-100 bg-gray-50"
      }`}>
      <div className="flex items-center gap-3">
        <Warehouse className={`h-4 w-4 ${status === "critical" ? "text-red-500" :
            status === "warning" ? "text-yellow-500" : "text-emerald-500"
          }`} />
        <div>
          <p className="text-sm font-medium text-gray-800">{location}</p>
          <p className="text-xs text-gray-500">
            {temp.toFixed(1)}°C &nbsp;·&nbsp; {humidity.toFixed(1)}% RH
          </p>
        </div>
      </div>
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.cls}`}>
        {cfg.icon} {cfg.label}
      </span>
    </div>
  );
}

// ── Mock Sensor Data ─────────────────────────────────────────
const MOCK_SENSORS = [
  { id: "sen1", location: "Lahore WH — Cold Room A", temp: 3.8, humidity: 62, status: "normal" as const },
  { id: "sen2", location: "Lahore WH — Cold Room B", temp: 7.2, humidity: 58, status: "warning" as const },
  { id: "sen3", location: "Faisalabad Hub — Dock 1", temp: 4.1, humidity: 65, status: "normal" as const },
  { id: "sen4", location: "Islamabad WH — Main Cold", temp: 12.5, humidity: 71, status: "critical" as const },
  { id: "sen5", location: "Karachi Dist. — Freezer 1", temp: 2.9, humidity: 55, status: "normal" as const },
];

// ── Main Page ────────────────────────────────────────────────
export default function WarehousePage() {
  const { data, isLoading } = useAllShipmentsQuery();
  const shipments = data?.items ?? [];

  // Live telemetry for first active shipment
  const activeShipment = shipments.find(
    (s) => s.status === "InTransit" || s.status === "ColdStorage"
  );
  const telemetry = useTelemetry(activeShipment?.id ?? "");

  // Animated sensor temps (simulate live readings)
  const [sensors, setSensors] = useState(MOCK_SENSORS);
  useEffect(() => {
    const interval = setInterval(() => {
      setSensors((prev) =>
        prev.map((s) => ({
          ...s,
          temp: parseFloat((s.temp + (Math.random() - 0.5) * 0.3).toFixed(1)),
          humidity: parseFloat((s.humidity + (Math.random() - 0.5) * 0.5).toFixed(1)),
        }))
      );
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Stats
  const total = shipments.length;
  const inStorage = shipments.filter((s) => s.status === "ColdStorage").length;
  const inTransit = shipments.filter((s) => s.status === "InTransit").length;
  const critical = sensors.filter((s) => s.status === "critical").length;

  const envelope = activeShipment
    ? {
      tempMin: activeShipment.produce.optimalTempMin,
      tempMax: activeShipment.produce.optimalTempMax,
      humidityMin: activeShipment.produce.optimalHumidityMin,
      humidityMax: activeShipment.produce.optimalHumidityMax,
    }
    : { tempMin: 2, tempMax: 8, humidityMin: 50, humidityMax: 70 };

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <PageHeader
        heading="Warehouse Cold-Storage Hub"
        subheading="Monitor vault sensors, manage incoming shipments, and track the supply pipeline."
      />

      {/* ── Stats Row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Shipments"
          value={isLoading ? "…" : total}
          sub="All time"
          icon={<Package className="h-4 w-4" />}
          color="blue"
        />
        <StatCard
          label="In Cold Storage"
          value={isLoading ? "…" : inStorage}
          sub="Currently vaulted"
          icon={<Thermometer className="h-4 w-4" />}
          color="green"
        />
        <StatCard
          label="In Transit"
          value={isLoading ? "…" : inTransit}
          sub="En route to warehouse"
          icon={<TrendingUp className="h-4 w-4" />}
          color="yellow"
        />
        <StatCard
          label="Critical Alerts"
          value={critical}
          sub="Sensors breaching range"
          icon={<AlertTriangle className="h-4 w-4" />}
          color={critical > 0 ? "red" : "green"}
        />
      </div>

      {/* ── Alert Banner ── */}
      {activeShipment && (
        <SensorAlertBanner
          activeBreach={telemetry.activeBreach}
          shipmentId={activeShipment.id}
          status={telemetry.status}
        />
      )}

      {/* ── Two Column: Sensors + Telemetry ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Vault Sensors */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-800">
                Vault Sensor Network
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Live readings — refreshing every 3s
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
              <span className="h-2 w-2 rounded-full bg-emerald-500 pulse-dot" />
              Live
            </span>
          </div>
          <div className="space-y-2">
            {sensors.map((s) => (
              <SensorRow key={s.id} {...s} />
            ))}
          </div>
        </div>

        {/* Live Telemetry Panel */}
        <div>
          {activeShipment ? (
            <IotTelemetryPanel
              readings={telemetry.readings}
              latest={telemetry.latest ?? null}
              envelope={envelope}
              shipmentId={activeShipment.id}
              status={telemetry.status}
            />
          ) : (
            <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm flex flex-col items-center justify-center text-center h-full">
              <Thermometer className="h-10 w-10 text-gray-300 mb-3" />
              <h3 className="text-sm font-semibold text-gray-600">No active stream</h3>
              <p className="text-xs text-gray-400 mt-1">
                Move a shipment to InTransit or ColdStorage to see live telemetry.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Kanban Board ── */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-800">
              Supply Pipeline — Kanban
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Drag cards to update shipment stage
            </p>
          </div>
        </div>
        <KanbanBoardContainer />
      </div>

      {/* ── Export Bar ── */}
      <ReportExportBar shipments={shipments} />

    </div>
  );
}