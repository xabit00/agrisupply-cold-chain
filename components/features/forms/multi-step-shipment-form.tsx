"use client";

import * as React from "react";
import { FieldPath, useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ChevronLeft,
  ChevronRight,
  Droplets,
  Loader2,
  Plus,
  Thermometer,
  Trash2,
  WifiOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils/cn";
import { formatHumidity, formatTemperature } from "@/lib/utils/formatters";
import { FormField } from "./form-field";
import { PhotoCapture } from "./photo-capture";
import { shipmentSchema, ShipmentFormData } from "@/lib/validators/shipment.schema";
import {
  DESTINATION_TYPES,
  MAX_SHIPMENT_PHOTOS,
  PRODUCE_CATEGORIES,
  PRODUCE_CATEGORY_PRESETS,
  STORAGE_MODES,
  requiresPhotoEvidence,
} from "@/lib/constants/produce-presets";
import { MOCK_USERS, getOrganizationDisplayName } from "@/lib/constants/roles";
import { useAuth } from "@/lib/hooks/use-auth";
import { useCreateShipmentMutation } from "@/lib/hooks/use-shipment-mutations";
import { useOfflineStore } from "@/stores/offline.store";
import {
  DestinationType,
  ProduceCategory,
  ShipmentCreateRequest,
  StorageMode,
  User,
} from "@/lib/types";

const STAFF: User[] = Object.values(MOCK_USERS).map((account) => account.user);
const TRANSPORTERS = STAFF.filter((member) => member.role === "Transporter");
const WAREHOUSES = STAFF.filter((member) => member.role === "WarehouseAdmin");
const RETAILERS = STAFF.filter((member) => member.role === "Retailer");

const ORGANIZATION_LABELS: Record<string, string> = {
  org_arctichaul_fleet: "AgriSupply Fleet",
};

function organizationLabel(organizationId: string): string {
  return ORGANIZATION_LABELS[organizationId] ?? getOrganizationDisplayName(organizationId);
}

const DESTINATION_LABELS: Record<DestinationType, string> = {
  Warehouse: "Cold-storage warehouse",
  RetailOutlet: "Retail outlet",
  DirectConsumer: "Direct to consumer",
};

const STORAGE_MODE_LABELS: Record<StorageMode, string> = {
  Ambient: "Ambient (shelf-stable)",
  Refrigerated: "Refrigerated",
  Frozen: "Frozen",
};

const FIELD_LABELS: Record<string, string> = {
  "produce.name": "Produce name",
  "produce.category": "Category",
  "produce.quantityKg": "Batch weight",
  "produce.optimalTempMin": "Minimum temperature",
  "produce.optimalTempMax": "Temperature window",
  "produce.optimalHumidityMin": "Minimum humidity",
  "produce.optimalHumidityMax": "Humidity window",
  photos: "Cold-chain evidence",
  notes: "Handling notes",
  warehouseId: "Receiving warehouse",
  retailerId: "Receiving retailer",
  transporterId: "Assigned transporter",
  sealId: "Seal reference",
  containers: "Container split",
  "origin.name": "Origin name",
  "origin.address": "Origin address",
  "destination.name": "Destination name",
  "destination.address": "Destination address",
};

interface StepConfig {
  id: number;
  title: string;
  fields: FieldPath<ShipmentFormData>[];
}

const STEPS: StepConfig[] = [
  {
    id: 1,
    title: "Produce",
    fields: ["produce.name", "produce.category", "produce.quantityKg", "notes"],
  },
  {
    id: 2,
    title: "Cold-Chain",
    fields: [
      "storageMode",
      "produce.optimalTempMin",
      "produce.optimalTempMax",
      "produce.optimalHumidityMin",
      "produce.optimalHumidityMax",
      "photos",
    ],
  },
  {
    id: 3,
    title: "Routing",
    fields: [
      "destinationType",
      "warehouseId",
      "retailerId",
      "requiresTransport",
      "transporterId",
      "origin.name",
      "origin.address",
      "destination.name",
      "destination.address",
      "splitsIntoContainers",
      "containers",
      "tamperSealEnabled",
      "sealId",
    ],
  },
];

const DEFAULT_CATEGORY: ProduceCategory = "Dairy";

function buildDefaultValues(farmerId: string): ShipmentFormData {
  const preset = PRODUCE_CATEGORY_PRESETS[DEFAULT_CATEGORY];

  return {
    farmerId,
    destinationType: "Warehouse",
    requiresTransport: true,
    transporterId: undefined,
    warehouseId: undefined,
    retailerId: undefined,
    storageMode: preset.storageMode,
    tamperSealEnabled: false,
    sealId: undefined,
    splitsIntoContainers: false,
    containers: [],
    photos: [],
    notes: "",
    produce: {
      name: "",
      category: DEFAULT_CATEGORY,
      quantityKg: 500,
      optimalTempMin: preset.tempMin,
      optimalTempMax: preset.tempMax,
      optimalHumidityMin: preset.humidityMin,
      optimalHumidityMax: preset.humidityMax,
    },
    origin: {
      name: "Sargodha Farm A",
      address: "University Road, Sargodha, Punjab",
    },
    destination: {
      name: "Lahore Cold Storage",
      address: "Kot Lakhpat, Lahore, Punjab",
    },
  };
}

/** Flattens react-hook-form's nested error tree into reviewable rows. */
function flattenErrors(node: unknown, prefix = ""): { path: string; message: string }[] {
  if (!node || typeof node !== "object") return [];

  const record = node as Record<string, unknown>;
  if (typeof record.message === "string") {
    return [{ path: prefix, message: record.message }];
  }

  return Object.entries(record).flatMap(([key, value]) => {
    if (key === "ref" || key === "type" || key === "types") return [];
    return flattenErrors(value, prefix ? `${prefix}.${key}` : key);
  });
}

function ToggleField({
  id,
  label,
  hint,
  checked,
  onToggle,
  disabled,
}: {
  id: string;
  label: string;
  hint?: string;
  checked: boolean;
  onToggle: (next: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label
      htmlFor={id}
      className={cn(
        "flex cursor-pointer items-start gap-2.5 rounded-lg border border-slate-200 bg-white p-3 transition-colors hover:bg-slate-50",
        disabled && "cursor-not-allowed opacity-60"
      )}
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onToggle(event.target.checked)}
        className="mt-0.5 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
      />
      <span className="space-y-0.5">
        <span className="block text-xs font-semibold text-slate-700">{label}</span>
        {hint && <span className="block text-[11px] text-slate-400">{hint}</span>}
      </span>
    </label>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 py-1.5">
      <span className="text-[11px] uppercase tracking-wide text-slate-400">{label}</span>
      <span className="text-right text-xs font-medium text-slate-800">{value}</span>
    </div>
  );
}

export function MultiStepShipmentForm({
  onSuccess,
  onPendingChange,
}: {
  onSuccess?: () => void;
  onPendingChange?: (pending: boolean) => void;
}) {
  const { user } = useAuth();
  const isOnline = useOfflineStore((state) => state.isOnline);
  const createShipment = useCreateShipmentMutation();
  const [step, setStep] = React.useState(1);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    trigger,
    reset,
    control,
    formState: { errors },
  } = useForm<ShipmentFormData>({
    resolver: zodResolver(shipmentSchema),
    mode: "onBlur",
    defaultValues: buildDefaultValues(user?.id ?? ""),
  });

  const {
    fields: containerFields,
    append: appendContainer,
    remove: removeContainer,
  } = useFieldArray({ control, name: "containers" });

  React.useEffect(() => {
    if (user?.id) setValue("farmerId", user.id);
  }, [user?.id, setValue]);

  React.useEffect(() => {
    onPendingChange?.(createShipment.isPending);
  }, [createShipment.isPending, onPendingChange]);

  const storageMode = watch("storageMode");
  const category = watch("produce.category");
  const destinationType = watch("destinationType");
  const requiresTransport = watch("requiresTransport");
  const splitsIntoContainers = watch("splitsIntoContainers");
  const tamperSealEnabled = watch("tamperSealEnabled");
  const produceName = watch("produce.name");
  const quantityKg = watch("produce.quantityKg");
  const notes = watch("notes");
  const photos = watch("photos");
  const containers = watch("containers");
  const tempMin = watch("produce.optimalTempMin");
  const tempMax = watch("produce.optimalTempMax");
  const humidityMin = watch("produce.optimalHumidityMin");
  const humidityMax = watch("produce.optimalHumidityMax");
  const originName = watch("origin.name");
  const originAddress = watch("origin.address");
  const destinationName = watch("destination.name");
  const destinationAddress = watch("destination.address");
  const sealId = watch("sealId");
  const transporterId = watch("transporterId");
  const warehouseId = watch("warehouseId");
  const retailerId = watch("retailerId");

  const isColdChain = storageMode !== "Ambient";
  const evidenceRequired = requiresPhotoEvidence(category);
  const preset = PRODUCE_CATEGORY_PRESETS[category];
  const containerTotal = (containers ?? []).reduce(
    (sum, container) => sum + (Number(container.quantityKg) || 0),
    0
  );
  const unallocatedKg = Number(quantityKg || 0) - containerTotal;
  const pending = createShipment.isPending;

  const applyCategoryPreset = (nextCategory: ProduceCategory) => {
    const next = PRODUCE_CATEGORY_PRESETS[nextCategory];
    setValue("produce.category", nextCategory, { shouldValidate: true });
    setValue("storageMode", next.storageMode);
    setValue("produce.optimalTempMin", next.tempMin);
    setValue("produce.optimalTempMax", next.tempMax);
    setValue("produce.optimalHumidityMin", next.humidityMin);
    setValue("produce.optimalHumidityMax", next.humidityMax);
  };

  const handleStorageModeChange = (mode: StorageMode) => {
    setValue("storageMode", mode, { shouldValidate: true });

    if (mode === "Ambient") {
      setValue("produce.optimalTempMin", undefined);
      setValue("produce.optimalTempMax", undefined);
      setValue("produce.optimalHumidityMin", undefined);
      setValue("produce.optimalHumidityMax", undefined);
      return;
    }

    setValue("produce.optimalTempMin", preset.tempMin);
    setValue("produce.optimalTempMax", preset.tempMax);
    setValue("produce.optimalHumidityMin", preset.humidityMin);
    setValue("produce.optimalHumidityMax", preset.humidityMax);
  };

  const handleDestinationChange = (next: DestinationType) => {
    setValue("destinationType", next, { shouldValidate: true });
    if (next !== "Warehouse") setValue("warehouseId", undefined);
    if (next !== "RetailOutlet") setValue("retailerId", undefined);
  };

  const handleTransportToggle = (next: boolean) => {
    setValue("requiresTransport", next);
    if (!next) setValue("transporterId", undefined);
  };

  const handleSplitToggle = (enabled: boolean) => {
    setValue("splitsIntoContainers", enabled);

    if (!enabled) {
      setValue("containers", []);
      return;
    }

    const half = Number(quantityKg || 0) / 2;
    const stamp = Date.now();
    setValue("containers", [
      { id: `ctn_${stamp}_a`, label: "Reefer container A", quantityKg: half },
      { id: `ctn_${stamp}_b`, label: "Reefer container B", quantityKg: half },
    ]);
  };

  const handleSealToggle = (enabled: boolean) => {
    setValue("tamperSealEnabled", enabled);
    if (!enabled) setValue("sealId", undefined);
  };

  const goNext = async () => {
    const valid = await trigger(STEPS[step - 1].fields, { shouldFocus: true });
    if (valid) setStep((current) => Math.min(STEPS.length, current + 1));
  };

  const goBack = () => setStep((current) => Math.max(1, current - 1));

  const onSubmit = handleSubmit((values) => {
    const payload: ShipmentCreateRequest = {
      ...values,
      containers: values.splitsIntoContainers ? values.containers : [],
    };

    createShipment.mutate(payload, {
      onSuccess: () => {
        reset(buildDefaultValues(user?.id ?? ""));
        setStep(1);
        onSuccess?.();
      },
    });
  });

  const reviewIssues = step === STEPS.length ? flattenErrors(errors) : [];

  const renderStepOne = () => (
    <div className="space-y-4">
      <FormField
        id="produce-name"
        label="Produce name"
        required
        hint="e.g. Pasteurized Whole Milk"
        error={errors.produce?.name?.message}
      >
        <Input
          placeholder="What are you shipping?"
          {...register("produce.name")}
          disabled={pending}
        />
      </FormField>

      <div className="grid min-w-0 grid-cols-1 items-start gap-4 sm:grid-cols-2">
        <FormField
          id="produce-category"
          label="Category"
          required
          hint="Drives the cold-chain SLA"
          error={errors.produce?.category?.message}
        >
          <Select
            value={category}
            onChange={(event) =>
              applyCategoryPreset(event.target.value as ProduceCategory)
            }
            disabled={pending}
          >
            {PRODUCE_CATEGORIES.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </Select>
        </FormField>

        <FormField
          id="produce-quantity"
          label="Batch weight (kg)"
          required
          error={errors.produce?.quantityKg?.message}
        >
          <Input
            type="number"
            min={1}
            step={1}
            inputMode="decimal"
            {...register("produce.quantityKg", { valueAsNumber: true })}
            disabled={pending}
          />
        </FormField>
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-slate-50/70 px-3 py-2.5">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
          {category} SLA preset
        </span>
        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">
          <Thermometer className="h-3 w-3" aria-hidden="true" />
          {formatTemperature(preset.tempMin)} – {formatTemperature(preset.tempMax)}
        </span>
        <span className="inline-flex items-center gap-1 rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-[11px] font-semibold text-sky-800">
          <Droplets className="h-3 w-3" aria-hidden="true" />
          {formatHumidity(preset.humidityMin)} – {formatHumidity(preset.humidityMax)}
        </span>
        <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-medium text-slate-600">
          {STORAGE_MODE_LABELS[preset.storageMode]}
        </span>
        {evidenceRequired && (
          <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
            Photo evidence mandatory
          </span>
        )}
      </div>

      <FormField
        id="shipment-notes"
        label="Handling notes"
        hint="Optional · max 500 characters"
        error={errors.notes?.message}
      >
        <Input
          placeholder="Pre-cooled to 2°C before loading; handle pallets with care"
          {...register("notes")}
          disabled={pending}
        />
      </FormField>
    </div>
  );

  const renderStepTwo = () => (
    <div className="space-y-4">
      <FormField
        id="storage-mode"
        label="Storage mode"
        required
        hint="Ambient lots skip the temperature window"
        error={errors.storageMode?.message}
      >
        <Select
          value={storageMode}
          onChange={(event) =>
            handleStorageModeChange(event.target.value as StorageMode)
          }
          disabled={pending}
        >
          {STORAGE_MODES.map((mode) => (
            <option key={mode} value={mode}>
              {STORAGE_MODE_LABELS[mode]}
            </option>
          ))}
        </Select>
      </FormField>

      {isColdChain ? (
        <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-3.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-semibold text-slate-700">
              Cold-chain envelope
            </span>
            <button
              type="button"
              onClick={() =>
                handleStorageModeChange(storageMode === "Frozen" ? "Refrigerated" : "Frozen")
              }
              className="text-[11px] font-medium text-emerald-700 underline-offset-2 hover:underline"
              disabled={pending}
            >
              Switch to {storageMode === "Frozen" ? "Refrigerated" : "Frozen"}
            </button>
          </div>

          <div className="grid min-w-0 grid-cols-1 items-start gap-4 sm:grid-cols-2">
            <FormField
              id="temp-min"
              label="Min temp (°C)"
              required
              error={errors.produce?.optimalTempMin?.message}
            >
              <Input
                type="number"
                step={0.5}
                inputMode="decimal"
                {...register("produce.optimalTempMin", { valueAsNumber: true })}
                disabled={pending}
              />
            </FormField>
            <FormField
              id="temp-max"
              label="Max temp (°C)"
              required
              error={errors.produce?.optimalTempMax?.message}
            >
              <Input
                type="number"
                step={0.5}
                inputMode="decimal"
                {...register("produce.optimalTempMax", { valueAsNumber: true })}
                disabled={pending}
              />
            </FormField>
            <FormField
              id="humidity-min"
              label="Min humidity (%)"
              required
              error={errors.produce?.optimalHumidityMin?.message}
            >
              <Input
                type="number"
                step={1}
                inputMode="numeric"
                {...register("produce.optimalHumidityMin", { valueAsNumber: true })}
                disabled={pending}
              />
            </FormField>
            <FormField
              id="humidity-max"
              label="Max humidity (%)"
              required
              error={errors.produce?.optimalHumidityMax?.message}
            >
              <Input
                type="number"
                step={1}
                inputMode="numeric"
                {...register("produce.optimalHumidityMax", { valueAsNumber: true })}
                disabled={pending}
              />
            </FormField>
          </div>

          {tempMin !== undefined && tempMax !== undefined && (
            <p className="text-[11px] text-slate-500">
              Envelope: {formatTemperature(tempMin)} – {formatTemperature(tempMax)}
              {humidityMin !== undefined && humidityMax !== undefined
                ? ` · ${formatHumidity(humidityMin)} – ${formatHumidity(humidityMax)} RH`
                : ""}
            </p>
          )}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50/70 p-3.5">
          <p className="text-xs font-semibold text-slate-700">
            Ambient lot — no temperature window required
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500">
            The controlled-atmosphere fields are hidden. The API applies a 10–25°C /
            40–70% RH ambient envelope so this lot still reports SLA compliance.
          </p>
        </div>
      )}

      <div className="rounded-lg border border-slate-200 p-3.5">
        <PhotoCapture
          photos={photos}
          onChange={(next) => setValue("photos", next, { shouldValidate: true })}
          maxPhotos={MAX_SHIPMENT_PHOTOS}
          error={errors.photos?.message}
          disabled={pending}
        />
        <p className="mt-2 text-[11px] text-slate-500">
          {evidenceRequired
            ? `${category} lots require at least one photo for cold-chain evidence.`
            : "Optional for this category, but useful evidence if a temperature dispute arises."}
        </p>
      </div>
    </div>
  );

  const renderStepThree = () => (
    <div className="space-y-4">
      <div className="grid min-w-0 grid-cols-1 items-start gap-4 sm:grid-cols-2">
        <FormField
          id="destination-type"
          label="Destination type"
          required
          error={errors.destinationType?.message}
        >
          <Select
            value={destinationType}
            onChange={(event) =>
              handleDestinationChange(event.target.value as DestinationType)
            }
            disabled={pending}
          >
            {DESTINATION_TYPES.map((type) => (
              <option key={type} value={type}>
                {DESTINATION_LABELS[type]}
              </option>
            ))}
          </Select>
        </FormField>

        {destinationType === "Warehouse" && (
          <FormField
            id="warehouse-id"
            label="Receiving warehouse"
            required
            error={errors.warehouseId?.message}
          >
            <Select
              value={warehouseId ?? ""}
              onChange={(event) =>
                setValue("warehouseId", event.target.value || undefined, {
                  shouldValidate: true,
                })
              }
              disabled={pending}
            >
              <option value="">Select a cold-storage facility…</option>
              {WAREHOUSES.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name} · {organizationLabel(member.organizationId)}
                </option>
              ))}
            </Select>
          </FormField>
        )}

        {destinationType === "RetailOutlet" && (
          <FormField
            id="retailer-id"
            label="Receiving retailer"
            required
            error={errors.retailerId?.message}
          >
            <Select
              value={retailerId ?? ""}
              onChange={(event) =>
                setValue("retailerId", event.target.value || undefined, {
                  shouldValidate: true,
                })
              }
              disabled={pending}
            >
              <option value="">Select a retail outlet…</option>
              {RETAILERS.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name} · {organizationLabel(member.organizationId)}
                </option>
              ))}
            </Select>
          </FormField>
        )}
      </div>

      <div className="space-y-3">
        <ToggleField
          id="requires-transport"
          label="Refrigerated transport required"
          hint="Assigns a reefer fleet operator to this lot"
          checked={requiresTransport}
          onToggle={handleTransportToggle}
          disabled={pending}
        />

        {requiresTransport && (
          <FormField
            id="transporter-id"
            label="Assigned transporter"
            required
            error={errors.transporterId?.message}
          >
            <Select
              value={transporterId ?? ""}
              onChange={(event) =>
                setValue("transporterId", event.target.value || undefined, {
                  shouldValidate: true,
                })
              }
              disabled={pending}
            >
              <option value="">Select a reefer fleet…</option>
              {TRANSPORTERS.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name} · {organizationLabel(member.organizationId)}
                </option>
              ))}
            </Select>
          </FormField>
        )}
      </div>

      <div className="grid min-w-0 grid-cols-1 items-start gap-4 sm:grid-cols-2">
        <FormField
          id="origin-name"
          label="Origin name"
          required
          error={errors.origin?.name?.message}
        >
          <Input {...register("origin.name")} disabled={pending} />
        </FormField>
        <FormField
          id="destination-name"
          label="Destination name"
          required
          error={errors.destination?.name?.message}
        >
          <Input {...register("destination.name")} disabled={pending} />
        </FormField>
        <FormField
          id="origin-address"
          label="Origin address"
          required
          error={errors.origin?.address?.message}
        >
          <Input {...register("origin.address")} disabled={pending} />
        </FormField>
        <FormField
          id="destination-address"
          label="Destination address"
          required
          error={errors.destination?.address?.message}
        >
          <Input {...register("destination.address")} disabled={pending} />
        </FormField>
      </div>

      {/* Conditional: batch split across sealed transport units */}
      <div className="space-y-3">
        <ToggleField
          id="splits-containers"
          label="Split batch across multiple containers"
          hint="Required when a lot cannot travel in a single reefer unit"
          checked={splitsIntoContainers}
          onToggle={handleSplitToggle}
          disabled={pending}
        />

        {splitsIntoContainers && (
          <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50/60 p-3.5">
            {containerFields.map((field, index) => (
              <div
                key={field.id}
                className="grid min-w-0 grid-cols-1 items-start gap-3 sm:grid-cols-[minmax(0,1.4fr)_repeat(2,minmax(0,1fr))_auto] sm:items-end"
              >
                <FormField
                  id={`container-label-${index}`}
                  label={`Container ${index + 1} label`}
                  required
                  error={errors.containers?.[index]?.label?.message}
                >
                  <Input
                    {...register(`containers.${index}.label`)}
                    disabled={pending}
                  />
                </FormField>

                <FormField
                  id={`container-qty-${index}`}
                  label="Weight (kg)"
                  required
                  error={errors.containers?.[index]?.quantityKg?.message}
                >
                  <Input
                    type="number"
                    step={1}
                    inputMode="decimal"
                    {...register(`containers.${index}.quantityKg`, {
                      valueAsNumber: true,
                    })}
                    disabled={pending}
                  />
                </FormField>

                <FormField
                  id={`container-seal-${index}`}
                  label="Seal ref"
                  required={tamperSealEnabled}
                  error={errors.containers?.[index]?.sealId?.message}
                >
                  <Input
                    placeholder={tamperSealEnabled ? "Required" : "Optional"}
                    {...register(`containers.${index}.sealId`)}
                    disabled={pending}
                  />
                </FormField>

                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="mb-0.5 h-10 w-10 text-rose-600"
                  onClick={() => removeContainer(index)}
                  disabled={pending || containerFields.length <= 2}
                  aria-label={`Remove container ${index + 1}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}

            <div className="flex flex-wrap items-center justify-between gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  appendContainer({
                    id: `ctn_${Date.now()}_${containerFields.length}`,
                    label: `Reefer container ${String.fromCharCode(
                      65 + containerFields.length
                    )}`,
                    quantityKg: 0,
                  })
                }
                disabled={pending}
              >
                <Plus className="mr-1.5 h-3.5 w-3.5" /> Add container
              </Button>

              <span
                className={cn(
                  "text-[11px] font-semibold",
                  Math.abs(unallocatedKg) <= 0.01 ? "text-emerald-700" : "text-amber-700"
                )}
              >
                Allocated {containerTotal.toLocaleString()} /{" "}
                {Number(quantityKg || 0).toLocaleString()} kg · unallocated{" "}
                {unallocatedKg.toLocaleString()} kg
              </span>
            </div>

            {errors.containers?.message && (
              <p className="text-xs font-medium text-rose-600">
                {errors.containers.message}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Conditional: tamper-evident sealing */}
      <div className="space-y-3">
        <ToggleField
          id="tamper-seal"
          label="Tamper-evident seal applied"
          hint="Records the seal reference used to detect mid-transit interference"
          checked={tamperSealEnabled}
          onToggle={handleSealToggle}
          disabled={pending}
        />

        {tamperSealEnabled && (
          <FormField
            id="seal-id"
            label="Master seal reference"
            required
            hint="Min 4 characters"
            error={errors.sealId?.message}
          >
            <Input
              placeholder="SEAL-2291-CA"
              {...register("sealId")}
              disabled={pending}
            />
          </FormField>
        )}
      </div>

      {/* Review before submit */}
      <div className="rounded-lg border border-slate-200 bg-white p-3.5">
        <p className="mb-1 text-xs font-semibold text-slate-700">
          Review registration
        </p>
        <div className="divide-y divide-slate-100">
          <SummaryRow label="Produce" value={produceName || "—"} />
          <SummaryRow label="Category" value={category} />
          <SummaryRow
            label="Batch weight"
            value={`${Number(quantityKg || 0).toLocaleString()} kg`}
          />
          <SummaryRow label="Storage mode" value={STORAGE_MODE_LABELS[storageMode]} />
          <SummaryRow
            label="SLA envelope"
            value={
              isColdChain && tempMin !== undefined && tempMax !== undefined
                ? `${formatTemperature(tempMin)} – ${formatTemperature(tempMax)}`
                : "Ambient (no cold-chain window)"
            }
          />
          <SummaryRow label="Destination" value={DESTINATION_LABELS[destinationType]} />
          <SummaryRow
            label="Transport"
            value={requiresTransport ? transporterId || "Not assigned" : "Farm pickup"}
          />
          <SummaryRow
            label="Containers"
            value={
              splitsIntoContainers
                ? `${containerFields.length} units · ${containerTotal.toLocaleString()} kg allocated`
                : "Single reefer unit"
            }
          />
          <SummaryRow
            label="Tamper seal"
            value={tamperSealEnabled ? sealId || "Reference required" : "Not sealed"}
          />
          <SummaryRow
            label="Evidence photos"
            value={`${photos.length} attached${evidenceRequired && photos.length === 0 ? " · required" : ""}`}
          />
          <SummaryRow
            label="Route"
            value={`${originName || "—"} → ${destinationName || "—"}`}
          />
          <SummaryRow label="Notes" value={notes || "None"} />
        </div>
      </div>

      {reviewIssues.length > 0 && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-3.5">
          <p className="text-xs font-semibold text-rose-800">
            {reviewIssues.length} field
            {reviewIssues.length === 1 ? "" : "s"} need attention before this batch can be
            registered
          </p>
          <ul className="mt-1.5 space-y-1">
            {reviewIssues.map((issue) => (
              <li key={issue.path} className="text-[11px] text-rose-700">
                <span className="font-semibold">
                  {FIELD_LABELS[issue.path] ?? issue.path}:
                </span>{" "}
                {issue.message}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );

  const stepsDone = step - 1;

  return (
    <form onSubmit={onSubmit} className="relative isolate min-w-0 space-y-5" noValidate>
      {/* Stepper */}
      <ol className="flex items-center gap-2">
        {STEPS.map((config, index) => {
          const isActive = config.id === step;
          const isDone = config.id <= stepsDone;

          return (
            <li key={config.id} className="flex flex-1 items-center gap-2">
              <span
                className={cn(
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[11px] font-bold",
                  isActive && "border-emerald-600 bg-emerald-600 text-white",
                  !isActive && isDone && "border-emerald-200 bg-emerald-50 text-emerald-700",
                  !isActive && !isDone && "border-slate-200 bg-white text-slate-400"
                )}
              >
                {config.id}
              </span>
              <span
                className={cn(
                  "text-xs font-semibold",
                  isActive ? "text-slate-900" : "text-slate-400"
                )}
              >
                {config.title}
              </span>
              {index < STEPS.length - 1 && (
                <span className="h-px flex-1 bg-slate-200" aria-hidden="true" />
              )}
            </li>
          );
        })}
      </ol>

      {!isOnline && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3">
          <WifiOff className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" aria-hidden="true" />
          <p className="text-xs text-amber-800">
            <span className="font-semibold">Offline — queueing enabled.</span> This batch will
            be stored in the local outbox and synced automatically once you reconnect.
          </p>
        </div>
      )}

      {step === 1 && renderStepOne()}
      {step === 2 && renderStepTwo()}
      {step === 3 && renderStepThree()}

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-slate-200 pt-4">
        <Button
          type="button"
          variant="ghost"
          onClick={goBack}
          disabled={step === 1 || pending}
        >
          <ChevronLeft className="mr-1 h-3.5 w-3.5" /> Back
        </Button>

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-400">
            Step {step} of {STEPS.length}
          </span>

          {step < STEPS.length ? (
            <Button type="button" onClick={() => void goNext()} disabled={pending}>
              Next <ChevronRight className="ml-1 h-3.5 w-3.5" />
            </Button>
          ) : (
            <Button type="submit" disabled={pending}>
              {pending ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Registering…
                </>
              ) : isOnline ? (
                "Register batch"
              ) : (
                "Queue batch offline"
              )}
            </Button>
          )}
        </div>
      </div>
    </form>
  );
}
