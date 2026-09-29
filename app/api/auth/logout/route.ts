import { NextResponse } from "next/server";
import { AUTH_COOKIE_NAME } from "@/lib/constants/roles";

export async function POST(request: Request) {
  const response = NextResponse.json({ success: true, data: null });
  response.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production" && new URL(request.url).protocol === "https:",
    path: "/",
    maxAge: 0,
  });
  return response;
}