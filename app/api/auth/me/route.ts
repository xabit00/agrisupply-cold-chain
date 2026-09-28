import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  return NextResponse.json({
    success: true,
    data: {
      id: "usr_mock_01",
      name: "Mock Session User",
      email: "user@agrisupply.com",
      role: "Farmer",
      organizationId: "org_alpha",
      createdAt: new Date().toISOString(),
    },
  });
}
