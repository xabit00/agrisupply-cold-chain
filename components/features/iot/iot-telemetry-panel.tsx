import React from "react";
import { SensorReading } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatTemperature, formatHumidity } from "@/lib/utils/formatters";

export function IotTelemetryPanel({ reading }: { reading?: SensorReading }) {
  if (!reading) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Live IoT Telemetry Feed</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-4 text-sm">
        <div className="rounded border p-3 bg-slate-50">
          <p className="text-xs text-slate-500">Temperature</p>
          <p className="text-lg font-bold text-slate-800">
            {formatTemperature(reading.temperature)}
          </p>
        </div>
        <div className="rounded border p-3 bg-slate-50">
          <p className="text-xs text-slate-500">Humidity</p>
          <p className="text-lg font-bold text-slate-800">
            {formatHumidity(reading.humidity)}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
