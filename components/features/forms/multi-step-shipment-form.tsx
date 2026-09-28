"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { shipmentSchema, ShipmentFormData } from "@/lib/validators/shipment.schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function MultiStepShipmentForm({ onSuccess }: { onSuccess?: () => void }) {
  const [step, setStep] = useState<number>(1);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ShipmentFormData>({
    resolver: zodResolver(shipmentSchema),
    defaultValues: {
      category: "Fruits",
      quantityKg: 500,
      optimalTempMin: 2,
      optimalTempMax: 6,
      optimalHumidityMin: 70,
      optimalHumidityMax: 90,
    },
  });

  const onSubmit = (data: ShipmentFormData) => {
    onSuccess?.();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="flex gap-2 mb-4">
        <span className={`px-2 py-1 text-xs rounded ${step === 1 ? 'bg-emerald-600 text-white' : 'bg-slate-100'}`}>1. Produce</span>
        <span className={`px-2 py-1 text-xs rounded ${step === 2 ? 'bg-emerald-600 text-white' : 'bg-slate-100'}`}>2. Thresholds</span>
        <span className={`px-2 py-1 text-xs rounded ${step === 3 ? 'bg-emerald-600 text-white' : 'bg-slate-100'}`}>3. Routing</span>
      </div>

      {step === 1 && (
        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold">Produce Name</label>
            <Input {...register("produceName")} placeholder="e.g. Organic Avocados" />
            {errors.produceName && <p className="text-xs text-destructive">{errors.produceName.message}</p>}
          </div>
          <div>
            <label className="text-xs font-semibold">Quantity (Kg)</label>
            <Input type="number" {...register("quantityKg", { valueAsNumber: true })} />
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold">Min Temp (°C)</label>
            <Input type="number" {...register("optimalTempMin", { valueAsNumber: true })} />
          </div>
          <div>
            <label className="text-xs font-semibold">Max Temp (°C)</label>
            <Input type="number" {...register("optimalTempMax", { valueAsNumber: true })} />
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold">Origin Address</label>
            <Input {...register("originAddress")} placeholder="Farm pickup location" />
          </div>
          <div>
            <label className="text-xs font-semibold">Destination Address</label>
            <Input {...register("destinationAddress")} placeholder="Warehouse / Retail location" />
          </div>
        </div>
      )}

      <div className="flex justify-between pt-4">
        {step > 1 && (
          <Button type="button" variant="outline" onClick={() => setStep(step - 1)}>
            Back
          </Button>
        )}
        {step < 3 ? (
          <Button type="button" onClick={() => setStep(step + 1)}>
            Next
          </Button>
        ) : (
          <Button type="submit">Submit Shipment</Button>
        )}
      </div>
    </form>
  );
}
