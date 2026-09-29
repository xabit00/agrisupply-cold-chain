"use client";

import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  GripVertical,
  Images,
  MapPin,
  Scale,
  ShieldAlert,
  Snowflake,
  Thermometer,
} from "lucide-react";
import { Shipment } from "@/lib/types";
import { cn } from "@/lib/utils/cn";

const CATEGORY_ACCENT: Record<string, string> = {
  Dairy: "bg-sky-100 text-sky-700",
  Fruits: "bg-amber-100 text-amber-700",
  Vegetables: "bg-emerald-100 text-emerald-700",
  Meat: "bg-rose-100 text-rose-700",
  Seafood: "bg-cyan-100 text-cyan-700",
  Flowers: "bg-fuchsia-100 text-fuchsia-700",
};

interface KanbanCardProps {
  shipment: Shipment;
  onSelect: (shipment: Shipment) => void;
}

export function KanbanCard({ shipment, onSelect }: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: shipment.id });

  const alerting =
    shipment.temperatureAlert || shipment.humidityAlert || shipment.tamperAlert;

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={cn(
        "group relative rounded-md border border-slate-200 bg-white p-3 shadow-sm",
        "cursor-grab select-none hover:border-emerald-300 hover:shadow-md",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500",
        isDragging && "z-50 rotate-2 opacity-40 shadow-xl"
      )}
      {...attributes}
      {...listeners}
    >
      <div className="absolute right-2 top-2 text-slate-300 opacity-0 transition-opacity group-hover:opacity-100">
        <GripVertical className="h-3.5 w-3.5" aria-hidden="true" />
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <span
          className={cn(
            "rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide",
            CATEGORY_ACCENT[shipment.produce.category] ?? "bg-slate-100 text-slate-600"
          )}
        >
          {shipment.produce.category}
        </span>
        {alerting && (
          <span className="inline-flex items-center gap-1 rounded bg-rose-50 px-1.5 py-0.5 text-[10px] font-bold text-rose-600">
            <ShieldAlert className="h-2.5 w-2.5" aria-hidden="true" />
            Alert
          </span>
        )}
      </div>

      <p className="mt-1.5 truncate text-xs font-bold text-slate-900">
        {shipment.produce.name}
      </p>
      <p className="mt-0.5 font-mono text-[10px] text-slate-500">
        {shipment.trackingNumber}
      </p>

      <div className="mt-2 space-y-1 text-[10px] text-slate-500">
        <p className="flex items-center gap-1.5 truncate">
          <Scale className="h-3 w-3 shrink-0" aria-hidden="true" />
          {shipment.produce.quantityKg.toLocaleString()} kg
        </p>
        <p className="flex items-center gap-1.5 truncate">
          <Thermometer className="h-3 w-3 shrink-0" aria-hidden="true" />
          {shipment.storageMode ?? "Ambient"} ·{" "}
          {shipment.produce.optimalTempMin}–{shipment.produce.optimalTempMax}°C
        </p>
        <p className="flex items-center gap-1.5 truncate">
          <MapPin className="h-3 w-3 shrink-0" aria-hidden="true" />
          {shipment.destination.name}
        </p>
      </div>

      <div className="mt-2.5 flex items-center justify-between border-t border-slate-100 pt-2">
        <div className="flex items-center gap-2 text-[10px] text-slate-400">
          <span className="inline-flex items-center gap-1">
            <Images className="h-3 w-3" aria-hidden="true" />
            {shipment.photos?.length ?? 0}
          </span>
          <span className="inline-flex items-center gap-1">
            <Snowflake className="h-3 w-3" aria-hidden="true" />
            {(shipment.containers?.length ?? 0) || "—"}
          </span>
        </div>
        <button
          type="button"
          onClick={() => onSelect(shipment)}
          className="rounded border border-slate-200 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 transition hover:bg-slate-50"
        >
          Inspect
        </button>
      </div>
    </div>
  );
}
