import React from "react";

export function SensorAlertBanner({ isBreached, message }: { isBreached: boolean; message?: string }) {
  if (!isBreached) return null;

  return (
    <div className="rounded-md border border-destructive/20 bg-destructive/10 p-3 text-destructive text-sm font-medium">
      ⚠️ Cold-Chain Alert: {message || "Sensor telemetry breached critical threshold!"}
    </div>
  );
}
