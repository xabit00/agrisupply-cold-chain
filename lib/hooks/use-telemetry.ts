"use client";

import { useMemo, useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { iotService } from "@/lib/services/iot.service";
import { queryKeys } from "@/lib/services/query-keys";
import { useSocket } from "@/lib/hooks/use-socket";
import { queueService } from "@/offline/queue.service";
import { useOfflineStore } from "@/stores/offline.store";
import { toast } from "@/stores/toast.store";
import { SensorReading } from "@/lib/types";
import { formatTemperature } from "@/lib/utils/formatters";
import type { SocketStatus } from "@/providers/socket-provider";

/** Rolling chart window — ~60s of readings at a 1.5s tick. */
const MAX_POINTS = 40;

export interface TelemetryStream {
  /** Bootstrap history merged with live events, oldest → newest. */
  readings: SensorReading[];
  /** Most recent reading (undefined until the first one arrives). */
  latest?: SensorReading;
  /** Reading that put the shipment out of SLA, or undefined when recovered. */
  activeBreach?: SensorReading;
  isLoading: boolean;
  status: SocketStatus;
  isConnected: boolean;
}

function breachKey(reading: SensorReading): string {
  return `${reading.shipmentId}:${reading.breachReason ?? "UNKNOWN"}`;
}

/**
 * Subscribes to the mock sensor stream for one shipment.
 *
 * - seeds the chart from GET /api/iot (deterministic history)
 * - appends `sensor:reading` events into a rolling window
 * - raises a de-duplicated toast + records the breach on the *transition* into
 *   a breach state (queued offline when the browser is down)
 * - clears the breach on recovery
 *
 * Every listener registered here is removed on unmount or shipment switch.
 */
export function useTelemetry(shipmentId: string): TelemetryStream {
  const { socket, status, isConnected } = useSocket();
  const isOnline = useOfflineStore((state) => state.isOnline);
  const setPendingCount = useOfflineStore((state) => state.setPendingCount);

  const [live, setLive] = useState<SensorReading[]>([]);
  const [activeBreach, setActiveBreach] = useState<SensorReading | undefined>();
  const breachKeyRef = useRef<string | null>(null);

  const { data: history, isLoading } = useQuery({
    queryKey: queryKeys.iot.telemetry(shipmentId),
    queryFn: async () => {
      const response = await iotService.getTelemetryHistory(shipmentId, MAX_POINTS);
      if (!response.success || !response.data) {
        throw new Error(response.error || "Failed to load telemetry history");
      }
      return response.data;
    },
    enabled: Boolean(shipmentId),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  // New shipment selected → drop the previous stream.
  useEffect(() => {
    setLive([]);
    setActiveBreach(undefined);
    breachKeyRef.current = null;
  }, [shipmentId]);

  useEffect(() => {
    if (!socket || !shipmentId) return;

    const recordBreach = (reading: SensorReading) => {
      void (async () => {
        try {
          if (!isOnline) {
            await queueService.enqueueMutation(
              "RECORD_SENSOR_BREACH",
              "/api/iot",
              "POST",
              reading
            );
            setPendingCount(await queueService.getPendingCount());
            return;
          }
          await iotService.logReading(reading);
        } catch {
          // Non-fatal: the breach is already visible in the UI.
        }
      })();
    };

    const handleReading = (reading: SensorReading) => {
      if (reading.shipmentId !== shipmentId) return;

      setLive((previous) => [...previous, reading].slice(-MAX_POINTS));
      setActiveBreach(reading.isBreached ? reading : undefined);

      if (reading.isBreached) {
        const key = breachKey(reading);
        if (breachKeyRef.current !== key) {
          breachKeyRef.current = key;
          toast.error(
            `Cold-chain breach — ${reading.breachReason ?? "threshold"}`,
            `${formatTemperature(reading.temperature)} / ${reading.humidity}% RH on ${reading.shipmentId}. The chain of custody is flagged.`
          );
          recordBreach(reading);
        }
      } else if (breachKeyRef.current !== null) {
        breachKeyRef.current = null;
        toast.success(
          `Back within SLA — ${reading.shipmentId}`,
          `${formatTemperature(reading.temperature)} / ${reading.humidity}% RH is inside the permitted window again.`
        );
      }
    };

    socket.on("sensor:reading", handleReading);
    return () => {
      socket.off("sensor:reading", handleReading);
    };
  }, [socket, shipmentId, isOnline, setPendingCount]);

  const readings = useMemo(() => {
    const merged = [...(history ?? []), ...live];
    return merged.length > MAX_POINTS ? merged.slice(-MAX_POINTS) : merged;
  }, [history, live]);

  const latest = readings.length > 0 ? readings[readings.length - 1] : undefined;

  return {
    readings,
    latest,
    activeBreach,
    isLoading,
    status,
    isConnected,
  };
}
