import { NextResponse } from "next/server";
import { findShipmentById, updateShipment, deleteShipment } from "@/lib/server/shipment-repository";
import { shipmentStatusUpdateSchema } from "@/lib/validators/shipment.schema";
import { authorizeApiRequest } from "@/lib/utils/auth-server";

export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = authorizeApiRequest(request);
  if (auth.response) return auth.response;
  const { id } = await params;

  const shipment = await findShipmentById(id);
  if (!shipment) {
    return NextResponse.json({ success: false, data: null, error: `Shipment "${id}" was not found` }, { status: 404 });
  }
  return NextResponse.json({ success: true, data: shipment });
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = authorizeApiRequest(request, ["Farmer", "Transporter", "WarehouseAdmin"]);
  if (auth.response) return auth.response;
  const { id } = await params;

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ success: false, data: null, error: "Request body must be valid JSON" }, { status: 400 });
  }

  const parsed = shipmentStatusUpdateSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({
      success: false,
      data: null,
      error: "Shipment status update failed",
      issues: parsed.error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message })),
    }, { status: 400 });
  }

  const updated = await updateShipment(id, parsed.data);
  if (!updated) {
    return NextResponse.json({ success: false, data: null, error: `Shipment "${id}" was not found` }, { status: 404 });
  }
  return NextResponse.json({ success: true, data: updated });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = authorizeApiRequest(request, ["Farmer"]);
  if (auth.response) return auth.response;
  const { id } = await params;

  const shipment = await findShipmentById(id);
  if (!shipment) {
    return NextResponse.json({ success: false, data: null, error: `Shipment "${id}" was not found` }, { status: 404 });
  }
  if (shipment.status !== "Draft") {
    return NextResponse.json({ success: false, data: null, error: "Only draft shipments can be deleted" }, { status: 409 });
  }

  await deleteShipment(id);
  return NextResponse.json({ success: true, data: shipment });
}
