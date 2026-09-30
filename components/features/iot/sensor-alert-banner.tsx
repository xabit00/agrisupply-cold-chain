"use client";

import { AlertTriangle, ShieldCheck, WifiOff } from "lucide-react";
import { SensorReading } from "@/lib/types";
import { formatHumidity, formatTemperature } from "@/lib/utils/formatters";
import type { TelemetryStateView } from "@/lib/utils/socket-status";

interface SensorAlertBannerProps {
  activeBreach?: SensorReading;
  shipmentId: string;
  /** Normalised telemetry state — the banner never re-derives it. */
  view: TelemetryStateView;
  /** ISO timestamp of the newest reading, shown while the stream is not live. */
  lastUpdatedAt?: string;
}

function updatedSuffix(lastUpdatedAt?: string): string {
  if (!lastUpdatedAt) return "";
  const time = new Date(lastUpdatedAt).toLocaleTimeString("en-PK", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return ` Last updated ${time}.`;
}

export function SensorAlertBanner({
  activeBreach,
  shipmentId,
  view,
  lastUpdatedAt,
}: SensorAlertBannerProps) {
  // A breach reading is a fact about the moment it was recorded; while the stream
  // is down it is reported as last known instead of as the current state.
  if (activeBreach) {
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
          {!view.isLive && (
            <p className="mt-1 text-xs font-semibold text-rose-700">
              Last known reading — live telemetry is unavailable, so a current breach cannot be
              confirmed.
            </p>
          )}
        </div>
      </div>
    );
  }

  // Only a live stream may claim that the shipment is currently within SLA.
  if (view.state === "LIVE") {
    return (
      <div className="flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" />
        <div>
          <p className="text-sm font-bold">No active telemetry breach for {shipmentId}</p>
          <p className="mt-0.5 text-xs text-emerald-700">
            Connection state: Live. The banner flips immediately when a live reading crosses the
            shipment SLA.
          </p>
        </div>
      </div>
    );
  }

  const isDemo = view.state === "DEMO";
  const title = isDemo
    ? `Demo telemetry active for ${shipmentId}`
    : view.state === "RECONNECTING"
      ? `Reconnecting to live telemetry for ${shipmentId}`
      : `Live telemetry unavailable for ${shipmentId}`;

  return (
    <div className={`flex items-start gap-3 rounded-lg border p-4 ${view.badgeClass}`}>
      {isDemo ? (
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" />
      ) : (
        <WifiOff className="mt-0.5 h-5 w-5 shrink-0" />
      )}
      <div>
        <p className="text-sm font-bold">{title}</p>
        <p className="mt-0.5 text-xs leading-5">
          {view.detail}
          {updatedSuffix(lastUpdatedAt)}
        </p>
      </div>
    </div>
  );
}
