"use client";

import React from "react";
import { GeoCoordinate } from "@/lib/types";

interface LiveMapProps {
  center?: GeoCoordinate;
  zoom?: number;
}

export function LiveMap({ center = { lat: 37.0, lng: -120.0 } }: LiveMapProps) {
  return (
    <div className="relative h-[400px] w-full overflow-hidden rounded-lg border bg-slate-100 flex items-center justify-center">
      <div className="text-center p-4">
        <p className="font-semibold text-slate-700">Live GPS & Geofencing Viewport</p>
        <p className="text-xs text-slate-500 mt-1">
          Simulating tracking coordinates [{center.lat}, {center.lng}]
        </p>
      </div>
    </div>
  );
}
