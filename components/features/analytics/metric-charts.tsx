"use client";

import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const data = [
  { time: "08:00", temp: 3.2, humidity: 75 },
  { time: "10:00", temp: 3.8, humidity: 77 },
  { time: "12:00", temp: 4.1, humidity: 80 },
  { time: "14:00", temp: 3.9, humidity: 76 },
];

export function MetricCharts() {
  return (
    <div className="h-[250px] w-full rounded-lg border bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold text-slate-600 mb-2">Telemetry Trend Line (°C)</p>
      <ResponsiveContainer width="100%" height="90%">
        <LineChart data={data}>
          <XAxis dataKey="time" stroke="#888888" fontSize={11} />
          <YAxis stroke="#888888" fontSize={11} domain={[0, 10]} />
          <Tooltip />
          <Line type="monotone" dataKey="temp" stroke="#059669" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
