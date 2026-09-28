import { NextResponse } from "next/server";
import { verifyJwt } from "@/lib/utils/jwt";
import { AUTH_COOKIE_NAME } from "@/lib/constants/roles";

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    let token = authHeader?.replace("Bearer ", "");

    if (!token) {
      // Check cookie fallback
      const cookieHeader = request.headers.get("cookie");
      if (cookieHeader) {
        const match = cookieHeader
          .split(";")
          .map((c) => c.trim())
          .find((c) => c.startsWith(`${AUTH_COOKIE_NAME}=`));
        if (match) {
          token = match.split("=")[1];
        }
      }
    }

    if (!token) {
      return NextResponse.json(
        { success: false, data: null, error: "Missing authorization token" },
        { status: 401 }
      );
    }

    const user = verifyJwt(token);

    if (!user) {
      return NextResponse.json(
        { success: false, data: null, error: "Invalid or expired token" },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      data: user,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : "Failed to verify session",
      },
      { status: 500 }
    );
  }
}

