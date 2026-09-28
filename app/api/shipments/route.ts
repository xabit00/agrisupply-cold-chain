import { NextResponse } from "next/server";
import { PaginationParams, Shipment } from "@/lib/types";
import { listShipments, createShipment } from "@/lib/server/shipment-store";

export const dynamic = "force-dynamic";

function parseStatusFilter(value: string | null): PaginationParams["statusFilter"] {
  const allowed: PaginationParams["statusFilter"][] = [
    "ALL",
    "Draft",
    "Harvested",
    "InTransit",
    "ColdStorage",
    "Delivered",
    "Compromised",
  ];
  const match = allowed.find((candidate) => candidate === value);
  return match ?? "ALL";
}

function parseCategoryFilter(value: string | null): PaginationParams["categoryFilter"] {
  const allowed: PaginationParams["categoryFilter"][] = [
    "ALL",
    "Dairy",
    "Fruits",
    "Vegetables",
    "Meat",
    "Seafood",
    "Flowers",
  ];
  const match = allowed.find((candidate) => candidate === value);
  return match ?? "ALL";
}

export async function GET(request: Request) {
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
  try {
    const payload = (await request.json()) as Partial<Shipment>;
    const created = createShipment(payload);
    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch {
    return NextResponse.json(
      { success: false, data: null, error: "Invalid shipment payload" },
      { status: 400 }
    );
  }
}
