import jwt from "jsonwebtoken";
import type { User } from "@/lib/types";

function jwtSecret(): string {
  const configured = process.env.JWT_SECRET;
  if (configured) return configured;
  if (process.env.NODE_ENV === "production") {
    throw new Error("JWT_SECRET must be configured in production");
  }
  return "agrisupply-coldchain-local-development-only";
}

export function signJwt(user: User): string {
  return jwt.sign(
    {
      sub: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt,
    },
    jwtSecret(),
    { expiresIn: "24h" }
  );
}

export function verifyJwt(token: string): User | null {
  try {
    const decoded = jwt.verify(token, jwtSecret()) as jwt.JwtPayload;
    if (!decoded?.sub || !decoded.role || !decoded.name || !decoded.email || !decoded.organizationId) return null;
    return {
      id: String(decoded.sub),
      name: String(decoded.name),
      email: String(decoded.email),
      role: decoded.role,
      organizationId: String(decoded.organizationId),
      avatarUrl: decoded.avatarUrl ? String(decoded.avatarUrl) : undefined,
      createdAt: decoded.createdAt ? String(decoded.createdAt) : new Date(0).toISOString(),
    };
  } catch {
    return null;
  }
}