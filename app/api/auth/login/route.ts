import { NextResponse } from "next/server";
import { UserRole } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    let role: UserRole = "Farmer";
    if (email.includes("transporter")) role = "Transporter";
    if (email.includes("warehouse")) role = "WarehouseAdmin";
    if (email.includes("retailer")) role = "Retailer";

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: `usr_${Date.now()}`,
          name: `${role} Demo User`,
          email,
          role,
          organizationId: "org_alpha",
          createdAt: new Date().toISOString(),
        },
        token: `jwt_session_${role.toLowerCase()}_${Date.now()}`,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Invalid login payload" },
      { status: 400 }
    );
  }
}
