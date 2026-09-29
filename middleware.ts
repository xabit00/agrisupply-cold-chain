import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { UserRole } from "@/lib/types";
import { AUTH_COOKIE_NAME, ROLE_DEFAULT_ROUTES } from "@/lib/constants/roles";

const ROUTE_ROLES: Record<string, UserRole> = {
  "/farmer": "Farmer",
  "/transporter": "Transporter",
  "/warehouse": "WarehouseAdmin",
  "/retailer": "Retailer",
};

function decodeBase64Url(value: string): ArrayBuffer {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  return bytes.buffer as ArrayBuffer;
}

async function verifiedRole(token: string): Promise<UserRole | null> {
  try {
    const [headerPart, payloadPart, signaturePart] = token.split(".");
    if (!headerPart || !payloadPart || !signaturePart) return null;

    const header = JSON.parse(new TextDecoder().decode(decodeBase64Url(headerPart))) as { alg?: string };
    if (header.alg !== "HS256") return null;

    const secret = process.env.JWT_SECRET || (process.env.NODE_ENV === "production" ? "" : "agrisupply-coldchain-local-development-only");
    if (!secret) return null;
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );
    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      decodeBase64Url(signaturePart),
      new TextEncoder().encode(`${headerPart}.${payloadPart}`)
    );
    if (!valid) return null;

    const payload = JSON.parse(new TextDecoder().decode(decodeBase64Url(payloadPart))) as {
      role?: UserRole;
      exp?: number;
    };
    if (!payload.role || !Object.values(ROUTE_ROLES).includes(payload.role)) return null;
    if (!payload.exp || payload.exp * 1000 <= Date.now()) return null;
    return payload.role;
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const route = Object.keys(ROUTE_ROLES).find((prefix) => pathname.startsWith(prefix));
  if (!route) return NextResponse.next();

  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const role = token ? await verifiedRole(token) : null;
  if (!role) {
    const response = NextResponse.redirect(new URL(`/login?callbackUrl=${encodeURIComponent(pathname)}`, request.url));
    response.cookies.delete(AUTH_COOKIE_NAME);
    return response;
  }

  const requiredRole = ROUTE_ROLES[route];
  if (role !== requiredRole) {
    return NextResponse.redirect(new URL(ROLE_DEFAULT_ROUTES[role], request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/farmer/:path*", "/transporter/:path*", "/warehouse/:path*", "/retailer/:path*"],
};