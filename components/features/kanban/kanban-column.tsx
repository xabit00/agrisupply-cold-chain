"use client";

import React from "react";
import { Shipment } from "@/lib/types";

export function KanbanColumn({
  title,
  shipments,
}: {
  title: string;
  shipments: Shipment[];
}) {
  return (
    <div className="flex-1 rounded-lg border bg-slate-100/70 p-3">
      <div className="flex items-center justify-between pb-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
          {title}
        </h4>
        <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-semibold text-slate-700">
          {shipments.length}
        </span>
      </div>
      <div className="space-y-2">
        {shipments.map((s) => (
          <div key={s.id} className="rounded border bg-white p-3 shadow-sm text-xs">
            <p className="font-semibold text-slate-800">{s.trackingNumber}</p>
            <p className="text-slate-500">{s.produce.name}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
