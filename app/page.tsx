import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
      <div className="max-w-xl space-y-4">
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800">
          <span>Cold-Chain Telemetry System</span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-slate-900">
          AgriSupply Logistics Platform
        </h1>
        <p className="text-sm text-slate-600 sm:text-base">
          Enterprise multi-tenant cold-chain management with live IoT telemetry, geofencing,
          and offline-first synchronization.
        </p>
        <div className="pt-2">
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
          >
            Access Portal
          </Link>
        </div>
      </div>
    </main>
  );
}
