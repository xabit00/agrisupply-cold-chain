import { LoginForm } from "@/components/features/auth/login-form";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-4 bg-slate-50">
      <div className="w-full max-w-md rounded-xl border bg-white p-6 shadow-sm">
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Cold-Chain Logistics Portal
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Select a demo role or login with credentials
          </p>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
