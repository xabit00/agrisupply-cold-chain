import { NextResponse } from "next/server";
import { PaginationParams, Shipment } from "@/lib/types";
import { authorizeApiRequest } from "@/lib/utils/auth-server";
import { listShipments, createShipment } from "@/lib/server/shipment-store";
import { shipmentSchema } from "@/lib/validators/shipment.schema";
import {
  PRODUCE_CATEGORIES,
  SHIPMENT_STATUSES,
} from "@/lib/constants/produce-presets";

export const dynamic = "force-dynamic";

const idempotentCreates = new Map<string, Shipment>();

function parseStatusFilter(value: string | null): PaginationParams["statusFilter"] {
  const match = SHIPMENT_STATUSES.find((candidate) => candidate === value);
  return match ?? "ALL";
}

function parseCategoryFilter(value: string | null): PaginationParams["categoryFilter"] {
  const match = PRODUCE_CATEGORIES.find((candidate) => candidate === value);
  return match ?? "ALL";
}

export async function GET(request: Request) {
  const auth = authorizeApiRequest(request, undefined, { allowInternal: true });
  if (auth.response) return auth.response;
  const { searchParams } = new URL(request.url);

  const page = Number.parseInt(searchParams.get("page") ?? "1", 10);
  const pageSize = Number.parseInt(searchParams.get("pageSize") ?? "10", 10);

  const result = listShipments({
    page: Number.isNaN(page) ? 1 : page,
    pageSize: Number.isNaN(pageSize) ? 10 : pageSize,
    searchQuery: searchParams.get("searchQuery") ?? undefined,
    statusFilter: parseStatusFilter(searchParams.get("statusFilter")),
    categoryFilter: parseCategoryFilter(searchParams.get("categoryFilter")),
    sortBy: searchParams.get("sortBy") ?? "createdAt",
    sortOrder: searchParams.get("sortOrder") === "asc" ? "asc" : "desc",
  });

  return NextResponse.json({ success: true, data: result });
}

export async function POST(request: Request) {
  const auth = authorizeApiRequest(request, ["Farmer"]);
  if (auth.response) return auth.response;

  const idempotencyKey = request.headers.get("x-idempotency-key");
  if (idempotencyKey && idempotentCreates.has(idempotencyKey)) {
    return NextResponse.json({ success: true, data: idempotentCreates.get(idempotencyKey) });
  }

  let raw: unknown;

  try {
    raw = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, data: null, error: "Request body must be valid JSON" },
      { status: 400 }
    );
  }

  // Same zod schema the multi-step form uses client-side — one contract, no drift.
  const parsed = shipmentSchema.safeParse(raw);

  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        data: null,
        error: "Shipment validation failed",
        issues: parsed.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      },
      { status: 400 }
    );
  }

  const created = createShipment(parsed.data);
  if (idempotencyKey) idempotentCreates.set(idempotencyKey, created);
  return NextResponse.json({ success: true, data: created }, { status: 201 });
}
