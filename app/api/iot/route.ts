import { NextResponse } from "next/server";
import { sensorReadingListSchema, sensorReadingSchema } from "@/lib/validators/iot.schema";
import { findShipmentById } from "@/lib/server/shipment-store";
import { createHistory, fromApiShipment } from "@/lib/server/telemetry-emitter";
import { authorizeApiRequest } from "@/lib/utils/auth-server";

export const dynamic = "force-dynamic";

const DEFAULT_INTERVAL_MS = 1500;
const DEFAULT_POINTS = 30;
const MAX_POINTS = 120;

export async function GET(request: Request) {
  const auth = authorizeApiRequest(request);
  if (auth.response) return auth.response;
  const { searchParams } = new URL(request.url);
  const shipmentId = searchParams.get("shipmentId") ?? "SHP-001";
  const shipment = findShipmentById(shipmentId);

  if (!shipment) {
    return NextResponse.json(
      {
        success: false,
        data: null,
        error: `No shipment telemetry for "${shipmentId}" — it is not in the register`,
        issues: [{ path: "shipmentId", message: "Unknown shipment id" }],
      },
      { status: 404 }
    );
  }

  const rawPoints = Number.parseInt(searchParams.get("points") ?? "", 10);
  const points = Number.isNaN(rawPoints)
    ? DEFAULT_POINTS
    : Math.min(MAX_POINTS, Math.max(1, rawPoints));

  const rawInterval = Number.parseInt(searchParams.get("intervalMs") ?? "", 10);
  const intervalMs = Number.isNaN(rawInterval)
    ? DEFAULT_INTERVAL_MS
    : Math.max(200, rawInterval);

  // Same simulator the socket server drives — the bootstrap history and the
  // live stream are produced by one implementation, so they cannot diverge.
  const history = createHistory(fromApiShipment(shipment), points, intervalMs);

  const parsed = sensorReadingListSchema.safeParse(history);

  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        data: null,
        error: "Simulated telemetry failed contract validation",
        issues: parsed.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, data: parsed.data });
}

export async function POST(request: Request) {
  const auth = authorizeApiRequest(request, ["Transporter", "WarehouseAdmin"]);
  if (auth.response) return auth.response;
  let raw: unknown;

  try {
    raw = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, data: null, error: "Request body must be valid JSON" },
      { status: 400 }
    );
  }

  const parsed = sensorReadingSchema.safeParse(raw);

  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        data: null,
        error: "Sensor reading validation failed",
        issues: parsed.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      },
      { status: 400 }
    );
  }

  return NextResponse.json({ success: true, data: parsed.data }, { status: 201 });
}
