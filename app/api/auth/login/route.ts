import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { loginSchema } from "@/lib/validators/auth.schema";
import { MOCK_USERS, AUTH_COOKIE_NAME } from "@/lib/constants/roles";
import { signJwt } from "@/lib/utils/jwt";
import { AuthSession } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parsed = loginSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: parsed.error.errors[0]?.message || "Validation failed",
        },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;
    const account = MOCK_USERS[email.toLowerCase().trim()];

    if (!account) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: "Invalid email or password",
        },
        { status: 401 }
      );
    }

    const isHashMatch = await bcrypt.compare(password, account.passwordHash);

    if (!isHashMatch) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: "Invalid email or password",
        },
        { status: 401 }
      );
    }

    const token = signJwt(account.user);

    const session: AuthSession = {
      user: account.user,
    };

    const response = NextResponse.json({
      success: true,
      data: session,
      message: `Authenticated as ${account.user.role}`,
    });

    // Keep the signed session inaccessible to client-side JavaScript.
    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: token,
      httpOnly: true,
      // Only mark secure when actually served over HTTPS, so local/LAN http demos
      // still receive the cookie (browsers drop Secure cookies on plain http origins).
      secure:
        process.env.NODE_ENV === "production" &&
        new URL(request.url).protocol === "https:",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24, // 24 hours
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : "Authentication failed",
      },
      { status: 500 }
    );
  }
}

