"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth.store";
import { ROLE_DEFAULT_ROUTES } from "@/lib/constants/roles";
import { UserRole } from "@/lib/types";

export function LoginForm() {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);
  const [role, setRole] = useState<UserRole>("Farmer");
  const [email, setEmail] = useState("farmer@agrisupply.com");
  const [password, setPassword] = useState("password123");
  const [error, setError] = useState<string | null>(null);

  const handleRoleSelect = (selectedRole: UserRole) => {
    setRole(selectedRole);
    setEmail(`${selectedRole.toLowerCase()}@agrisupply.com`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please enter valid credentials");
      return;
    }

    // Scaffold session
    setSession({
      user: {
        id: `usr_${Date.now()}`,
        name: `${role} Demo User`,
        email,
        role,
        organizationId: "org_agri_01",
        createdAt: new Date().toISOString(),
      },
      token: `mock_jwt_token_${role.toLowerCase()}`,
    });

    router.push(ROLE_DEFAULT_ROUTES[role]);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded bg-destructive/10 p-2 text-xs text-destructive">
          {error}
        </div>
      )}

      <div className="space-y-1">
        <label className="text-xs font-semibold text-slate-700">Quick Switch Persona</label>
        <div className="grid grid-cols-2 gap-2">
          {(["Farmer", "Transporter", "WarehouseAdmin", "Retailer"] as UserRole[]).map(
            (r) => (
              <button
                type="button"
                key={r}
                onClick={() => handleRoleSelect(r)}
                className={`rounded border px-2 py-1.5 text-xs font-medium transition ${
                  role === r
                    ? "border-emerald-600 bg-emerald-50 text-emerald-800"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                {r}
              </button>
            )
          )}
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-slate-700">Email Address</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded border px-3 py-1.5 text-sm"
          required
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-slate-700">Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded border px-3 py-1.5 text-sm"
          required
        />
      </div>

      <button
        type="submit"
        className="w-full rounded bg-emerald-600 py-2 text-sm font-semibold text-white hover:bg-emerald-500"
      >
        Sign In as {role}
      </button>
    </form>
  );
}
