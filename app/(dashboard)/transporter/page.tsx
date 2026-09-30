"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Radio } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { IotTelemetryPanel } from "@/components/features/iot/iot-telemetry-panel";
import { SensorAlertBanner } from "@/components/features/iot/sensor-alert-banner";
import { LiveMap } from "@/components/features/tracking/live-map";
import { useAllShipmentsQuery } from "@/lib/hooks/use-shipments-query";
import { useTelemetry } from "@/lib/hooks/use-telemetry";
import { trackingService } from "@/lib/services/tracking.service";
import { queryKeys } from "@/lib/services/query-keys";
import { useTrackingStore } from "@/stores/tracking.store";
import { toast } from "@/stores/toast.store";
import type { Shipment } from "@/lib/types";
import { cn } from "@/lib/utils/cn";

const ACTIVE_STATUSES = new Set(["Harvested", "InTransit", "ColdStorage"]);

function envelopeFromShipment(shipment: Shipment) {
  return {
    tempMin: shipment.produce.optimalTempMin,
    tempMax: shipment.produce.optimalTempMax,
    humidityMin: shipment.produce.optimalHumidityMin,
    humidityMax: shipment.produce.optimalHumidityMax,
  };
}

export default function TransporterPage() {
  const { data, isLoading } = useAllShipmentsQuery();
  const activeShipments = useMemo(
    () => (data?.items ?? []).filter((shipment) => ACTIVE_STATUSES.has(shipment.status)),
    [data?.items]
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedShipment = activeShipments.find((shipment) => shipment.id === selectedId) ?? activeShipments[0];
  const telemetry = useTelemetry(selectedShipment?.id ?? "");
  const stream = telemetry.view;
  const lastEvaluatedReading = useRef<string | null>(null);
  const addAlert = useTrackingStore((state) => state.addAlert);
  const updateVehiclePosition = useTrackingStore((state) => state.updateVehiclePosition);

  const { data: geofences = [], isError: geofenceError } = useQuery({
    queryKey: queryKeys.tracking.geofences,
    queryFn: async () => {
      const response = await trackingService.getGeofences();
      if (!response.success || !response.data) throw new Error(response.error || "Failed to load geofences");
      return response.data;
    },
    staleTime: 5 * 60_000,
  });

  useEffect(() => {
    const reading = telemetry.latest;
    if (!reading || reading.id === lastEvaluatedReading.current) return;
    lastEvaluatedReading.current = reading.id;
    updateVehiclePosition(reading.shipmentId, reading.location);

    void trackingService.evaluatePosition(reading.shipmentId, reading.location).then((response) => {
      if (!response.success || !response.data) return;
      response.data.forEach((alert) => {
        addAlert(alert);
        toast.info(
          `${alert.eventType === "ENTER" ? "Entered" : "Exited"} geofence`,
          `${alert.shipmentId} crossed zone ${alert.zoneId}.`
        );
      });
    }).catch((error) => {
      console.error("Geofence evaluation failed", error);
    });
  }, [telemetry.latest, addAlert, updateVehiclePosition]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader heading="Transporter telemetry & route management" subheading="Real-time reefer tracking, GPS routing, and cold-box status verification." />
        <div className="h-[420px] animate-pulse rounded-lg border bg-slate-100" />
      </div>
    );
  }

  if (!selectedShipment) {
    return (
      <div className="space-y-6">
        <PageHeader heading="Transporter telemetry & route management" subheading="Real-time reefer tracking, GPS routing, and cold-box status verification." />
        <EmptyState
          title="No active shipments to stream"
          description="Move a batch into Harvested, InTransit, or ColdStorage and the sensor server will start emitting readings."
          icon={<Radio className="mx-auto h-10 w-10 text-slate-300" />}
        />
      </div>
    );
  }

  const envelope = envelopeFromShipment(selectedShipment);
  const mapPosition = telemetry.latest?.location ?? selectedShipment.currentLocation ?? selectedShipment.origin.coordinates;

  return (
    <div className="space-y-6">
      <PageHeader
        heading="Transporter telemetry & route management"
        subheading="Live cold-chain sensor stream, route position, and geofence transitions from the custom Next.js + Socket.IO server."
      />

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Active reefer stream</h2>
            <p className="mt-1 text-xs text-slate-500">Pick a shipment; history loads over REST and live readings arrive over Socket.IO.</p>
          </div>
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors",
              stream.badgeClass
            )}
          >
            <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", stream.dotClass)} aria-hidden="true" />
            {stream.label}
          </span>
        </div>

        <div className="mt-4 grid gap-2 md:grid-cols-3">
          {activeShipments.slice(0, 6).map((shipment) => (
            <button
              key={shipment.id}
              type="button"
              onClick={() => setSelectedId(shipment.id)}
              aria-pressed={shipment.id === selectedShipment.id}
              className={cn(
                "min-h-16 rounded-lg border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500",
                shipment.id === selectedShipment.id ? "border-emerald-300 bg-emerald-50" : "border-slate-200 bg-white hover:border-slate-300"
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-extrabold text-slate-900">{shipment.id}</span>
                <StatusBadge status={shipment.status} />
              </div>
              <p className="mt-1 truncate text-xs text-slate-500">{shipment.produce.name} → {shipment.destination.name}</p>
            </button>
          ))}
        </div>
      </section>

      {geofenceError && (
        <p role="alert" className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          Geofence zones could not be loaded. Live sensor telemetry is still available.
        </p>
      )}

      <SensorAlertBanner
        activeBreach={telemetry.activeBreach}
        shipmentId={selectedShipment.id}
        view={telemetry.view}
        lastUpdatedAt={telemetry.lastUpdatedAt}
      />

      <div className="grid min-w-0 gap-6 xl:grid-cols-2">
        <LiveMap center={mapPosition} geofences={geofences} label={`${selectedShipment.id} · ${selectedShipment.produce.name}`} />
        <IotTelemetryPanel
          readings={telemetry.readings}
          latest={telemetry.latest ?? null}
          envelope={envelope}
          shipmentId={selectedShipment.id}
          stream={telemetry.view}
          lastUpdatedAt={telemetry.lastUpdatedAt}
        />
      </div>
    </div>
  );
}