import { NextResponse } from "next/server";
import { Geofence } from "@/lib/types";

export const dynamic = "force-dynamic";

const geofences: Geofence[] = [
  {
    zoneId: "geo_origin_01",
    name: "Green Valley Farm Hub",
    type: "OriginFarm",
    center: { lat: 36.7783, lng: -119.4179 },
    radiusMeters: 500,
    permittedTempRange: { min: 0, max: 8 },
  },
  {
    zoneId: "geo_depot_04",
    name: "Metro Cold Depot #4",
    type: "ColdStorageFacility",
    center: { lat: 37.7749, lng: -122.4194 },
    radiusMeters: 800,
    permittedTempRange: { min: 1, max: 4 },
  },
];

export async function GET() {
  return NextResponse.json({ success: true, data: geofences });
}
