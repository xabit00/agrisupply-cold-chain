"use client";

import { AlertTriangle, ShieldCheck } from "lucide-react";
import { SensorReading } from "@/lib/types";
import { formatHumidity, formatTemperature } from "@/lib/utils/formatters";

interface SensorAlertBannerProps {
  activeBreach?: SensorReading;
  shipmentId: string;
  status: "connecting" | "connected" | "disconnected";
}

export function SensorAlertBanner({ activeBreach, shipmentId, status }: SensorAlertBannerProps) {
  if (!activeBreach) {
    return (
      <div className="flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" />
        <div>
          <p className="text-sm font-bold">No active telemetry breach for {shipmentId}</p>
          <p className="mt-0.5 text-xs text-emerald-700">
            Connection state: {status}. The banner flips immediately when a live reading crosses the shipment SLA.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3 rounded-lg border border-rose-300 bg-rose-50 p-4 text-rose-800 shadow-sm">
      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
      <div className="min-w-0">
        <p className="text-sm font-extrabold">
          Cold-chain breach: {activeBreach.breachReason ?? "threshold crossed"}
        </p>
        <p className="mt-1 text-xs leading-5 text-rose-700">
          {activeBreach.shipmentId} at {new Date(activeBreach.timestamp).toLocaleString()} ·{" "}
          {formatTemperature(activeBreach.temperature)} · {formatHumidity(activeBreach.humidity)} RH ·{" "}
          {activeBreach.location.lat.toFixed(1)}, {activeBreach.location.lng.toFixed(1)}
        </p>
      </div>
    </div>
  );
}