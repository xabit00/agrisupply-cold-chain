"use client";

import React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { Thermometer, Droplets, Wifi, WifiOff, AlertTriangle } from "lucide-react";
import type { TelemetryStateView } from "@/lib/utils/socket-status";

// ── Types ────────────────────────────────────────────────────
interface SensorReading {
  timestamp: string | number;
  temperature: number | null;
  humidity: number | null;
}

interface Envelope {
  tempMin: number;
  tempMax: number;
  humidityMin: number;
  humidityMax: number;
}

interface IotTelemetryPanelProps {
  readings: SensorReading[];
  latest: SensorReading | null;
  envelope: Envelope;
  shipmentId: string;
  /** Normalised telemetry state — never re-derived inside the panel. */
  stream: TelemetryStateView;
  /** ISO timestamp of the newest reading, shown while the stream is not live. */
  lastUpdatedAt?: string;
}

// ── Helpers ──────────────────────────────────────────────────
function formatTemp(v: number | null | undefined): string {
  if (v == null) return "N/A";
  return `${v.toFixed(1)}°C`;
}

function formatHumidity(v: number | null | undefined): string {
  if (v == null) return "N/A";
  return `${v.toFixed(1)}%`;
}

function formatTime(ts: string | number): string {
  try {
    return new Date(ts).toLocaleTimeString("en-PK", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return String(ts);
  }
}

// ── Stat Card ────────────────────────────────────────────────
function StatCard({
  label,
  value,
  icon,
  alert,
  note,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  alert?: boolean;
  /** Small caption, e.g. "Last known" while the stream is not live. */
  note?: string;
}) {
  return (
    <div
      className={`rounded-xl border p-4 flex items-center gap-4 ${alert
          ? "border-red-300 bg-red-50"
          : "border-gray-200 bg-white"
        }`}
    >
      <div
        className={`p-2 rounded-lg ${alert ? "bg-red-100 text-red-600" : "bg-emerald-50 text-emerald-600"
          }`}
      >
        {icon}
      </div>
      <div>
        <p className="text-xs text-gray-500 font-medium">{label}</p>
        <p
          className={`text-xl font-bold ${alert ? "text-red-700" : "text-gray-900"
            }`}
        >
          {value}
        </p>
        {note && (
          <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
            {note}
          </p>
        )}
      </div>
      {alert && (
        <AlertTriangle className="ml-auto h-5 w-5 text-red-500 shrink-0" />
      )}
    </div>
  );
}

// ── Custom Tooltip ───────────────────────────────────────────
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-md p-3 text-xs">
      <p className="font-semibold text-gray-700 mb-1">{formatTime(label)}</p>
      {payload.map((entry: any) => (
        <p key={entry.name} style={{ color: entry.color }}>
          {entry.name}: <strong>{entry.value?.toFixed(1)}</strong>
          {entry.name === "Temperature" ? "°C" : "%"}
        </p>
      ))}
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────
export function IotTelemetryPanel({
  readings,
  latest,
  envelope,
  shipmentId,
  stream,
  lastUpdatedAt,
}: IotTelemetryPanelProps) {
  const isConnected = stream.isLive;
  // Cached values stay visible, but they are labelled and time-stamped.
  const staleNote = !isConnected && latest ? "Last known" : undefined;
  const lastUpdatedLabel = lastUpdatedAt
    ? new Date(lastUpdatedAt).toLocaleTimeString("en-PK", { hour: "2-digit", minute: "2-digit" })
    : undefined;

  const tempAlert =
    latest?.temperature != null &&
    (latest.temperature < envelope.tempMin || latest.temperature > envelope.tempMax);

  const humAlert =
    latest?.humidity != null &&
    (latest.humidity < envelope.humidityMin || latest.humidity > envelope.humidityMax);

  // Format readings for Recharts
  const chartData = readings.map((r) => ({
    ts: r.timestamp,
    Temperature: r.temperature,
    Humidity: r.humidity,
  }));

  return (
    <div className="space-y-4">

      {/* ── Connection Banner ── */}
      <div className={`flex flex-wrap items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium ${stream.badgeClass}`}>
        {isConnected ? (
          <Wifi className="h-4 w-4 shrink-0" />
        ) : (
          <WifiOff className="h-4 w-4 shrink-0" />
        )}
        <span className="truncate">
          {isConnected ? `${stream.shortNote} — Shipment ${shipmentId}` : stream.shortNote}
        </span>
        {isConnected && (
          <span className="ml-1 inline-block h-2 w-2 rounded-full bg-emerald-500 pulse-dot" />
        )}
        {!isConnected && lastUpdatedLabel && (
          <span className="ml-auto text-xs font-normal opacity-80">
            Last updated {lastUpdatedLabel}
          </span>
        )}
      </div>

      {/* ── Live Stats ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard
          label="Temperature"
          value={formatTemp(latest?.temperature)}
          icon={<Thermometer className="h-5 w-5" />}
          alert={tempAlert}
          note={staleNote}
        />
        <StatCard
          label="Humidity"
          value={formatHumidity(latest?.humidity)}
          icon={<Droplets className="h-5 w-5" />}
          alert={humAlert}
          note={staleNote}
        />
      </div>

      {/* ── Envelope Info ── */}
      <div className="rounded-lg border border-gray-200 bg-white px-4 py-3 flex flex-wrap gap-4 text-xs text-gray-500">
        <span>
          🌡 Safe temp range:{" "}
          <strong className="text-gray-700">
            {envelope.tempMin}°C – {envelope.tempMax}°C
          </strong>
        </span>
        <span>
          💧 Safe humidity range:{" "}
          <strong className="text-gray-700">
            {envelope.humidityMin}% – {envelope.humidityMax}%
          </strong>
        </span>
        <span>
          📦 Readings:{" "}
          <strong className="text-gray-700">{readings.length}</strong>
        </span>
      </div>

      {/* ── Temperature Chart ── */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">
          Temperature History (°C)
        </h3>
        {chartData.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
            Waiting for sensor data…
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="tempGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                dataKey="ts"
                tickFormatter={formatTime}
                tick={{ fontSize: 10, fill: "#94a3b8" }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "#94a3b8" }}
                tickLine={false}
                axisLine={false}
                domain={["auto", "auto"]}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine
                y={envelope.tempMax}
                stroke="#ef4444"
                strokeDasharray="4 4"
                label={{ value: "Max", fontSize: 10, fill: "#ef4444" }}
              />
              <ReferenceLine
                y={envelope.tempMin}
                stroke="#3b82f6"
                strokeDasharray="4 4"
                label={{ value: "Min", fontSize: 10, fill: "#3b82f6" }}
              />
              <Area
                type="monotone"
                dataKey="Temperature"
                stroke="#22c55e"
                strokeWidth={2}
                fill="url(#tempGrad)"
                dot={false}
                activeDot={{ r: 4 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ── Humidity Chart ── */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">
          Humidity History (%)
        </h3>
        {chartData.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
            Waiting for sensor data…
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="humGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                dataKey="ts"
                tickFormatter={formatTime}
                tick={{ fontSize: 10, fill: "#94a3b8" }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "#94a3b8" }}
                tickLine={false}
                axisLine={false}
                domain={[0, 100]}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine
                y={envelope.humidityMax}
                stroke="#ef4444"
                strokeDasharray="4 4"
                label={{ value: "Max", fontSize: 10, fill: "#ef4444" }}
              />
              <ReferenceLine
                y={envelope.humidityMin}
                stroke="#22c55e"
                strokeDasharray="4 4"
                label={{ value: "Min", fontSize: 10, fill: "#22c55e" }}
              />
              <Area
                type="monotone"
                dataKey="Humidity"
                stroke="#3b82f6"
                strokeWidth={2}
                fill="url(#humGrad)"
                dot={false}
                activeDot={{ r: 4 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

    </div>
  );
}

export default IotTelemetryPanel;