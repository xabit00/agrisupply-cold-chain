import { LoginForm } from "@/components/features/auth/login-form";
import { Sprout } from "lucide-react";

export default function LoginPage() {
  return (
    <main
      id="main-content"
      className="relative isolate flex min-h-[100dvh] items-center justify-center overflow-hidden bg-[#07140d] bg-[radial-gradient(circle_at_15%_10%,rgba(22,163,74,0.24),transparent_32%),linear-gradient(145deg,#07140d_0%,#0b2114_52%,#07110b_100%)] px-4 py-10 sm:px-6 lg:px-8"
    >
      <div className="relative w-full max-w-[500px] overflow-hidden rounded-2xl border border-emerald-950/10 bg-[#fbfdfb] p-6 shadow-[0_32px_90px_rgba(2,24,11,0.42)] before:absolute before:inset-x-0 before:top-0 before:h-1 before:bg-[#16a34a] sm:p-10">
        <div className="mb-8 border-b border-slate-200/80 pb-7 text-left">
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-[#16a34a] text-white shadow-[0_10px_24px_rgba(22,163,74,0.24)]">
            <Sprout className="h-6 w-6" strokeWidth={1.8} aria-hidden="true" />
          </div>
          <h1 className="text-[1.75rem] font-extrabold leading-tight tracking-[-0.035em] text-slate-950 sm:text-[2rem]">
            AgriSupply Portal
          </h1>
          <p className="mt-2 text-sm font-medium leading-6 text-slate-600">
            Pakistan&apos;s Smart Agricultural Logistics Platform
          </p>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
