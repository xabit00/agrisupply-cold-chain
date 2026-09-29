import { NextResponse } from "next/server";
import { computeColdChainMetrics } from "@/lib/server/shipment-store";
import { authorizeApiRequest } from "@/lib/utils/auth-server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = authorizeApiRequest(request);
  if (auth.response) return auth.response;
  return NextResponse.json({ success: true, data: computeColdChainMetrics() });
}