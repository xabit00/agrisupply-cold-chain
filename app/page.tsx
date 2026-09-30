import Image from "next/image";
import Link from "next/link";

export default function HomePage() {
  return (
    <main
      id="main-content"
      className="min-h-[100dvh] overflow-hidden border-t-[6px] border-[#14532d] bg-[#f3f6f3] text-[#102118]"
    >
      <section className="mx-auto grid min-h-[100dvh] max-w-[1600px] grid-cols-1 lg:grid-cols-2 lg:gap-3 lg:p-3">
        <div className="flex items-center px-6 py-12 sm:px-10 md:px-16 lg:px-16 lg:py-16 xl:px-20">
          <div className="w-full max-w-[640px]">
            <div className="inline-flex rounded-lg border border-[#16a34a]/25 bg-[#16a34a]/[0.07] px-3 py-2 text-xs font-bold tracking-[0.06em] text-emerald-800 shadow-[inset_0_1px_0_rgba(255,255,255,0.72)]">
              Cold-Chain Telemetry System
            </div>
            <h1 className="mt-8 text-4xl font-black leading-[0.98] tracking-[-0.045em] text-[#102118] sm:text-5xl lg:text-[2.125rem] xl:text-[2.375rem]">
              <span className="lg:block">Pakistan&apos;s Smart Cold-Chain</span>{" "}
              <span className="lg:block">Logistics Platform</span>
            </h1>
            <p className="mt-6 max-w-[56ch] text-base font-medium leading-7 text-slate-600 sm:text-lg sm:leading-8">
              Enterprise multi-tenant cold-chain management with live IoT telemetry,
              geofencing, and offline-first synchronization.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[11px] font-bold text-[#166534]">
                8+ Produce Categories
              </span>
              <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[11px] font-bold text-[#166534]">
                4 User Roles
              </span>
              <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[11px] font-bold text-[#166534]">
                Live IoT Monitoring
              </span>
            </div>
            <div className="mt-8">
              <Link
                href="/login"
                className="inline-flex h-12 items-center justify-center whitespace-nowrap rounded-xl bg-[#16a34a] px-6 text-sm font-bold text-emerald-50 shadow-[0_12px_28px_rgba(22,163,74,0.24)] transition duration-200 hover:-translate-y-0.5 hover:bg-emerald-700 hover:shadow-[0_16px_34px_rgba(22,163,74,0.28)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#16a34a] active:translate-y-px"
              >
                Access Portal
              </Link>
            </div>
          </div>
        </div>
        <div className="relative min-h-[52vh] overflow-hidden border-emerald-950/10 lg:min-h-0 lg:rounded-2xl lg:border">
          <Image
            src="/images/welcome-sargodha-cold-chain.jpg"
            alt="Kinnow harvest and refrigerated transport in a Sargodha orchard"
            fill
            priority
            sizes="(min-width: 1024px) 55vw, 100vw"
            className="object-cover object-[58%_center] transition-transform duration-700 ease-out hover:scale-[1.015]"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(7,20,13,0.02),rgba(7,20,13,0.16))]"
          />
        </div>
      </section>
      <section className="border-t border-emerald-950/10 bg-[#edf3ee] px-6 py-8 sm:px-10">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-3 lg:grid-cols-4">
          <div className="flex items-center gap-3 rounded-xl border border-emerald-950/10 bg-[#f8faf8] px-4 py-4 shadow-[0_8px_24px_rgba(20,83,45,0.06)] transition duration-300 ease-out hover:-translate-y-1 hover:border-emerald-300 hover:shadow-[0_14px_30px_rgba(20,83,45,0.12)]">
            <span aria-hidden="true" className="h-5 w-1 rounded-full bg-[#16a34a]" />
            <span className="text-sm font-bold text-[#14532d]">Farmer Hub</span>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-emerald-950/10 bg-[#f8faf8] px-4 py-4 shadow-[0_8px_24px_rgba(20,83,45,0.06)] transition duration-300 ease-out hover:-translate-y-1 hover:border-emerald-300 hover:shadow-[0_14px_30px_rgba(20,83,45,0.12)]">
            <span aria-hidden="true" className="h-5 w-1 rounded-full bg-[#16a34a]" />
            <span className="text-sm font-bold text-[#14532d]">Transporter Fleet</span>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-emerald-950/10 bg-[#f8faf8] px-4 py-4 shadow-[0_8px_24px_rgba(20,83,45,0.06)] transition duration-300 ease-out hover:-translate-y-1 hover:border-emerald-300 hover:shadow-[0_14px_30px_rgba(20,83,45,0.12)]">
            <span aria-hidden="true" className="h-5 w-1 rounded-full bg-[#16a34a]" />
            <span className="text-sm font-bold text-[#14532d]">Cold Storage</span>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-emerald-950/10 bg-[#f8faf8] px-4 py-4 shadow-[0_8px_24px_rgba(20,83,45,0.06)] transition duration-300 ease-out hover:-translate-y-1 hover:border-emerald-300 hover:shadow-[0_14px_30px_rgba(20,83,45,0.12)]">
            <span aria-hidden="true" className="h-5 w-1 rounded-full bg-[#16a34a]" />
            <span className="text-sm font-bold text-[#14532d]">Retailer Intake</span>
          </div>
        </div>
      </section>
    </main>
  );
}
