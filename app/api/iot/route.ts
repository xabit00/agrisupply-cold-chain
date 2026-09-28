import { NextResponse } from "next/server";
import { SensorReading } from "@/lib/types";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const shipmentId = searchParams.get("shipmentId") || "SHP-001";

  const readings: SensorReading[] = [
    {
      id: "rd_01",
      shipmentId,
      temperature: 3.4,
      humidity: 78,
      batteryPct: 94,
      signalStrengthDbm: -68,
      ambientLightLux: 5,
      location: { lat: 37.2, lng: -120.9 },
      timestamp: new Date().toISOString(),
      isBreached: false,
    },
  ];

  return NextResponse.json({ success: true, data: readings });
}

export async function POST(request: Request) {
  try {
    const reading = await request.json();
    return NextResponse.json({ success: true, data: reading });
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid sensor telemetry" },
      { status: 400 }
    );
  }
}
