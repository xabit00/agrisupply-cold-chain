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
  { role: "Farmer" as UserRole, name: "Elena Rostova", email: "farmer@agrisupply.com", badge: "bg-emerald-100 text-emerald-800" },
  { role: "Transporter" as UserRole, name: "Marcus Vance", email: "transporter@agrisupply.com", badge: "bg-sky-100 text-sky-800" },
  { role: "WarehouseAdmin" as UserRole, name: "Sarah Chen", email: "warehouse@agrisupply.com", badge: "bg-amber-100 text-amber-800" },
  { role: "Retailer" as UserRole, name: "David Kim", email: "retailer@agrisupply.com", badge: "bg-indigo-100 text-indigo-800" },
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
    defaultValues: { email: "farmer@agrisupply.com", password: "Pass123!" },
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
    <div className="space-y-6">
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Demo Persona Fast-Select (1-Click)
        </label>
        <div className="grid grid-cols-2 gap-2">
          {PRESETS.map((preset) => (
            <button
              type="button"
              key={preset.role}
              onClick={() => handleSelectPreset(preset)}
              className={`flex flex-col items-start rounded-lg border p-2 text-left transition-all ${
                selectedRole === preset.role
                  ? "border-emerald-600 bg-emerald-50/70 shadow-sm ring-1 ring-emerald-500"
                  : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              <div className="flex w-full items-center justify-between">
                <span className="text-xs font-bold text-slate-900">{preset.role}</span>
                <span className={`rounded border px-1 py-0.2 text-[10px] font-medium ${preset.badge}`}>
                  {preset.role.slice(0, 4)}
                </span>
              </div>
              <span className="mt-1 text-xs text-slate-600">{preset.name}</span>
              <span className="text-[11px] text-slate-400 truncate w-full">{preset.email}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-slate-200" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-2 text-slate-400">Or enter credentials</span>
        </div>
      </div>

      {authError && (
        <div className="rounded-md border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive">
          <strong>Authentication Error:</strong> {authError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-700">Email Address</label>
          <Input type="email" placeholder="name@agrisupply.com" {...register("email")} disabled={isLoading} />
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-700">Password</label>
            <span className="text-[11px] text-slate-400">Default: Pass123!</span>
          </div>
          <Input type="password" placeholder="••••••••" {...register("password")} disabled={isLoading} />
          {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
        </div>

        <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white" disabled={isLoading}>
          {isLoading ? "Verifying Credentials..." : `Sign In as ${selectedRole}`}
        </Button>
      </form>
    </div>
  );
}
