"use client";

import type { GeoCoordinate, Geofence } from "@/lib/types";
import { MapPin } from "lucide-react";

const BOUNDS = { minLat: 23, maxLat: 37.5, minLng: 60, maxLng: 78.5 };

function project(coordinate: GeoCoordinate) {
  const x = ((coordinate.lng - BOUNDS.minLng) / (BOUNDS.maxLng - BOUNDS.minLng)) * 100;
  const y = (1 - (coordinate.lat - BOUNDS.minLat) / (BOUNDS.maxLat - BOUNDS.minLat)) * 100;
  return { left: `${Math.max(2, Math.min(98, x))}%`, top: `${Math.max(2, Math.min(98, y))}%` };
}

interface LiveMapProps {
  center?: GeoCoordinate;
  geofences?: Geofence[];
  label?: string;
}

export function LiveMap({ center = { lat: 31.5204, lng: 74.3587 }, geofences = [], label }: LiveMapProps) {
  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm" aria-label="Live GPS and geofence map">
      <div className="flex flex-wrap items-start justify-between gap-2 border-b border-slate-200 px-4 py-3">
        <div>
          <h2 className="text-sm font-bold text-slate-900">Live GPS & geofences</h2>
          <p className="mt-0.5 text-xs text-slate-500">Privacy-safe local map · coordinates stay on this device</p>
        </div>
        <span className="font-mono text-[11px] tabular-nums text-slate-500">{center.lat.toFixed(4)}, {center.lng.toFixed(4)}</span>
      </div>
      <div className="relative h-[300px] overflow-hidden bg-[linear-gradient(to_right,#dbe5df_1px,transparent_1px),linear-gradient(to_bottom,#dbe5df_1px,transparent_1px)] bg-[size:28px_28px] sm:h-[380px]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_65%_55%,rgba(16,185,129,0.14),transparent_38%),radial-gradient(circle_at_35%_30%,rgba(14,165,233,0.1),transparent_32%)]" />
        <div className="absolute left-[39%] top-[8%] h-[82%] w-[44%] -rotate-6 rounded-[48%_35%_55%_35%] border border-emerald-800/15 bg-emerald-50/70 shadow-inner" aria-hidden="true" />

        {geofences.map((zone) => (
          <div key={zone.zoneId} className="absolute -translate-x-1/2 -translate-y-1/2" style={project(zone.center)}>
            <span className="block h-12 w-12 rounded-full border-2 border-emerald-500/60 bg-emerald-400/15 ring-4 ring-emerald-300/10" />
            <span className="absolute left-1/2 top-full mt-1 -translate-x-1/2 whitespace-nowrap rounded bg-white/95 px-1.5 py-0.5 text-[10px] font-semibold text-slate-700 shadow-sm">{zone.name}</span>
          </div>
        ))}

        <div className="absolute z-10 -translate-x-1/2 -translate-y-full" style={project(center)}>
          <span className="relative flex h-10 w-10 items-center justify-center rounded-full border-4 border-white bg-emerald-600 text-white shadow-lg shadow-emerald-900/20">
            <MapPin className="h-5 w-5" aria-hidden="true" />
            <span className="absolute inset-0 -z-10 animate-ping rounded-full bg-emerald-400/50" />
          </span>
          <span className="absolute left-1/2 top-full mt-1 -translate-x-1/2 whitespace-nowrap rounded bg-slate-900 px-2 py-1 text-[10px] font-semibold text-white shadow-lg">{label ?? "Live shipment"}</span>
        </div>

        <div className="absolute bottom-3 left-3 rounded-md border border-white/80 bg-white/90 px-2 py-1 text-[10px] text-slate-500 shadow-sm">
          Pakistan operational area · {geofences.length} active zone{geofences.length === 1 ? "" : "s"}
        </div>
      </div>
    </section>
  );
}