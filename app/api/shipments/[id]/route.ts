import { NextResponse } from "next/server";
import { Shipment } from "@/lib/types";
import { findShipmentById, updateShipment } from "@/lib/server/shipment-store";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const shipment = findShipmentById(params.id);

  if (!shipment) {
    return NextResponse.json(
      { success: false, data: null, error: `Shipment "${params.id}" was not found` },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true, data: shipment });
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const payload = (await request.json()) as Partial<Shipment>;
    const updated = updateShipment(params.id, payload);

    if (!updated) {
      return NextResponse.json(
        { success: false, data: null, error: `Shipment "${params.id}" was not found` },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: updated });
  } catch {
    return NextResponse.json(
      { success: false, data: null, error: "Invalid shipment patch payload" },
      { status: 400 }
    );
  }
}
