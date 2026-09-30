"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, LoginFormData } from "@/lib/validators/auth.schema";
import { useAuthStore } from "@/stores/auth.store";
import { authService } from "@/lib/services/auth.service";
import { ROLE_DEFAULT_ROUTES } from "@/lib/constants/roles";
import { UserRole } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const PRESETS = [
  { role: "Farmer" as UserRole, name: "Muhammad Yousaf", email: "farmer@agrisupply.pk", badge: "border-emerald-200 bg-emerald-50 text-emerald-700" },
  { role: "Transporter" as UserRole, name: "Asif Javed", email: "transporter@agrisupply.pk", badge: "border-emerald-200 bg-emerald-50 text-emerald-700" },
  { role: "WarehouseAdmin" as UserRole, name: "Sara Ahmed", email: "warehouse@agrisupply.pk", badge: "border-emerald-200 bg-emerald-50 text-emerald-700" },
  { role: "Retailer" as UserRole, name: "Nadia Hussain", email: "retailer@agrisupply.pk", badge: "border-emerald-200 bg-emerald-50 text-emerald-700" },
];

export function LoginForm() {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);
  const [selectedRole, setSelectedRole] = useState<UserRole>("Farmer");
  const [authError, setAuthError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "farmer@agrisupply.pk", password: "Pass123!" },
  });

  const handleSelectPreset = (p: typeof PRESETS[0]) => {
    setSelectedRole(p.role);
    setValue("email", p.email, { shouldValidate: true });
    setValue("password", "Pass123!", { shouldValidate: true });
    setAuthError(null);
  };

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setAuthError(null);
    try {
      const response = await authService.login(data);
      if (!response.success || !response.data) {
        setAuthError(response.error || "Login failed. Check credentials.");
        return;
      }
      setSession(response.data);
      router.push(ROLE_DEFAULT_ROUTES[response.data.user.role]);
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : "Authentication error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-7">
      <div className="space-y-3">
        <label className="text-xs font-bold uppercase tracking-[0.12em] text-slate-600">
          Demo Persona Fast-Select (1-Click)
        </label>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {PRESETS.map((preset) => (
            <button
              type="button"
              key={preset.role}
              onClick={() => handleSelectPreset(preset)}
              className={`flex min-h-[90px] flex-col items-start rounded-xl border px-3.5 py-3 text-left transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16a34a] focus-visible:ring-offset-2 active:translate-y-px ${
                selectedRole === preset.role
                  ? "border-[#16a34a] bg-emerald-50 shadow-[0_8px_20px_rgba(22,163,74,0.10)] ring-1 ring-[#16a34a]"
                  : "border-slate-200 bg-slate-50/70 hover:border-emerald-300 hover:bg-emerald-50/40"
              }`}
            >
              <div className="flex w-full items-center justify-between">
                <span className="text-xs font-bold tracking-[-0.01em] text-slate-950">{preset.role}</span>
                <span className={`rounded-md border px-1.5 py-0.5 text-[10px] font-bold ${preset.badge}`}>
                  {preset.role.slice(0, 4)}
                </span>
              </div>
              <span className="mt-2 text-xs font-medium text-slate-700">{preset.name}</span>
              <span className="mt-0.5 w-full truncate text-[11px] text-slate-500">{preset.email}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="relative py-0.5">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-slate-200" />
        </div>
        <div className="relative flex justify-center text-[11px] font-semibold uppercase tracking-[0.1em]">
          <span className="bg-[#fbfdfb] px-3 text-slate-500">Or enter credentials</span>
        </div>
      </div>

      {authError && (
        <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-3.5 text-xs font-medium leading-5 text-destructive">
          <strong>Authentication Error:</strong> {authError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-800">Email Address</label>
          <Input
            type="email"
            placeholder="name@agrisupply.pk"
            className="h-12 rounded-xl border-slate-300 bg-white px-4 shadow-none placeholder:text-slate-400 hover:border-emerald-400 focus-visible:border-[#16a34a] focus-visible:ring-[#16a34a]/20"
            {...register("email")}
            disabled={isLoading}
          />
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-slate-800">Password</label>
            <span className="text-[11px] font-medium text-slate-500">Default: Pass123!</span>
          </div>
          <Input
            type="password"
            placeholder="••••••••"
            className="h-12 rounded-xl border-slate-300 bg-white px-4 shadow-none placeholder:text-slate-400 hover:border-emerald-400 focus-visible:border-[#16a34a] focus-visible:ring-[#16a34a]/20"
            {...register("password")}
            disabled={isLoading}
          />
          {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
        </div>

        <Button
          type="submit"
          className="h-12 w-full rounded-xl bg-[#16a34a] text-sm font-bold text-white shadow-[0_10px_24px_rgba(22,163,74,0.22)] transition duration-200 hover:bg-emerald-700 hover:shadow-[0_12px_28px_rgba(22,163,74,0.28)] active:translate-y-px"
          disabled={isLoading}
        >
          {isLoading ? "Verifying Credentials..." : `Sign In as ${selectedRole}`}
        </Button>
      </form>
    </div>
  );
}
