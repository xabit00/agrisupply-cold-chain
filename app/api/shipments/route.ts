import { NextResponse } from "next/server";
import { Shipment } from "@/lib/types";

const mockShipments: Shipment[] = [
  {
    id: "SHP-001",
    trackingNumber: "TRK-9821-DAIRY",
    farmerId: "usr_farm_01",
    transporterId: "usr_trans_01",
    warehouseId: "usr_wh_01",
    retailerId: "usr_ret_01",
    produce: {
      id: "PRD-01",
      name: "Pasteurized Whole Milk",
      category: "Dairy",
      quantityKg: 2400,
      optimalTempMin: 1.5,
      optimalTempMax: 4.0,
      optimalHumidityMin: 65,
      optimalHumidityMax: 85,
    },
    origin: {
      name: "Green Valley Farm Hub",
      address: "128 Meadow Way, Farmstead County",
      coordinates: { lat: 36.7783, lng: -119.4179 },
      reachedAt: "2026-09-28T06:00:00Z",
    },
    destination: {
      name: "Metro Cold Depot #4",
      address: "890 Industrial Blvd, Metro City",
      coordinates: { lat: 37.7749, lng: -122.4194 },
    },
    status: "InTransit",
    currentLocation: { lat: 37.2, lng: -120.9 },
    temperatureAlert: false,
    humidityAlert: false,
    tamperAlert: false,
    createdAt: "2026-09-28T06:00:00Z",
    updatedAt: "2026-09-28T10:30:00Z",
  },
  {
    id: "SHP-002",
    trackingNumber: "TRK-9822-BERRY",
    farmerId: "usr_farm_02",
    produce: {
      id: "PRD-02",
      name: "Organic Strawberries",
      category: "Fruits",
      quantityKg: 1200,
      optimalTempMin: 0.5,
      optimalTempMax: 2.0,
      optimalHumidityMin: 90,
      optimalHumidityMax: 95,
    },
    origin: {
      name: "Sunny Ridge Berry Farm",
      address: "44 Berry Lane, Watsonville",
      coordinates: { lat: 36.9102, lng: -121.7558 },
    },
    destination: {
      name: "Fresh Foods Central Distribution",
      address: "500 Logistics Way, San Jose",
      coordinates: { lat: 37.3382, lng: -121.8863 },
    },
    status: "Harvested",
    temperatureAlert: false,
    humidityAlert: false,
    tamperAlert: false,
    createdAt: "2026-09-28T07:15:00Z",
    updatedAt: "2026-09-28T07:15:00Z",
  },
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1", 10);
  const pageSize = parseInt(searchParams.get("pageSize") || "10", 10);

  return NextResponse.json({
    success: true,
    data: {
      items: mockShipments,
      total: mockShipments.length,
      page,
      pageSize,
      totalPages: 1,
    },
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const newShipment: Shipment = {
      ...body,
      id: `SHP-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockShipments.push(newShipment);
    return NextResponse.json({ success: true, data: newShipment });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to create shipment" },
      { status: 400 }
    );
  }
}
