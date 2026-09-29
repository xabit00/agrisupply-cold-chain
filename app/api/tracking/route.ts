import { NextResponse } from "next/server";
import type { GeoCoordinate, Geofence, GeofenceAlert } from "@/lib/types";
import { authorizeApiRequest } from "@/lib/utils/auth-server";

export const dynamic = "force-dynamic";

const geofences: Geofence[] = [
  {
    zoneId: "geo_sargodha_farm",
    name: "Sargodha Farm Zone",
    type: "OriginFarm",
    center: { lat: 32.0836, lng: 72.6711 },
    radiusMeters: 2500,
    permittedTempRange: { min: 1, max: 8 },
  },
  {
    zoneId: "geo_lahore_market",
    name: "Lahore Produce Market",
    type: "RetailOutlet",
    center: { lat: 31.5204, lng: 74.3587 },
    radiusMeters: 1800,
    permittedTempRange: { min: 1, max: 8 },
  },
  {
    zoneId: "geo_islamabad_cold",
    name: "Islamabad Cold Storage",
    type: "ColdStorageFacility",
    center: { lat: 33.6844, lng: 73.0479 },
    radiusMeters: 1800,
    permittedTempRange: { min: 1, max: 6 },
  },
  {
    zoneId: "geo_faisalabad_hub",
    name: "Faisalabad Logistics Hub",
    type: "TransitHub",
    center: { lat: 31.4504, lng: 73.135 },
    radiusMeters: 2200,
    permittedTempRange: { min: 0, max: 10 },
  },
];

const alerts: GeofenceAlert[] = [];
const insideZones = new Map<string, Set<string>>();

function distanceMeters(a: GeoCoordinate, b: GeoCoordinate) {
  const radians = (degrees: number) => (degrees * Math.PI) / 180;
  const earthRadius = 6_371_000;
  const dLat = radians(b.lat - a.lat);
  const dLng = radians(b.lng - a.lng);
  const lat1 = radians(a.lat);
  const lat2 = radians(b.lat);
  const value = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return earthRadius * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

export async function GET(request: Request) {
  const auth = authorizeApiRequest(request);
  if (auth.response) return auth.response;

  const { searchParams } = new URL(request.url);
  if (searchParams.get("type") === "geofences") {
    return NextResponse.json({ success: true, data: geofences });
  }

  const shipmentId = searchParams.get("shipmentId");
  const filtered = shipmentId ? alerts.filter((alert) => alert.shipmentId === shipmentId) : alerts;
  return NextResponse.json({ success: true, data: filtered.slice(0, 100) });
}

export async function POST(request: Request) {
  const auth = authorizeApiRequest(request, ["Transporter", "WarehouseAdmin"]);
  if (auth.response) return auth.response;

  let body: { shipmentId?: string; coordinate?: GeoCoordinate };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, data: null, error: "Request body must be valid JSON" }, { status: 400 });
  }

  const { shipmentId, coordinate } = body;
  if (!shipmentId || !coordinate || !Number.isFinite(coordinate.lat) || !Number.isFinite(coordinate.lng)) {
    return NextResponse.json({ success: false, data: null, error: "shipmentId and valid coordinates are required" }, { status: 400 });
  }

  const previous = insideZones.get(shipmentId) ?? new Set<string>();
  const current = new Set<string>();
  const created: GeofenceAlert[] = [];

  for (const zone of geofences) {
    const isInside = distanceMeters(coordinate, zone.center) <= zone.radiusMeters;
    if (isInside) current.add(zone.zoneId);
    const eventType = isInside && !previous.has(zone.zoneId) ? "ENTER" : !isInside && previous.has(zone.zoneId) ? "EXIT" : null;
    if (eventType) {
      const alert: GeofenceAlert = {
        id: `geo_${Date.now()}_${zone.zoneId}`,
        shipmentId,
        zoneId: zone.zoneId,
        eventType,
        timestamp: new Date().toISOString(),
        coordinates: coordinate,
      };
      alerts.unshift(alert);
      created.push(alert);
    }
  }

  insideZones.set(shipmentId, current);
  return NextResponse.json({ success: true, data: created }, { status: 201 });
}