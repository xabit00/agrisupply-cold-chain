"use client";

import React, { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/stores/auth.store";
import { ROLE_DEFAULT_ROUTES, AUTH_COOKIE_NAME } from "@/lib/constants/roles";
import { useOnlineStatus } from "@/lib/hooks/use-online-status";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuthStore();
  const { isOnline } = useOnlineStatus();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    // Role-based boundary enforcement
    if (user) {
      const allowedRoute = ROLE_DEFAULT_ROUTES[user.role];
      const currentSection = "/" + pathname.split("/")[1];

      // If user navigates to an unauthorized role portal, redirect back to their portal
      if (
        ["/farmer", "/transporter", "/warehouse", "/retailer"].includes(currentSection) &&
        currentSection !== allowedRoute
      ) {
        router.replace(allowedRoute);
      }
    }
  }, [isAuthenticated, user, pathname, router]);

  if (!isAuthenticated || !user) {
    return (
      <div className="flex h-screen items-center justify-center text-sm text-slate-500">
        Authenticating session...
      </div>
    );
  }

  const handleSignOut = () => {
    // Clear cookie
    document.cookie = `${AUTH_COOKIE_NAME}=; path=/; max-age=0;`;
    logout();
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {!isOnline && (
        <div className="bg-amber-500 px-4 py-1.5 text-center text-xs font-semibold text-white shadow-inner">
          Offline Mode Active - Mutations are queued and will automatically sync once reconnected.
        </div>
      )}
      <header className="border-b bg-white px-6 py-3 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-bold text-slate-900 tracking-tight">AgriSupply Cold-Chain</span>
          </div>

          <nav className="flex gap-4 text-xs font-medium">
            <Link
              href="/farmer"
              className={pathname.startsWith("/farmer") ? "text-emerald-700 font-bold border-b-2 border-emerald-600 pb-1" : "text-slate-500 hover:text-slate-900"}
            >
              Farmer Hub
            </Link>
            <Link
              href="/transporter"
              className={pathname.startsWith("/transporter") ? "text-emerald-700 font-bold border-b-2 border-emerald-600 pb-1" : "text-slate-500 hover:text-slate-900"}
            >
              Transporter Fleet
            </Link>
            <Link
              href="/warehouse"
              className={pathname.startsWith("/warehouse") ? "text-emerald-700 font-bold border-b-2 border-emerald-600 pb-1" : "text-slate-500 hover:text-slate-900"}
            >
              Cold Storage Vault
            </Link>
            <Link
              href="/retailer"
              className={pathname.startsWith("/retailer") ? "text-emerald-700 font-bold border-b-2 border-emerald-600 pb-1" : "text-slate-500 hover:text-slate-900"}
            >
              Retailer Intake
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex flex-col text-right">
            <span className="text-xs font-semibold text-slate-800">{user.name}</span>
            <span className="text-[10px] text-emerald-600 font-medium">{user.role}</span>
          </div>
          <button
            onClick={handleSignOut}
            className="rounded border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 transition"
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="p-6 max-w-7xl mx-auto">{children}</main>
    </div>
  );
}
