"use client";

import React, { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/stores/auth.store";
import { ROLE_DEFAULT_ROUTES } from "@/lib/constants/roles";
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
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated || !user) {
    return (
      <div className="flex h-screen items-center justify-center text-sm text-slate-500">
        Authenticating session...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {!isOnline && (
        <div className="bg-amber-500 px-4 py-1.5 text-center text-xs font-semibold text-white">
          Offline Mode Active - Mutations are queued and will automatically sync once reconnected.
        </div>
      )}
      <header className="border-b bg-white px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <span className="font-bold text-emerald-700">AgriSupply Cold-Chain</span>
          <nav className="flex gap-4 text-xs font-medium">
            <Link
              href="/farmer"
              className={pathname === "/farmer" ? "text-emerald-700 font-semibold" : "text-slate-600 hover:text-slate-900"}
            >
              Farmer
            </Link>
            <Link
              href="/transporter"
              className={pathname === "/transporter" ? "text-emerald-700 font-semibold" : "text-slate-600 hover:text-slate-900"}
            >
              Transporter
            </Link>
            <Link
              href="/warehouse"
              className={pathname === "/warehouse" ? "text-emerald-700 font-semibold" : "text-slate-600 hover:text-slate-900"}
            >
              Warehouse
            </Link>
            <Link
              href="/retailer"
              className={pathname === "/retailer" ? "text-emerald-700 font-semibold" : "text-slate-600 hover:text-slate-900"}
            >
              Retailer
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
            {user.role}: {user.name}
          </span>
          <button
            onClick={() => {
              logout();
              router.push("/login");
            }}
            className="rounded border border-slate-200 px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-100"
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="p-6">{children}</main>
    </div>
  );
}
