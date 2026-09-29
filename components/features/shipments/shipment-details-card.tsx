"use client";

import React from "react";
import { Shipment } from "@/lib/types";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatTemperature, formatHumidity, formatDate } from "@/lib/utils/formatters";
import { X, Thermometer, Droplets, MapPin, ShieldCheck, AlertTriangle, Trash2 } from "lucide-react";
import { useDeleteShipmentMutation } from "@/lib/hooks/use-shipment-mutations";
import { Button } from "@/components/ui/button";

interface ShipmentDetailsCardProps {
  shipment: Shipment | null;
  onClose: () => void;
}

export function ShipmentDetailsCard({ shipment, onClose }: ShipmentDetailsCardProps) {
  const [confirmDelete, setConfirmDelete] = React.useState(false);
  const deleteShipment = useDeleteShipmentMutation();

  React.useEffect(() => setConfirmDelete(false), [shipment?.id]);

  if (!shipment) return null;

  const transportLabel =
    shipment.transporterId ??
    (shipment.compliance?.requiresTransport === false ? "Farm pickup" : "Not assigned");

  return (
    <div role="presentation" className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-3 backdrop-blur-sm animate-in fade-in-50 sm:items-center sm:p-4">
      <section role="dialog" aria-modal="true" aria-label="Shipment inspector" className="relative max-h-[calc(100dvh-1.5rem)] w-full max-w-xl overflow-y-auto rounded-xl border border-slate-200 bg-white p-4 shadow-xl sm:max-h-[calc(100dvh-2rem)] sm:p-6">
        <div className="flex items-center justify-between border-b pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-bold text-emerald-800">
                {shipment.trackingNumber}
              </span>
              <StatusBadge status={shipment.status} />
            </div>
            <p className="text-xs text-slate-500">ID: {shipment.id} · Registered {formatDate(shipment.createdAt)}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 space-y-4 text-xs">
          {/* Produce Specs */}
          <div className="rounded-lg border border-slate-100 bg-slate-50/70 p-3.5 space-y-2">
            <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
              Produce Specification
            </h4>
            <div className="grid grid-cols-1 gap-3 text-slate-600 sm:grid-cols-2">
              <div>
                <span className="text-slate-400 block">Item Name:</span>
                <span className="font-semibold text-slate-900">{shipment.produce.name}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Category & Batch:</span>
                <span className="font-semibold text-slate-900">{shipment.produce.category} · {shipment.produce.quantityKg.toLocaleString()} kg</span>
              </div>
            </div>
          </div>

          {/* Cold-Chain Thresholds */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-emerald-100 bg-emerald-50/50 p-3">
              <div className="flex items-center gap-1.5 text-emerald-800 font-semibold mb-1">
                <Thermometer className="h-4 w-4" />
                <span>Target Temperature</span>
              </div>
              <p className="text-base font-bold text-slate-900">
                {formatTemperature(shipment.produce.optimalTempMin)} to {formatTemperature(shipment.produce.optimalTempMax)}
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">Strict SLA breach trigger threshold</p>
            </div>

            <div className="rounded-lg border border-sky-100 bg-sky-50/50 p-3">
              <div className="flex items-center gap-1.5 text-sky-800 font-semibold mb-1">
                <Droplets className="h-4 w-4" />
                <span>Target Humidity</span>
              </div>
              <p className="text-base font-bold text-slate-900">
                {formatHumidity(shipment.produce.optimalHumidityMin)} to {formatHumidity(shipment.produce.optimalHumidityMax)}
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">Moisture preservation envelope</p>
            </div>
          </div>

          {/* Route Checkpoints */}
          <div className="rounded-lg border border-slate-100 p-3.5 space-y-3">
            <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
              Route & Chain of Custody
            </h4>
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-slate-800">Origin: {shipment.origin.name}</span>
                  <p className="text-slate-500 text-[11px]">{shipment.origin.address}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-sky-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-slate-800">Destination: {shipment.destination.name}</span>
                  <p className="text-slate-500 text-[11px]">{shipment.destination.address}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Registration metadata captured by the M4 form */}
          {(shipment.storageMode || shipment.containers?.length || shipment.compliance || shipment.notes) && (
            <div className="rounded-lg border border-slate-100 p-3.5 space-y-2">
              <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                Registration & Compliance
              </h4>
              <div className="grid grid-cols-1 gap-x-3 gap-y-1.5 text-slate-600 sm:grid-cols-2">
                <div>
                  <span className="block text-slate-400">Storage mode</span>
                  <span className="font-semibold text-slate-900">
                    {shipment.storageMode ?? "Not specified"}
                  </span>
                </div>
                <div>
                  <span className="block text-slate-400">Handover route</span>
                  <span className="font-semibold text-slate-900">
                    {shipment.compliance?.destinationType ?? "Not specified"}
                  </span>
                </div>
                <div>
                  <span className="block text-slate-400">Transport assigned</span>
                  <span className="font-semibold text-slate-900">{transportLabel}</span>
                </div>
                <div>
                  <span className="block text-slate-400">Tamper seal</span>
                  <span className="font-semibold text-slate-900">
                    {shipment.compliance?.tamperSealEnabled
                      ? shipment.compliance.sealId ?? "Sealed (no reference)"
                      : "Not sealed"}
                  </span>
                </div>
              </div>

              {shipment.containers && shipment.containers.length > 0 && (
                <div className="pt-1">
                  <span className="block text-slate-400">Container split</span>
                  <ul className="mt-1 space-y-0.5">
                    {shipment.containers.map((container) => (
                      <li key={container.id} className="flex justify-between gap-3">
                        <span className="text-slate-700">{container.label}</span>
                        <span className="font-mono text-[11px] text-slate-600">
                          {container.quantityKg.toLocaleString()} kg
                          {container.sealId ? ` · ${container.sealId}` : ""}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {shipment.notes && (
                <div className="pt-1">
                  <span className="block text-slate-400">Handling notes</span>
                  <p className="text-slate-700">{shipment.notes}</p>
                </div>
              )}
            </div>
          )}

          {/* Cold-chain evidence captured by the M4 photo step */}
          {shipment.photos && shipment.photos.length > 0 && (
            <div className="rounded-lg border border-slate-100 p-3.5">
              <h4 className="mb-2 font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                Cold-Chain Evidence ({shipment.photos.length})
              </h4>
              <ul className="grid grid-cols-3 gap-2">
                {shipment.photos.map((photo) => (
                  <li
                    key={photo.id}
                    className="overflow-hidden rounded-lg border border-slate-200"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photo.dataUrl}
                      alt={photo.label}
                      className="h-20 w-full object-cover"
                    />
                    <span className="block truncate px-1.5 py-1 text-[10px] text-slate-500">
                      {photo.label}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Alert Status */}
          <div className="flex items-center justify-between rounded-lg border p-3 bg-slate-50">
            <div className="flex items-center gap-2">
              {shipment.temperatureAlert ? (
                <AlertTriangle className="h-4 w-4 text-rose-600" />
              ) : (
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
              )}
              <span className="font-medium text-slate-800">
                {shipment.temperatureAlert
                  ? "Temperature breach recorded! Cold-chain warranty flagged."
                  : "Cold-chain telemetry compliant. No breaches detected."}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
          {shipment.status === "Draft" ? (
            confirmDelete ? (
              <div className="flex flex-wrap items-center gap-2 text-xs text-rose-700">
                <span className="font-semibold">Delete this draft permanently?</span>
                <Button type="button" variant="outline" size="sm" onClick={() => setConfirmDelete(false)} disabled={deleteShipment.isPending}>Cancel</Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  disabled={deleteShipment.isPending}
                  onClick={() => deleteShipment.mutate({ id: shipment.id, trackingNumber: shipment.trackingNumber }, { onSuccess: onClose })}
                >
                  {deleteShipment.isPending ? "Deleting..." : "Confirm delete"}
                </Button>
              </div>
            ) : (
              <Button type="button" variant="outline" size="sm" className="text-rose-700 hover:bg-rose-50" onClick={() => setConfirmDelete(true)}>
                <Trash2 className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" /> Delete draft
              </Button>
            )
          ) : <span />}
          <Button type="button" variant="outline" size="sm" onClick={onClose}>Close inspector</Button>
        </div>
      </section>
    </div>
  );
}
