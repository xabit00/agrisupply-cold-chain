import { NextResponse } from "next/server";
import { findShipmentById, updateShipment } from "@/lib/server/shipment-store";
import { shipmentStatusUpdateSchema } from "@/lib/validators/shipment.schema";

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
  let raw: unknown;

  try {
    raw = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, data: null, error: "Request body must be valid JSON" },
      { status: 400 }
    );
  }

  // Same zod contract the Kanban board fires — a stage move is validated
  // server-side so an unknown status can never reach the store.
  const parsed = shipmentStatusUpdateSchema.safeParse(raw);

  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        data: null,
        error: "Shipment status update failed",
        issues: parsed.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      },
      { status: 400 }
    );
  }

  const updated = updateShipment(params.id, parsed.data);

  if (!updated) {
    return NextResponse.json(
      {
        success: false,
        data: null,
        error: `Shipment "${params.id}" was not found`,
      },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true, data: updated });
}
