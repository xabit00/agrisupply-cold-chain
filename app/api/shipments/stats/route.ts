import { NextResponse } from "next/server";
import { computeColdChainMetrics } from "@/lib/server/shipment-store";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ success: true, data: computeColdChainMetrics() });
}
