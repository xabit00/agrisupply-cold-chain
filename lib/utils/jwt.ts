import jwt from "jsonwebtoken";
import { User } from "@/lib/types";

const JWT_SECRET = process.env.JWT_SECRET || "agrisupply-coldchain-secret-key-2026-strict";

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
    JWT_SECRET,
    { expiresIn: "24h" }
  );
}

export function verifyJwt(token: string): User | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload;
    if (!decoded || !decoded.sub || !decoded.role) {
      return null;
    }
    return {
      id: decoded.sub as string,
      name: decoded.name as string,
      email: decoded.email as string,
      role: decoded.role,
      organizationId: decoded.organizationId as string,
      avatarUrl: decoded.avatarUrl as string | undefined,
      createdAt: decoded.createdAt as string,
    };
  } catch {
    return null;
  }
}
