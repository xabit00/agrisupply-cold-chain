"use client";

import React, { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { LogOut, WifiOff } from "lucide-react";
import { useAuthStore } from "@/stores/auth.store";
import { ROLE_DEFAULT_ROUTES } from "@/lib/constants/roles";
import { useOnlineStatus } from "@/lib/hooks/use-online-status";
import { SocketProvider } from "@/providers/socket-provider";

const ROLE_LABELS = {
  Farmer: "Farmer Hub",
  Transporter: "Transporter Fleet",
  WarehouseAdmin: "Cold Storage Vault",
  Retailer: "Retailer Intake",
} as const;

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, isInitialized, logout } = useAuthStore();
  const { isOnline, pendingTransactionsCount } = useOnlineStatus();

  useEffect(() => {
    if (!isInitialized) return;
    if (!isAuthenticated || !user) {
      router.replace("/login");
      return;
    }

    const allowedRoute = ROLE_DEFAULT_ROUTES[user.role];
    const currentSection = `/${pathname.split("/")[1]}`;
    if (["/farmer", "/transporter", "/warehouse", "/retailer"].includes(currentSection) && currentSection !== allowedRoute) {
      router.replace(allowedRoute);
    }
  }, [isAuthenticated, isInitialized, user, pathname, router]);

  if (!isInitialized || !isAuthenticated || !user) {
    return (
      <main id="main-content" className="flex min-h-dvh items-center justify-center bg-slate-50 px-4 text-sm text-slate-500">
        Authenticating session...
      </main>
    );
  }

  const roleRoute = ROLE_DEFAULT_ROUTES[user.role];

  const handleSignOut = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" });
    } finally {
      logout();
      router.replace("/login");
    }
  };

  return (
    <div className="min-h-dvh bg-slate-50">
      {!isOnline && (
        <div className="flex items-center justify-center gap-2 bg-amber-500 px-3 py-2 text-center text-xs font-semibold text-white shadow-inner">
          <WifiOff className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>Offline mode · {pendingTransactionsCount} change{pendingTransactionsCount === 1 ? "" : "s"} waiting to sync</span>
        </div>
      )}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 px-3 py-3 backdrop-blur sm:px-6">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3 sm:gap-6">
            <Link href={roleRoute} className="flex min-w-0 items-center gap-2 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-500" aria-hidden="true" />
              <span className="truncate text-sm font-bold tracking-tight text-slate-900 sm:text-base">
                AgriSupply <span className="hidden sm:inline">Cold-Chain</span>
              </span>
            </Link>
            <nav aria-label="Role navigation" className="hidden sm:block">
              <Link
                href={roleRoute}
                aria-current={pathname.startsWith(roleRoute) ? "page" : undefined}
                className="border-b-2 border-emerald-600 pb-1 text-xs font-bold text-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
              >
                {ROLE_LABELS[user.role]}
              </Link>
            </nav>
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <div className="hidden text-right sm:flex sm:flex-col">
              <span className="max-w-32 truncate text-xs font-semibold text-slate-800">{user.name}</span>
              <span className="text-[10px] font-medium text-emerald-700">{ROLE_LABELS[user.role]}</span>
            </div>
            <button
              type="button"
              onClick={() => void handleSignOut()}
              aria-label="Sign out"
              className="inline-flex min-h-9 items-center gap-1.5 rounded-md border border-slate-200 px-2.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 sm:px-3"
            >
              <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>
      </header>

      <main id="main-content" className="mx-auto w-full max-w-7xl px-3 py-4 sm:px-6 sm:py-6">
        {children}
      </main>
    </div>
  );
}