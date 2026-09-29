import { LoginForm } from "@/components/features/auth/login-form";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-4 bg-slate-50">
      <div className="w-full max-w-md rounded-xl border bg-white p-6 shadow-sm">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 font-bold">
            🌱
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            AgriSupply Portal
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Pakistan&apos;s Smart Agricultural Logistics Platform
          </p>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
