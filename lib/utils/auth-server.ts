import { NextResponse } from "next/server";
import type { User, UserRole } from "@/lib/types";
import { AUTH_COOKIE_NAME } from "@/lib/constants/roles";
import { verifyJwt } from "@/lib/utils/jwt";

export type ApiAuthorization =
  | { user: User; response?: never }
  | { user?: never; response: NextResponse };

function bearerToken(request: Request): string | undefined {
  const header = request.headers.get("authorization");
  if (header?.startsWith("Bearer ")) return header.slice(7).trim();

  const cookie = request.headers.get("cookie");
  return cookie
    ?.split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith(`${AUTH_COOKIE_NAME}=`))
    ?.slice(AUTH_COOKIE_NAME.length + 1);
}

export function authorizeApiRequest(
  request: Request,
  allowedRoles?: readonly UserRole[],
  options: { allowInternal?: boolean } = {}
): ApiAuthorization {
  if (options.allowInternal) {
    const expected = process.env.INTERNAL_API_KEY;
    const supplied = request.headers.get("x-agri-internal");
    if (expected && supplied && supplied === expected) {
      return {
        user: {
          id: "internal-telemetry-service",
          name: "Telemetry Service",
          email: "telemetry@agrisupply.pk",
          role: "WarehouseAdmin",
          organizationId: "agrisupply-system",
          createdAt: new Date(0).toISOString(),
        },
      };
    }
  }

  const token = bearerToken(request);
  const user = token ? verifyJwt(token) : null;
  if (!user) {
    return {
      response: NextResponse.json(
        { success: false, data: null, error: "Authentication required" },
        { status: 401 }
      ),
    };
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return {
      response: NextResponse.json(
        { success: false, data: null, error: "You do not have permission to perform this action" },
        { status: 403 }
      ),
    };
  }

  return { user };
}